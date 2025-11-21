const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  // Deprecated single date, kept for backward compatibility
  date: { type: Date },
  // New time fields
  startAt: { type: Date, required: true },
  endAt: { type: Date },
  timezone: { type: String, default: "UTC" },
  location: { type: String },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue" },
  status: { type: String, enum: ["draft", "published", "completed"], default: "published" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  category: { type: String, index: true },
  guests: [{ type: String }], // email list
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // <-- for admin dashboard
  // Payment fields
  isPaid: { type: Boolean, default: false },
  price: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: "INR", enum: ["INR", "USD", "EUR", "GBP"] },
  maxAttendees: { type: Number, default: null }, // null means unlimited
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
