const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/verifyToken');
const verifyWorker = require('../middleware/verifyWorker');
const verifyAdmin = require('../middleware/verifyAdmin');

// Worker: Create withdrawal request
router.post('/request', verifyToken, verifyWorker, async (req, res) => {
  try {
    const { withdrawal_coin, withdrawal_amount, payment_system, account_number } = req.body;

    // Validation
    if (!withdrawal_coin || !withdrawal_amount || !payment_system || !account_number) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Get worker
    const worker = await User.findOne({ email: req.user.email });

    // Check if worker has enough coins
    if (worker.coin < withdrawal_coin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient coins',
        available: worker.coin,
        required: withdrawal_coin
      });
    }

    // Minimum withdrawal check (200 coins = 10 dollars)
    if (withdrawal_coin < 200) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum withdrawal is 200 coins (10 dollars)' 
      });
    }

    // Verify conversion rate (20 coins = 1 dollar)
    const expectedAmount = withdrawal_coin / 20;
    if (Math.abs(withdrawal_amount - expectedAmount) > 0.01) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid withdrawal amount. 20 coins = 1 dollar' 
      });
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      worker_email: worker.email,
      worker_name: worker.name,
      withdrawal_coin,
      withdrawal_amount,
      payment_system,
      account_number,
      withdraw_date: new Date(),
      status: 'pending'
    });

    await withdrawal.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Worker: Get my withdrawals
router.get('/my-withdrawals', verifyToken, verifyWorker, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ worker_email: req.user.email })
      .sort({ withdraw_date: -1 });

    res.json({
      success: true,
      count: withdrawals.length,
      withdrawals
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Get all pending withdrawal requests
router.get('/admin/pending', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .sort({ withdraw_date: -1 });

    res.json({
      success: true,
      count: withdrawals.length,
      withdrawals
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Get all withdrawals
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .sort({ withdraw_date: -1 });

    res.json({
      success: true,
      count: withdrawals.length,
      withdrawals
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Approve withdrawal request
router.patch('/:id/approve', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findOne({
      _id: req.params.id,
      status: 'pending'
    });

    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Withdrawal request not found or already processed' 
      });
    }

    // Update withdrawal status
    withdrawal.status = 'approved';
    await withdrawal.save();

    // Deduct coins from worker
    const worker = await User.findOne({ email: withdrawal.worker_email });
    worker.coin -= withdrawal.withdrawal_coin;
    await worker.save();

    // Create notification for worker
    const notification = new Notification({
      message: `Your withdrawal request of ${withdrawal.withdrawal_amount} dollars has been approved`,
      toEmail: withdrawal.worker_email,
      actionRoute: '/dashboard/withdrawals',
      time: new Date()
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      withdrawal
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Reject withdrawal request
router.patch('/:id/reject', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findOne({
      _id: req.params.id,
      status: 'pending'
    });

    if (!withdrawal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Withdrawal request not found or already processed' 
      });
    }

    // Update withdrawal status
    withdrawal.status = 'rejected';
    await withdrawal.save();

    // Create notification for worker
    const notification = new Notification({
      message: `Your withdrawal request of ${withdrawal.withdrawal_amount} dollars has been rejected`,
      toEmail: withdrawal.worker_email,
      actionRoute: '/dashboard/withdrawals',
      time: new Date()
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Withdrawal rejected',
      withdrawal
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