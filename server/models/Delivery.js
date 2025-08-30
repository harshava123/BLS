const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  lrNo: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['pending', 'inTransit', 'delivered'], 
    default: 'pending' 
  },
  vehicleNumber: { type: String, required: true },
  deliveryPerson: { type: String },
  deliveryDate: { type: Date },
  remarks: { type: String },
  origin: { type: String, default: 'KTD' },
  destination: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
deliverySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);
