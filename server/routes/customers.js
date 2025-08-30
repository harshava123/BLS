const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Get all customers with search functionality
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query = { $text: { $search: search } };
    }
    
    const customers = await Customer.find(query).sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, address, gst_number } = req.body;
    
    // Check if customer with same phone already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this phone number already exists' });
    }
    
    // Check if customer with same GST number already exists (if provided)
    if (gst_number) {
      const existingGSTCustomer = await Customer.findOne({ gst_number: gst_number.toUpperCase() });
      if (existingGSTCustomer) {
        return res.status(400).json({ message: 'Customer with this GST number already exists' });
      }
    }
    
    const customer = new Customer({ name, phone, address, gst_number });
    const newCustomer = await customer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, address, gst_number } = req.body;
    
    // Check if phone is being changed and if it conflicts with existing customers
    if (phone) {
      const existingCustomer = await Customer.findOne({ 
        phone, 
        _id: { $ne: req.params.id } 
      });
      if (existingCustomer) {
        return res.status(400).json({ message: 'Customer with this phone number already exists' });
      }
    }
    
    // Check if GST number is being changed and if it conflicts with existing customers
    if (gst_number) {
      const existingGSTCustomer = await Customer.findOne({ 
        gst_number: gst_number.toUpperCase(), 
        _id: { $ne: req.params.id } 
      });
      if (existingGSTCustomer) {
        return res.status(400).json({ message: 'Customer with this GST number already exists' });
      }
    }
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, gst_number },
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
