const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Agent = require('../models/Agent');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all agents (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const agents = await Agent.find({}, '-password');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agents', error: error.message });
  }
});

// Get agents by location
router.get('/location/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const agents = await Agent.find({ location, isActive: true }, '-password');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agents by location', error: error.message });
  }
});

// Add new agent
router.post('/', async (req, res) => {
  try {
    const { name, email, password, location, role } = req.body;

    // Check if agent already exists
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(400).json({ message: 'Agent with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new agent
    const newAgent = new Agent({
      name,
      email,
      password: hashedPassword,
      location,
      role: role || 'agent'
    });

    const savedAgent = await newAgent.save();
    
    // Return agent without password
    const { password: _, ...agentWithoutPassword } = savedAgent.toObject();
    res.status(201).json(agentWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error creating agent', error: error.message });
  }
});

// Update agent
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // If password is being updated, hash it
    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedAgent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(updatedAgent);
  } catch (error) {
    res.status(500).json({ message: 'Error updating agent', error: error.message });
  }
});

// Delete agent (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json({ message: 'Agent deactivated successfully', agent });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating agent', error: error.message });
  }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findById(id).select('-password');
    
    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching agent', error: error.message });
  }
});

module.exports = router;
