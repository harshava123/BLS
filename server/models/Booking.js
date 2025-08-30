const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // LR Information
  lr_type: { 
    type: String, 
    required: true, 
    enum: ['paid', 'to_pay', 'on_account'] 
  },
  
  // Location Information
  from_location: {
    location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true }
  },
  
  to_location: {
    location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true }
  },
  
  // Sender Details
  sender: {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    gst_number: { type: String },
    address: { type: String, required: true }
  },
  
  // Receiver Details
  receiver: {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    gst_number: { type: String },
    address: { type: String, required: true }
  },
  
  // Items List
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    weight: { type: Number, min: 0 },
    freight_charge: { type: Number, required: true, min: 0 }
  }],
  
  // Charges Summary
  charges: {
    item_freight_subtotal: { type: Number, required: true, min: 0 },
    handling_charges: { type: Number, default: 0, min: 0 },
    book_delivery_charges: { type: Number, default: 0, min: 0 },
    door_delivery_charges: { type: Number, default: 0, min: 0 },
    pickup_charges: { type: Number, default: 0, min: 0 },
    lr_charges: { type: Number, default: 0, min: 0 },
    other_charges: { type: Number, default: 0, min: 0 },
    total_amount: { type: Number, required: true, min: 0 }
  },
  
  // Booking Status
  status: { 
    type: String, 
    default: 'booked', 
    enum: ['booked', 'in_transit', 'unloaded', 'delivered', 'cancelled', 'rejected'] 
  },
  
  // Agent Information
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  agent_location: { type: String, required: true },
  
  // LR Number (auto-generated)
  lr_number: { type: String, unique: true },
  
  // Additional Fields
  date: { type: Date, default: Date.now },
  notes: { type: String },
  
  // Legacy fields for backward compatibility (optional)
  lrNumber: { type: String },
  agentName: { type: String },
  fromLocation: { type: String },
  toLocation: { type: String },
  senderCompany: { type: String },
  senderMobile: { type: String },
  senderGST: { type: String },
  receiverCompany: { type: String },
  receiverMobile: { type: String },
  receiverGST: { type: String },
  material: { type: String },
  qty: { type: Number },
  weight: { type: Number },
  freight: { type: Number },
  total: { type: Number }
}, {
  timestamps: true
});

// Auto-generate LR number before saving
bookingSchema.pre('save', function(next) {
  if (!this.lr_number) {
    // Generate LR number: LR-<location_code>-<type_code>-<short_unique_id>
    const locationCode = this.from_location?.code || 'LOC';
    const typeCode = this.lr_type?.substring(0, 2).toUpperCase() || 'TP';
    const uniqueId = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.lr_number = `LR-${locationCode}-${typeCode}-${uniqueId}`;
  }
  
  // Update timestamps
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
