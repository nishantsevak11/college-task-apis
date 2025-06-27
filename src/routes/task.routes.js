const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const Task = require('../models/task.model');
const Company = require('../models/company.model');

// Get tasks for a company
router.get('/company/:companyId', authenticate, async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const isMember = company.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember && company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const tasks = await Task.find({ company: req.params.companyId })
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Get single task
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('company');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const company = await Company.findById(task.company);
    const isMember = company.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember && company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task' });
  }
});

// Create task (Corrected: Only company owner can create)
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, companyId, assignedTo } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // *** CORRECTED LOGIC ***
    // Only the company owner can create a task.
    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: Only the company owner can create tasks.' });
    }

    const task = new Task({
      title,
      description,
      company: companyId,
      assignedTo,
      createdBy: req.user._id
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update task
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, status, assignedTo } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const company = await Company.findById(task.company);
    if (!company) {
        return res.status(404).json({ message: 'Associated company not found' });
    }
    
    // *** CORRECTED LOGIC ***
    // Only the company owner can update the task.
    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: Only the company owner can update tasks.' });
    }

    task.title = title;
    task.description = description;
    task.status = status;
    task.assignedTo = assignedTo;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Update task status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const company = await Company.findById(task.company);
    const isMember = company.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember && company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    task.status = status;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task status' });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const company = await Company.findById(task.company);
    if (!company) {
        return res.status(404).json({ message: 'Associated company not found' });
    }

    // *** CORRECTED LOGIC ***
    // Only the company owner can delete the task.
    if (company.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: Only the company owner can delete tasks.' });
    }

    await task.deleteOne();
    // Also delete associated comments
    await Comment.deleteMany({ task: req.params.id });

    res.json({ message: 'Task and associated comments deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

module.exports = router;