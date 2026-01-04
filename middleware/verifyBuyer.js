const User = require('../models/User');

const verifyBuyer = async (req, res, next) => {
  try {
    const email = req.user.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.role !== 'Buyer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Buyer only.' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = verifyBuyer;