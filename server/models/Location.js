const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
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
  },
  city_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true
  },
  city_code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  address: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create text indexes for search functionality
locationSchema.index({ name: "text", code: "text", city_code: "text", address: "text" });

// Ensure code is always uppercase
locationSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  if (this.city_code) {
    this.city_code = this.city_code.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Location', locationSchema);
