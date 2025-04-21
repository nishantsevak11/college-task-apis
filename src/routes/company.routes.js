const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const Company = require('../models/company.model');

// Get all companies
router.get('/', authenticate, async (req, res) => {
  try {
    const companies = await Company.find({ 'members.user': req.user._id })
      .populate('owner', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

// Get company by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email');
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const isMember = company.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember && company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching company' });
  }
});

// Create company
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const company = new Company({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    await company.save();
    
    // Update user's companies
    await req.user.updateOne({
      $push: { companies: { company: company._id, role: 'owner' } }
    });

    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ message: 'Error creating company' });
  }
});

// Update company
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    company.name = name;
    company.description = description;
    await company.save();

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: 'Error updating company' });
  }
});

// Delete company
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await company.deleteOne();

    // Remove company from all users' companies array
    await req.user.updateOne({
      $pull: { companies: { company: company._id } }
    });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting company' });
  }
});

module.exports = router;