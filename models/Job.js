const mongoose = require('mongoose');

const STATUS = ['interview', 'declined', 'pending'];
const WORK_MODE = ['onsite', 'remote', 'hybrid'];
const JOB_TYPE = ['full-time', 'part-time', 'contract', 'internship'];

const JobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Please provide company name'],
      maxlength: 100,
      trim: true,
    },
    position: {
      type: String,
      required: [true, 'Please provide position name'],
      maxlength: 100,
      trim: true,
    },
    status: {
      type: String,
      enum: STATUS,
      default: 'pending',
      index: true,
    },
    workMode: {
      type: String,
      enum: WORK_MODE,
      default: 'onsite',
      index: true,
    },
    jobType: {
      type: String,
      enum: JOB_TYPE,
      default: 'full-time',
      index: true,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    location: {
      type: String,
      default: 'remote',
      maxlength: 100,
    },

    salaryRange: {
      min: { type: Number, default: 80000, min: 0 },
      max: { type: Number, default: 120000, min: 0 },
      currency: { type: String, default: 'USD', uppercase: true },
    },

    description: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', JobSchema);
