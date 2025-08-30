const express = require('express');
const router = express.Router();
const City = require('../models/City');
const Location = require('../models/Location');
const Customer = require('../models/Customer');

// Get all master data (cities, locations, customers) in a single response
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    // Build queries for each collection
    let cityQuery = {};
    let locationQuery = {};
    let customerQuery = {};
    
    if (search) {
      cityQuery = { $text: { $search: search } };
      locationQuery = { $text: { $search: search } };
      customerQuery = { $text: { $search: search } };
    }
    
    // Fetch all data in parallel
    const [cities, locations, customers] = await Promise.all([
      City.find(cityQuery).sort({ name: 1 }),
      Location.find(locationQuery).populate('city_id', 'name code').sort({ name: 1 }),
      Customer.find(customerQuery).sort({ name: 1 })
    ]);
    
    res.json({
      cities,
      locations,
      customers,
      summary: {
        totalCities: cities.length,
        totalLocations: locations.length,
        totalCustomers: customers.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get summary statistics only
router.get('/summary', async (req, res) => {
  try {
    const [cities, locations, customers] = await Promise.all([
      City.countDocuments(),
      Location.countDocuments(),
      Customer.countDocuments()
    ]);
    
    res.json({
      cities,
      locations,
      customers,
      total: cities + locations + customers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
