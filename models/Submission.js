const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  task_title: {
    type: String,
    required: true,
    trim: true
  },
  payable_amount: {
    type: Number,
    required: true,
    min: 0
  },
  worker_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  submission_details: {
    type: String,
    required: true,
    trim: true
  },
  worker_name: {
    type: String,
    required: true,
    trim: true
  },
  buyer_name: {
    type: String,
    required: true,
    trim: true
  },
  buyer_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for faster queries
submissionSchema.index({ worker_email: 1 });
submissionSchema.index({ buyer_email: 1 });
submissionSchema.index({ task_id: 1 });
submissionSchema.index({ status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);