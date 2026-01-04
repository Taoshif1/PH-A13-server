const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      email: user.email, 
      name: user.name, 
      role: user.role,
      uid: user.firebaseUID
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register or Login User (Firebase Auth Integration)
router.post('/register-or-login', async (req, res) => {
  try {
    const { name, email, photoURL, firebaseUID, role } = req.body;

    // Validate required fields
    if (!email || !firebaseUID) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and Firebase UID are required' 
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - Login
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          role: user.role,
          coin: user.coin
        }
      });
    }

    // User doesn't exist - Register
    if (!name || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and role are required for registration' 
      });
    }

    // Assign initial coins based on role
    const initialCoins = role === 'Worker' ? 10 : role === 'Buyer' ? 50 : 0;

    // Create new user
    user = new User({
      name,
      email,
      photoURL: photoURL || '',
      firebaseUID,
      role,
      coin: initialCoins
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role,
        coin: user.coin
      }
    });

  } catch (error) {
    console.error('Auth Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication',
      error: error.message 
    });
  }
});

// Verify Token Route (Optional - for client to verify token validity)
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({ email: decoded.email });
    
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
    res.status(403).json({ 
      success: false, 
      message: 'Invalid token',
      error: error.message 
    });
  }
});

module.exports = router;