const Job = require('../models/Job');
const parseVErr = require('../util/parseValidationErrs');

const getAllJobs = async (req, res, next) => {
  const userId = req.user._id;
  try {
    const jobs = await Job.find({ createdBy: userId }).sort('createdAt');
    jobs.map((job) => {
      job['salaryRangeFormat'] =
        `${job.salaryRange.min} - ${job.salaryRange.max} ${job.salaryRange.currency}`;
      job['appliedDateFormat'] = job.appliedDate.toLocaleDateString();
      return job;
    });
    res.render('jobs', { jobs });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load jobs.');
    res.redirect('/');
  }
};

const createJob = async (req, res, next) => {
  try {
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

const getEditJobPage = async (req, res) => {
  const {
    user: { _id: userId },
    params: { id: jobId },
  } = req;
  try {
    const job = await Job.findOne({ _id: jobId, createdBy: userId });
    if (!job) {
      req.flash('error', 'Job not found.');
      return res.redirect('/jobs');
    }
    return res.render('job', {
      job,
      _csrf: res.locals._csrf,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const updateJob = async (req, res) => {
  try {
    const {
      user: { _id: userId },
      params: { id: jobId },
    } = req;
    const job = await Job.findOneAndUpdate(
      { _id: jobId, createdBy: userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!job) {
      req.flash('error', `No job with id: ${jobId}`);
      return res.redirect('/jobs');
    }
    req.flash('info', 'Job updated successfully!');
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

const deleteJob = async (req, res) => {
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
