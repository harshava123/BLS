const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Agent = require('../models/Agent');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Check and create admin user if needed
router.get('/check-admin', async (req, res) => {
  try {
    let adminUser = await User.findOne({ email: 'admin@gmail.com' });
    
    if (!adminUser) {
      // Create default admin user
      const passwordHash = await bcrypt.hash('admin123', 10);
      adminUser = await User.create({
        name: 'System Administrator',
        email: 'admin@gmail.com',
        passwordHash,
        role: 'admin'
      });
      res.json({ 
        message: 'Admin user created', 
        admin: { email: adminUser.email, role: adminUser.role },
        defaultPassword: 'admin123'
      });
    } else {
      res.json({ 
        message: 'Admin user exists', 
        admin: { email: adminUser.email, role: adminUser.role }
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin creates new agent (adds to agents collection)
router.post('/create-agent', async (req, res) => {
  try {
    const { name, email, password, location } = req.body;
    
    if (!name || !email || !password || !location) {
      return res.status(400).json({ message: 'Name, email, password, and location are required' });
    }
    
    // Check if agent already exists in agents collection
    const existingAgent = await Agent.findOne({ email });
    if (existingAgent) {
      return res.status(409).json({ message: 'Agent with this email already exists' });
    }
    
    // Check if user exists in users collection (for admin)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create new agent in agents collection
    const newAgent = await Agent.create({
      name,
      email,
      passwordHash,
      role: 'agent',
      location,
      isActive: true
    });
    
    // Return agent without password
    const { passwordHash: _, ...agentWithoutPassword } = newAgent.toObject();
    res.status(201).json({ 
      message: 'Agent created successfully',
      agent: agentWithoutPassword 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all agents (from agents collection)
router.get('/agents', async (req, res) => {
  try {
    console.log('🔍 Fetching agents from database...');
    
    // Check if Agent model is working
    console.log('📋 Agent model:', typeof Agent);
    console.log('📋 Agent collection name:', Agent.collection.name);
    
    // Try to get agents count first
    const count = await Agent.countDocuments();
    console.log(`📊 Total agents in collection: ${count}`);
    
    // Get all agents
    const agents = await Agent.find({}, '-passwordHash');
    console.log(`✅ Found ${agents.length} agents`);
    
    if (agents.length > 0) {
      console.log('📋 First agent sample:', {
        id: agents[0]._id,
        name: agents[0].name,
        email: agents[0].email,
        location: agents[0].location
      });
    }
    
    res.json(agents);
  } catch (err) {
    console.error('❌ Error fetching agents:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Update agent
router.put('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // If password is being updated, hash it
    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }
    
    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedAgent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    res.json(updatedAgent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete agent (hard delete from agents collection)
router.delete('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Attempting to delete agent with ID: ${id}`);
    
    // Validate ObjectId
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      console.log('❌ Invalid ObjectId format');
      return res.status(400).json({ message: 'Invalid agent ID format' });
    }
    
    // Check if agent exists before deletion
    const existingAgent = await Agent.findById(id);
    if (!existingAgent) {
      console.log('❌ Agent not found in database');
      return res.status(404).json({ message: 'Agent not found' });
    }
    
    console.log(`📋 Found agent to delete: ${existingAgent.name} (${existingAgent.email})`);
    
    // Delete the agent
    const deletedAgent = await Agent.findByIdAndDelete(id);
    console.log(`✅ Agent deleted successfully: ${deletedAgent.name}`);
    
    res.json({ message: 'Agent deleted successfully', deletedAgent: deletedAgent.name });
  } catch (err) {
    console.error('❌ Error deleting agent:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Register (only for admin users)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Only allow admin@gmail.com to register
    if (email !== 'admin@gmail.com') {
      return res.status(403).json({ message: 'Only admin registration is allowed' });
    }
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Admin user already exists' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: 'admin' });
    const token = jwt.sign({ sub: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login (check both users and agents collections)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for email:', email);
    
    // First check users collection (for admin)
    let user = await User.findOne({ email });
    let isAgent = false;
    
    if (user) {
      console.log('✅ User found in users collection (admin)');
    } else {
      console.log('❌ User not found in users collection, checking agents...');
      // If not in users, check agents collection
      const agent = await Agent.findOne({ email });
      if (agent) {
        console.log('✅ Agent found in agents collection:', agent.name);
        user = agent;
        isAgent = true;
      } else {
        console.log('❌ Agent not found in agents collection');
      }
    }
    
    if (!user) {
      console.log('❌ No user/agent found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('🔍 User/Agent found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAgent: isAgent,
      hasPasswordHash: !!user.passwordHash
    });
    
    // Check password
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log('🔐 Password comparison result:', ok);
    
    if (!ok) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('✅ Password verified successfully');
    
    // Check if this is admin@gmail.com and update role if needed
    if (email === 'admin@gmail.com' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    
    const token = jwt.sign({ 
      sub: user._id, 
      email: user.email, 
      isAgent: isAgent 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('🎉 Login successful, token generated for:', user.name);
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        location: user.location,
        isAgent: isAgent
      } 
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Get current user profile (check both collections)
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if it's an agent or user
    if (decoded.isAgent) {
      const agent = await Agent.findById(decoded.sub).select('-passwordHash');
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
      res.json({ user: agent });
    } else {
      const user = await User.findById(decoded.sub).select('-passwordHash');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ user });
    }
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
