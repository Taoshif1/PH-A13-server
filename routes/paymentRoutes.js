const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const verifyBuyer = require('../middleware/verifyBuyer');
const verifyAdmin = require('../middleware/verifyAdmin');

// Create Stripe payment intent
router.post('/create-payment-intent', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const { amount, coins } = req.body; // amount in dollars, coins to purchase

    if (!amount || !coins) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount and coins are required' 
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        buyer_email: req.user.email,
        coins: coins.toString()
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment intent',
      error: error.message 
    });
  }
});

// Confirm payment and update coins
router.post('/confirm-payment', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const { paymentIntentId, amount, coins } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment not completed' 
      });
    }

    // Get buyer
    const buyer = await User.findOne({ email: req.user.email });

    // Create payment record
    const payment = new Payment({
      buyer_email: buyer.email,
      buyer_name: buyer.name,
      amount,
      coin_purchased: coins,
      transaction_id: paymentIntentId,
      payment_method: 'stripe',
      payment_date: new Date(),
      status: 'completed'
    });

    await payment.save();

    // Increase buyer's coins
    buyer.coin += coins;
    await buyer.save();

    res.json({
      success: true,
      message: 'Payment successful! Coins added to your account',
      payment,
      newCoinBalance: buyer.coin
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process payment',
      error: error.message 
    });
  }
});

// Buyer: Get payment history
router.get('/history', verifyToken, verifyBuyer, async (req, res) => {
  try {
    const payments = await Payment.find({ buyer_email: req.user.email })
      .sort({ payment_date: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Admin: Get all payments
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ payment_date: -1 });
    
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.json({
      success: true,
      count: payments.length,
      totalAmount,
      payments
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