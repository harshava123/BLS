const express = require('express');
const router = express.Router();
const City = require('../models/City');

// Get all cities with search functionality
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query = { $text: { $search: search } };
    }
    
    const cities = await City.find(query).sort({ name: 1 });
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get city by ID
router.get('/:id', async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }
    res.json(city);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new city
router.post('/', async (req, res) => {
  try {
    const { name, code } = req.body;
    
    // Check if city with same code already exists
    const existingCity = await City.findOne({ code: code.toUpperCase() });
    if (existingCity) {
      return res.status(400).json({ message: 'City with this code already exists' });
    }
    
    const city = new City({ name, code });
    const newCity = await city.save();
    res.status(201).json(newCity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update city
router.put('/:id', async (req, res) => {
  try {
    const { name, code } = req.body;
    
    // Check if code is being changed and if it conflicts with existing cities
    if (code) {
      const existingCity = await City.findOne({ 
        code: code.toUpperCase(), 
        _id: { $ne: req.params.id } 
      });
      if (existingCity) {
        return res.status(400).json({ message: 'City with this code already exists' });
      }
    }
    
    const city = await City.findByIdAndUpdate(
      req.params.id,
      { name, code },
      { new: true, runValidators: true }
    );
    
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }
    
    res.json(city);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete city
router.delete('/:id', async (req, res) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city) {
      return res.status(404).json({ message: 'City not found' });
    }
    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
