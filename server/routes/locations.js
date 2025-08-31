const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const City = require('../models/City');

// Get all locations with search functionality and city population
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query = { $text: { $search: search } };
    }
    
    const locations = await Location.find(query)
      .populate('city_id', 'name code')
      .sort({ name: 1 });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get location by ID
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id).populate('city_id', 'name code');
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new location
router.post('/', async (req, res) => {
  try {
    const { name, code, city_id, address } = req.body;
    
    // Debug logging
    console.log('📍 Creating new location with data:', req.body);
    console.log('📍 Address field value:', address);
    console.log('📍 Address field type:', typeof address);
    
    // Check if location with same code already exists
    const existingLocation = await Location.findOne({ code: code.toUpperCase() });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location with this code already exists' });
    }
    
    // Validate city exists and is active
    const city = await City.findById(city_id);
    if (!city) {
      return res.status(400).json({ message: 'Invalid city selected' });
    }
    
    const location = new Location({
      name,
      code,
      city_id,
      city_code: city.code,
      address
    });
    
    console.log('📍 Location object before save:', location);
    
    const newLocation = await location.save();
    console.log('📍 Location saved successfully:', newLocation);
    
    const populatedLocation = await Location.findById(newLocation._id).populate('city_id', 'name code');
    res.status(201).json(populatedLocation);
  } catch (error) {
    console.error('❌ Error creating location:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update location
router.put('/:id', async (req, res) => {
  try {
    const { name, code, city_id, status, address } = req.body;
    
    // Check if code is being changed and if it conflicts with existing locations
    if (code) {
      const existingLocation = await Location.findOne({ 
        code: code.toUpperCase(), 
        _id: { $ne: req.params.id } 
      });
      if (existingLocation) {
        return res.status(400).json({ message: 'Location with this code already exists' });
      }
    }
    
    // If city is being changed, validate the new city
    if (city_id) {
      const city = await City.findById(city_id);
      if (!city) {
        return res.status(400).json({ message: 'Invalid city selected' });
      }
      req.body.city_code = city.code;
    }
    
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    const populatedLocation = await Location.findById(location._id).populate('city_id', 'name code');
    res.json(populatedLocation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle location status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    location.status = location.status === 'active' ? 'inactive' : 'active';
    await location.save();
    
    const populatedLocation = await Location.findById(location._id).populate('city_id', 'name code');
    res.json(populatedLocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete location
router.delete('/:id', async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
