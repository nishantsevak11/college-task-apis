const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const User = require('../models/user.model');
const Company = require('../models/company.model');
const Invitation = require('../models/invitation.model');

// Get all employees for a company
router.get('/companies/:companyId/employees', authenticate, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId)
      .populate('members.user', 'firstName lastName email');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const isMember = company.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember && company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const employees = company.members.map(member => ({
      ...member.user.toObject(),
      role: member.role
    }));

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees' });
  }
});

// Get all invitations for a company
router.get('/companies/:companyId/invitations', authenticate, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const invitations = await Invitation.find({ company: req.params.companyId })
      .populate('invitedBy', 'firstName lastName email');

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invitations' });
  }
});

// Create invitation
router.post('/invitations', authenticate, async (req, res) => {
  try {
    const { companyId, email, role } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const existingInvitation = await Invitation.findOne({
      company: companyId,
      email,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent' });
    }

    const invitation = new Invitation({
      company: companyId,
      email,
      role,
      invitedBy: req.user._id
    });

    await invitation.save();

    const populatedInvitation = await Invitation.findById(invitation._id)
      .populate('invitedBy', 'firstName lastName email');

    res.status(201).json(populatedInvitation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invitation' });
  }
});

// Accept invitation
router.post('/invitations/:id/accept', authenticate, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    const company = await Company.findById(invitation.company);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Add user to company members
    company.members.push({
      user: req.user._id,
      role: invitation.role
    });
    await company.save();

    // Update user's companies
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        companies: {
          company: company._id,
          role: invitation.role
        }
      }
    });

    invitation.status = 'accepted';
    await invitation.save();

    res.json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting invitation' });
  }
});

// Reject invitation
router.post('/invitations/:id/reject', authenticate, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    invitation.status = 'rejected';
    await invitation.save();

    res.json({ message: 'Invitation rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting invitation' });
  }
});

// Cancel invitation (by company owner)
router.delete('/invitations/:id', authenticate, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id)
      .populate('company');
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    await invitation.deleteOne();
    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling invitation' });
  }
});

// Update team member role
router.patch('/companies/:companyId/members/:userId/role', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    const company = await Company.findById(req.params.companyId);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const memberIndex = company.members.findIndex(
      member => member.user.toString() === req.params.userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    company.members[memberIndex].role = role;
    await company.save();

    // Update user's role in their companies array
    await User.updateOne(
      { 
        _id: req.params.userId,
        'companies.company': req.params.companyId
      },
      {
        $set: { 'companies.$.role': role }
      }
    );

    res.json({ message: 'Team member role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating team member role' });
  }
});

// Remove team member
router.delete('/companies/:companyId/members/:userId', authenticate, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (company.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove company owner' });
    }

    company.members = company.members.filter(
      member => member.user.toString() !== req.params.userId
    );
    await company.save();

    // Remove company from user's companies array
    await User.updateOne(
      { _id: req.params.userId },
      { $pull: { companies: { company: req.params.companyId } } }
    );

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing team member' });
  }
});

module.exports = router;