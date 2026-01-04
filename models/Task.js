const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  task_title: {
    type: String,
    required: true,
    trim: true
  },
  task_detail: {
    type: String,
    required: true,
    trim: true
  },
  required_workers: {
    type: Number,
    required: true,
    min: 0
  },
  payable_amount: {
    type: Number,
    required: true,
    min: 0
  },
  completion_date: {
    type: Date,
    required: true
  },
  submission_info: {
    type: String,
    required: true,
    trim: true
  },
  task_image_url: {
    type: String,
    default: ''
  },
  buyer_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  buyer_name: {
    type: String,
    required: true,
    trim: true
  },
  total_payable_amount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
taskSchema.index({ buyer_email: 1 });
taskSchema.index({ completion_date: -1 });
taskSchema.index({ required_workers: -1 });

module.exports = mongoose.model('Task', taskSchema);