const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Event", 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  currency: { 
    type: String, 
    default: "INR",
    enum: ["INR", "USD", "EUR", "GBP"]
  },
  paymentMethod: {
    type: String,
    enum: ["GPay", "PhonePe", "Paytm", "Cash on Registration"],
    default: "GPay"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },
  transactionId: { 
    type: String 
  },
  paymentDate: { 
    type: Date 
  },
  // Shipping/Contact address for event registration
  contactInfo: {
    fullName: String,
    email: String,
    phone: String,
    address: String
  }
}, { timestamps: true });

// Index for faster queries
paymentSchema.index({ eventId: 1, userId: 1 });
paymentSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
