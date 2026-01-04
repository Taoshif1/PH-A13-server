const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  photoURL: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['Worker', 'Buyer', 'Admin'],
    default: 'Worker'
  },
  coin: {
    type: Number,
    default: 0
  },
  firebaseUID: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ coin: -1 });

module.exports = mongoose.model('User', userSchema);