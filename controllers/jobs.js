const Job = require('../models/Job');
const parseVErr = require('../util/parseValidationErrs');
const { dateInputToUtc, utcToDateInput } = require('../util/dateUtils');

const getAllJobs = async (req, res, next) => {
  const userId = req.user._id;
  const userTz = req.userTz;
  try {
    const jobs = await Job.find({ createdBy: userId }).sort('createdAt');
    jobs.forEach((job) => {
      job.salaryRangeFormat = `${job.salaryRange.min} - ${job.salaryRange.max} ${job.salaryRange.currency}`;
      job['appliedDateLocal'] = utcToDateInput(
        job.appliedDate,
        userTz,
        (dateFormat = 'MM/dd/yyyy')
      );
    });
    res.render('jobs', { jobs });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const userTz = req.userTz;
    await Job.create({
      company: req.body.company,
      position: req.body.position,
      workMode: req.body.workMode,
      jobType: req.body.jobType,
      location: req.body.location,
      salaryRange: {
        min: req.body.salaryMin,
        max: req.body.salaryMax,
        currency: req.body.currency,
      },
      appliedDate: dateInputToUtc(req.body.appliedDate, userTz),
      createdBy: req.user._id,
    });
    req.flash('info', 'Job created successfully!');
    return res.redirect('/jobs');
  } catch (error) {
    console.error(error);
    if (error.constructor.name === 'ValidationError') {
      parseVErr(error, req);
      return res.render('job', {
        job: null,
        _csrf: res.locals._csrf,
        errors: req.flash('error'),
      });
    }
    return next(error);
  }
};

const getEditJobPage = async (req, res, next) => {
  const {
    user: { _id: userId },
    params: { id: jobId },
    userTz,
  } = req;
  try {
    const job = await Job.findOne({ _id: jobId, createdBy: userId });
    if (!job) {
      req.flash('error', 'Job not found.');
      return res.redirect('/jobs');
    }
    job['appliedDateLocal'] = utcToDateInput(job.appliedDate, userTz);
    return res.render('job', {
      job,
      _csrf: res.locals._csrf,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// const updateJob = async (req, res, next) => {
//   try {
//     const {
//       user: { _id: userId },
//       params: { id: jobId },
//     } = req;
//     const updatedJob = await Job.findOneAndUpdate(
//       { _id: jobId, createdBy: userId },
//       req.body,
//       { new: true, runValidators: true }
//     );
//     if (!updatedJob) {
//       req.flash('error', `No job with id: ${jobId}`);
//       return res.redirect('/jobs');
//     }
//     // updatedJob.salaryRange = req.body.salaryRange;
//     // await updatedJob.save();
//     req.flash('info', 'Job updated successfully!');
//     return res.redirect('/jobs');
//   } catch (error) {
//     console.error(error);
//     if (error.constructor.name === 'ValidationError') {
//       parseVErr(error, req);
//       return res.render('job', {
//         job: req.body,
//         _csrf: res.locals._csrf,
//         errors: req.flash('error'),
//       });
//     }
//     return next(error);
//   }
// };

const updateJob = async (req, res, next) => {
  try {
    const {
      user: { _id: userId },
      params: { id: jobId },
      body,
    } = req;
    const userTz = req.userTz;

    const job = await Job.findOne({ _id: jobId, createdBy: userId });
    if (!job) {
      req.flash('error', `No job with id: ${jobId}`);
      return res.redirect('/jobs');
    }

    job.appliedDate = dateInputToUtc(body.appliedDate, userTz);

    if (body.salaryRange) {
      job.salaryRange = {
        ...job.salaryRange,
        ...body.salaryRange,
        min: Number(body.salaryRange.min ?? job.salaryRange?.min),
        max: Number(body.salaryRange.max ?? job.salaryRange?.max),
      };
    }

    [
      'company',
      'position',
      'status',
      'workMode',
      'jobType',
      'location',
    ].forEach((k) => body[k] !== undefined && (job[k] = body[k]));

    await job.save();
    req.flash('info', 'Job updated successfully!');
    return res.redirect('/jobs');
  } catch (error) {
    if (error.name === 'ValidationError') {
      parseVErr(error, req);
      return res.render('job', {
        job: { _id: req.params.id, ...req.body },
        _csrf: res.locals._csrf,
        errors: req.flash('error'),
      });
    }
    return next(error);
  }
};

const deleteJob = async (req, res, next) => {
  const {
    user: { _id: userId },
    params: { id: jobId },
  } = req;
  try {
    const job = await Job.findOneAndDelete({ _id: jobId, createdBy: userId });
    if (!job) {
      req.flash('error', 'Job not found.');
      return res.redirect('/jobs');
    }
    req.flash('info', 'Job deleted successfully!');
    return res.redirect('/jobs');
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  getAllJobs,
  getEditJobPage,
  createJob,
  updateJob,
  deleteJob,
};
