const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  worker_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  worker_name: {
    type: String,
    required: true,
    trim: true
  },
  withdrawal_coin: {
    type: Number,
    required: true,
    min: 200
  },
  withdrawal_amount: {
    type: Number,
    required: true,
    min: 10
  },
  payment_system: {
    type: String,
    required: true,
    enum: ['Stripe', 'Bkash', 'Rocket', 'Nagad']
  },
  account_number: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for faster queries
withdrawalSchema.index({ worker_email: 1 });
withdrawalSchema.index({ status: 1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);