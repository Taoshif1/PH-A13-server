const User = require('../models/User');

const verifyAdmin = (req, res, next) => {
  const email = req.user.email;
  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only.'
        });
      }

      next();
    })
    .catch(error => {
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    });
};

module.exports = verifyAdmin;