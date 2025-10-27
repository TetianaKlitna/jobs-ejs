const express = require('express');
require('express-async-errors');
require('dotenv').config();

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');

const app = express();

const methodOverride = require('method-override');

const cookieParser = require('cookie-parser');
const csrf = require('host-csrf');

app.use(cookieParser(process.env.COOKIE_SECRET));
const csrfMiddleware = csrf.csrf();

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const passport = require('passport');
const passportInit = require('./passport/passportInit');

const connectFlash = require('connect-flash');
const storeLocals = require('./middleware/storeLocals');

const authMiddleware = require('./middleware/auth');

const secretWordRouter = require('./routes/secretWord');
const jobsRouter = require('./routes/jobs');

app.set('view engine', 'ejs');
app.use(require('body-parser').urlencoded({ extended: true }));

// If behind a proxy/load balancer
app.set('trust proxy', 1);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use(helmet());
app.use(xss());

app.use(
  methodOverride((req, res) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      const m = String(req.body._method || '')
        .toUpperCase()
        .trim();
      delete req.body._method;
      return m;
    }
    return undefined;
  })
);

let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == 'test') {
  mongoURL = process.env.MONGO_URI_TEST;
}

const store = new MongoDBStore({
  uri: mongoURL,
  collection: 'mySessions',
});
store.on('error', function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  // sessionParms.cookie.secure = true is important,
  // but the session cookie won’t work unless SSL is present.
  cookie: { secure: false, sameSite: 'strict' },
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));

passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.use(connectFlash());
app.use(storeLocals);

app.use(csrfMiddleware);

app.use((req, res, next) => {
  const match = /(?:^|;\s*)tz=([^;]+)/.exec(req.headers.cookie || '');
  req['userTz'] = match ? decodeURIComponent(match[1]) : 'UTC';
  next();
});

app.use((req, res, next) => {
  if (req.method === 'GET') {
    csrf.getToken(req, res);
  }
  next();
});

app.use((req, res, next) => {
  if (req.path == '/multiply') {
    res.set('Content-Type', 'application/json');
  } else {
    res.set('Content-Type', 'text/html');
  }
  next();
});

app.get('/', (req, res) => {
  res.render('index');
});

app.use('/sessions', require('./routes/sessionRoutes'));
app.use('/secretWord', authMiddleware, secretWordRouter);
app.use('/jobs', authMiddleware, jobsRouter);

app.get('/multiply', (req, res) => {
  const result = req.query.first * req.query.second;
  if (result.isNaN) {
    result = 'NaN';
  } else if (result == null) {
    result = 'null';
  }
  res.json({ result: result });
});

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3001;

const start = () => {
  try {
    require('./db/connect')(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };
