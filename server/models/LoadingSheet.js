const mongoose = require('mongoose');

const lrRowSchema = new mongoose.Schema({
  lrNo: { type: String, required: true },
  bDate: { type: Date, required: true },
  payment: { type: String, enum: ['TOPAY', 'PAID', 'ON ACC'], default: 'TOPAY' },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  articles: { type: Number, required: true },
  freight: { type: Number, required: true }
});

const loadingSheetSchema = new mongoose.Schema({
  bookingBranch: { type: String, required: true },
  deliveryBranch: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  driverMobile: { type: String, required: true },
  lrRows: [lrRowSchema],
  totalFreight: { type: Number, required: true },
  doorDelivery: { type: Number, default: 0 },
  pickup: { type: Number, default: 0 },
  handling: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
loadingSheetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LoadingSheet', loadingSheetSchema);
