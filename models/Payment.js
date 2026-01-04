const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  buyer_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  coins_purchased: {
    type: Number,
    required: true,
    min: 0
  },
  stripe_payment_id: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ buyer_email: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);