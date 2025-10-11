const express = require('express');
const jobsRouter = express.Router();
const {
  getAllJobs,
  getEditJobPage,
  createJob,
  updateJob,
  deleteJob,
} = require('../controllers/jobs');

jobsRouter.get('/new', (req, res) => {
  res.render('job', { job: null });
});

jobsRouter.get('/edit/:id', getEditJobPage);

jobsRouter.route('/').post(createJob).get(getAllJobs);
jobsRouter.route('/:id').delete(deleteJob).patch(updateJob);

module.exports = jobsRouter;
