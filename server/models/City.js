const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 3,
    uppercase: true
  }
}, {
  timestamps: true
});

// Create text indexes for search functionality
citySchema.index({ name: "text", code: "text" });

// Ensure code is always uppercase
citySchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('City', citySchema);
