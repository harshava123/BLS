const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');

// @desc    Get all deliveries
// @route   GET /api/deliveries
// @access  Public
router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single delivery
// @route   GET /api/deliveries/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (delivery) {
      res.json(delivery);
    } else {
      res.status(404).json({ message: 'Delivery not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new delivery
// @route   POST /api/deliveries
// @access  Public
router.post('/', async (req, res) => {
  try {
    const delivery = new Delivery(req.body);
    const newDelivery = await delivery.save();
    res.status(201).json(newDelivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update delivery
// @route   PUT /api/deliveries/:id
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (delivery) {
      res.json(delivery);
    } else {
      res.status(404).json({ message: 'Delivery not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete delivery
// @route   DELETE /api/deliveries/:id
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);
    if (delivery) {
      res.json({ message: 'Delivery removed' });
    } else {
      res.status(404).json({ message: 'Delivery not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update delivery status
// @route   PATCH /api/deliveries/:id/status
// @access  Public
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, deliveryPerson, deliveryDate, remarks } = req.body;
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { status, deliveryPerson, deliveryDate, remarks },
      { new: true, runValidators: true }
    );
    if (delivery) {
      res.json(delivery);
    } else {
      res.status(404).json({ message: 'Delivery not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
