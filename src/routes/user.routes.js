const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

// Get current user
router.get('/current', authenticate, async (req, res) => {
  try {
    const user = await req.user.populate('companies.company');
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companies: user.companies
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

module.exports = router;