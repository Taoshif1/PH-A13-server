const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/verifyToken');
const verifyWorker = require('../middleware/verifyWorker');
const verifyBuyer = require('../middleware/verifyBuyer');

// Worker: Submit a task
router.post('/submit', verifyToken, verifyWorker, async (req, res) => {
  try {
    const { task_id, submission_details } = req.body;

    // Get task details
    const task = await Task.findById(task_id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Check if task has available slots
    if (task.required_workers <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'This task has no available slots' 
      });
    }

    // Check if worker already submitted this task
    const existingSubmission = await Submission.findOne({
      task_id,
      worker_email: req.user.email
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already submitted this task' 
      });
    }

    // Get worker info
    const worker = await User.findOne({ email: req.user.email });

    // Create submission
    const submission = new Submission({
      task_id,
      task_title: task.task_title,
      payable_amount: task.payable_amount,
      worker_email: worker.email,
      worker_name: worker.name,
      buyer_email: task.buyer_email,
      buyer_name: task.buyer_name,
      submission_details,
      status: 'pending',
      submission_date: new Date()
    });

    await submission.save();

    // Create notification for buyer
    const notification = new Notification({
      message: `New submission received from ${worker.name} for task "${task.task_title}"`,
      toEmail: task.buyer_email,
      actionRoute: '/dashboard/buyer-home',
      time: new Date()
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      submission
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Worker: Get my submissions (with pagination)
router.get('/my-submissions', verifyToken, verifyWorker, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const submissions = await Submission.find({ worker_email: req.user.email })
      .sort({ submission_date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Submission.countDocuments({ worker_email: req.user.email });

    res.json({
      success: true,
      submissions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSubmissions: total,
        hasMore: skip + submissions.length < total
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

// Worker: Get approved submissions
router.get('/approved', verifyToken, verifyWorker, async (req, res) => {
  try {
    const submissions = await Submission.find({ 
      worker_email: req.user.email,
      status: 'approved'
    }).sort({ submission_date: -1 });

    res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Worker: Get worker stats
router.get('/worker/stats', verifyToken, verifyWorker, async (req, res) => {
  try {
    const totalSubmissions = await Submission.countDocuments({ 
      worker_email: req.user.email 
    });

    const pendingSubmissions = await Submission.countDocuments({ 
      worker_email: req.user.email,
      status: 'pending'
    });

    const approvedSubmissions = await Submission.find({ 
      worker_email: req.user.email,
      status: 'approved'
    });

    const totalEarnings = approvedSubmissions.reduce(
      (sum, sub) => sum + sub.payable_amount, 
      0
    );

    res.json({
      success: true,
      stats: {
        totalSubmissions,
        pendingSubmissions,
        totalEarnings
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

// Buyer: Get pending submissions for my tasks
router.get('/buyer/pending', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const submissions = await Submission.find({ 
      buyer_email: req.user.email,
      status: 'pending'
    }).sort({ submission_date: -1 });

    res.json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Buyer: Approve submission
router.patch('/:id/approve', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      buyer_email: req.user.email,
      status: 'pending'
    });

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found or already processed' 
      });
    }

    // Update submission status
    submission.status = 'approved';
    await submission.save();

    // Increase worker's coins
    const worker = await User.findOne({ email: submission.worker_email });
    worker.coin += submission.payable_amount;
    await worker.save();

    // Decrease task's required workers
    const task = await Task.findById(submission.task_id);
    if (task) {
      task.required_workers = Math.max(0, task.required_workers - 1);
      await task.save();
    }

    // Create notification for worker
    const notification = new Notification({
      message: `You have earned ${submission.payable_amount} coins from ${submission.buyer_name} for completing "${submission.task_title}"`,
      toEmail: submission.worker_email,
      actionRoute: '/dashboard/worker-home',
      time: new Date()
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Submission approved successfully',
      submission
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Buyer: Reject submission
router.patch('/:id/reject', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      _id: req.params.id,
      buyer_email: req.user.email,
      status: 'pending'
    });

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found or already processed' 
      });
    }

    // Update submission status
    submission.status = 'rejected';
    await submission.save();

    // Increase task's required workers by 1
    const task = await Task.findById(submission.task_id);
    if (task) {
      task.required_workers += 1;
      await task.save();
    }

    // Create notification for worker
    const notification = new Notification({
      message: `Your submission for "${submission.task_title}" was rejected by ${submission.buyer_name}`,
      toEmail: submission.worker_email,
      actionRoute: '/dashboard/my-submissions',
      time: new Date()
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Submission rejected',
      submission
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