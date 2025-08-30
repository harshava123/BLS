const express = require('express');
const router = express.Router();
const LoadingSheet = require('../models/LoadingSheet');

// @desc    Get all loading sheets
// @route   GET /api/loading-sheets
// @access  Public
router.get('/', async (req, res) => {
  try {
    const loadingSheets = await LoadingSheet.find().sort({ createdAt: -1 });
    res.json(loadingSheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single loading sheet
// @route   GET /api/loading-sheets/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const loadingSheet = await LoadingSheet.findById(req.params.id);
    if (loadingSheet) {
      res.json(loadingSheet);
    } else {
      res.status(404).json({ message: 'Loading sheet not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new loading sheet
// @route   POST /api/loading-sheets
// @access  Public
router.post('/', async (req, res) => {
  try {
    const loadingSheet = new LoadingSheet(req.body);
    const newLoadingSheet = await loadingSheet.save();
    res.status(201).json(newLoadingSheet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update loading sheet
// @route   PUT /api/loading-sheets/:id
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const loadingSheet = await LoadingSheet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (loadingSheet) {
      res.json(loadingSheet);
    } else {
      res.status(404).json({ message: 'Loading sheet not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete loading sheet
// @route   DELETE /api/loading-sheets/:id
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const loadingSheet = await LoadingSheet.findByIdAndDelete(req.params.id);
    if (loadingSheet) {
      res.json({ message: 'Loading sheet removed' });
    } else {
      res.status(404).json({ message: 'Loading sheet not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
