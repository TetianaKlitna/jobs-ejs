const express = require('express');
require('express-async-errors');
require('dotenv').config();

const app = express();

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
const { trusted } = require('mongoose');

app.set('view engine', 'ejs');
app.use(require('body-parser').urlencoded({ extended: true }));

const url = process.env.MONGO_URI;
const port = process.env.PORT || 3000;

const store = new MongoDBStore({
  uri: url,
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
  if (req.method === 'GET') {
    csrf.getToken(req, res);
  }
  next();
});

app.get('/', (req, res) => {
  res.render('index');
});

app.use('/sessions', require('./routes/sessionRoutes'));
app.use(
  '/secretWord',
  require('./middleware/auth'),
  csrfMiddleware,
  require('./routes/secretWord')
);

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const start = async () => {
  try {
    await require('./db/connect')(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
