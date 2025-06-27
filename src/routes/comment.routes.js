const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const Comment = require('../models/comment.model');
const Task = require('../models/task.model');
const Company = require('../models/company.model');

// Get comments for a task
router.get('/task/:taskId', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
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

    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

// Create comment
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, taskId } = req.body;

    const task = await Task.findById(taskId);
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

    const comment = new Comment({
      content,
      task: taskId,
      author: req.user._id
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'firstName lastName email');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating comment' });
  }
});

// Update comment
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    comment.content = content;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', 'firstName lastName email');

    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating comment' });
  }
});

// Delete comment
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // To check for owner, we need the company context
    const task = await Task.findById(comment.task);
    if (!task) {
         // This case might happen if the task was deleted but the comment wasn't
         await comment.deleteOne();
         return res.json({ message: 'Comment for a non-existent task deleted successfully' });
    }

    const company = await Company.findById(task.company);
    if(!company){
        return res.status(404).json({ message: 'Associated company not found.' });
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isOwner = company.owner.toString() === req.user._id.toString();

    // *** CORRECTED LOGIC ***
    // Allow deletion if the user is the author OR the company owner.
    if (!isAuthor && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own comments or you must be the company owner.' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

module.exports = router;