const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/verifyToken');
const verifyBuyer = require('../middleware/verifyBuyer');
const verifyAdmin = require('../middleware/verifyAdmin');

// Buyer: Add new task
router.post('/add', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const {
      task_title,
      task_detail,
      required_workers,
      payable_amount,
      completion_date,
      submission_info,
      task_image_url
    } = req.body;

    // Calculate total payable amount
    const totalPayable = required_workers * payable_amount;

    // Get buyer's current coin
    const buyer = await User.findOne({ email: req.user.email });

    if (!buyer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Buyer not found' 
      });
    }

    // Check if buyer has enough coins
    if (buyer.coin < totalPayable) {
      return res.status(400).json({
        success: false,
        message: 'Not available Coin. Purchase Coin',
        required: totalPayable,
        available: buyer.coin
      });
    }

    // Create task
    const task = new Task({
      task_title,
      task_detail,
      required_workers,
      payable_amount,
      completion_date,
      submission_info,
      task_image_url: task_image_url || '',
      buyer_email: buyer.email,
      buyer_name: buyer.name
    });

    await task.save();

    // Deduct coins from buyer
    buyer.coin -= totalPayable;
    await buyer.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
      remainingCoins: buyer.coin
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Worker: Get all available tasks (required_workers > 0)
router.get('/available', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ required_workers: { $gt: 0 } })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Get single task by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Buyer: Get my tasks
router.get('/buyer/my-tasks', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const tasks = await Task.find({ buyer_email: req.user.email })
      .sort({ completion_date: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Buyer: Get buyer stats
router.get('/buyer/stats', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const tasks = await Task.find({ buyer_email: req.user.email });
    
    const totalTasks = tasks.length;
    const pendingTasks = tasks.reduce((sum, task) => sum + task.required_workers, 0);

    // Get total payments from Payment model
    const Payment = require('../models/Payment');
    const payments = await Payment.find({ buyer_email: req.user.email });
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.json({
      success: true,
      stats: {
        totalTasks,
        pendingTasks,
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

// Buyer: Update task
router.patch('/:id', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const { task_title, task_detail, submission_info } = req.body;

    const task = await Task.findOne({ 
      _id: req.params.id, 
      buyer_email: req.user.email 
    });

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found or unauthorized' 
      });
    }

    // Update only allowed fields
    if (task_title) task.task_title = task_title;
    if (task_detail) task.task_detail = task_detail;
    if (submission_info) task.submission_info = submission_info;

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Buyer: Delete task
router.delete('/:id', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      buyer_email: req.user.email 
    });

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found or unauthorized' 
      });
    }

    // Calculate refund amount for uncompleted task
    const refundAmount = task.required_workers * task.payable_amount;

    // Refund coins to buyer
    const buyer = await User.findOne({ email: req.user.email });
    buyer.coin += refundAmount;
    await buyer.save();

    // Delete task
    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully',
      refundAmount,
      newCoinBalance: buyer.coin
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Get all tasks
router.get('/admin/all-tasks', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Delete any task
router.delete('/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
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