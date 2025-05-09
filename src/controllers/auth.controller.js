const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = new User({
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    // Check for pending invitations
    const Invitation = require('../models/invitation.model');
    const pendingInvitations = await Invitation.find({
      email: email.toLowerCase(),
      status: 'pending'
    }).populate('company', 'name');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      pendingInvitations: pendingInvitations.map(inv => ({
        id: inv._id,
        companyId: inv.company._id,
        companyName: inv.company.name,
        role: inv.role
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check for pending invitations
    const Invitation = require('../models/invitation.model');
    const Company = require('../models/company.model');
    
    const pendingInvitations = await Invitation.find({
      email: email.toLowerCase(),
      status: 'pending'
    }).populate('company', 'name');

    // Get companies where user is a member
    const userCompanies = await Company.find({
      'members.user': user._id
    }, 'name');

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      pendingInvitations: pendingInvitations.map(inv => ({
        id: inv._id,
        companyId: inv.company._id,
        companyName: inv.company.name,
        role: inv.role,
        status: inv.status
      })),
      companies: userCompanies.map(company => ({
        id: company._id,
        name: company.name
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In a real application, send email with reset link
    res.json({ message: 'Password reset instructions sent to email' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing password reset' });
  }
};

exports.getPendingInvitations = async (req, res) => {
  try {
    const { email } = req.query;
    const Invitation = require('../models/invitation.model');
    const pendingInvitations = await Invitation.find({
      email: email.toLowerCase(),
      status: 'pending'
    }).populate('company', 'name');

    res.json({
      pendingInvitations: pendingInvitations.map(inv => ({
        id: inv._id,
        companyId: inv.company._id,
        companyName: inv.company.name,
        role: inv.role
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending invitations' });
  }
}