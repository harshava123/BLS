const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  gst_number: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values but ensures uniqueness for non-null values
  }
}, {
  timestamps: true
});

// Create text indexes for search functionality
customerSchema.index({ name: "text", phone: "text", gst_number: "text" });

// Ensure GST number is always uppercase
customerSchema.pre('save', function(next) {
  if (this.gst_number) {
    this.gst_number = this.gst_number.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
