const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

// Get current user info
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        coin: user.coin
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Get top 6 workers by coins (for homepage)
router.get('/top-workers', async (req, res) => {
  try {
    const topWorkers = await User.find({ role: 'Worker' })
      .sort({ coin: -1 })
      .limit(6)
      .select('name photoURL coin');

    res.json({
      success: true,
      workers: topWorkers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Get all users
router.get('/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-firebaseUID');

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Update user role
router.patch('/:id/role', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['Worker', 'Buyer', 'Admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'Role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Delete user
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Get dashboard stats
router.get('/stats/admin', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalWorkers = await User.countDocuments({ role: 'Worker' });
    const totalBuyers = await User.countDocuments({ role: 'Buyer' });
    
    const users = await User.find();
    const totalCoins = users.reduce((sum, user) => sum + user.coin, 0);

    // Get total payments
    const payments = await Payment.find();
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.json({
      success: true,
      stats: {
        totalWorkers,
        totalBuyers,
        totalCoins,
        totalPayments
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;