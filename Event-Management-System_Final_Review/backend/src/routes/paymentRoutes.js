const express = require("express");
const jwt = require("jsonwebtoken");
const Payment = require("../models/Payment");
const Event = require("../models/Event");

const router = express.Router();

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Create payment and register for event
router.post("/register-paid-event/:eventId", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user;
    const { paymentMethod, contactInfo, transactionId } = req.body;

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if event is paid
    if (!event.isPaid || event.price === 0) {
      return res.status(400).json({ error: "This event is free. Use regular registration." });
    }

    // Check if event is in the past
    if (new Date(event.startAt) < new Date()) {
      return res.status(400).json({ error: "Cannot register for past events" });
    }

    // Check if user already registered
    if (event.registeredUsers.includes(userId)) {
      return res.status(400).json({ error: "Already registered for this event" });
    }

    // Check if event is full
    if (event.maxAttendees && event.registeredUsers.length >= event.maxAttendees) {
      return res.status(400).json({ error: "Event is full" });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ 
      eventId, 
      userId, 
      paymentStatus: "completed" 
    });
    
    if (existingPayment) {
      return res.status(400).json({ error: "Payment already completed for this event" });
    }

    // Validate contact info
    if (!contactInfo || !contactInfo.fullName || !contactInfo.email || !contactInfo.phone) {
      return res.status(400).json({ error: "Please provide complete contact information" });
    }

    // Determine payment status based on method
    const paymentStatus = paymentMethod === "Cash on Registration" ? "pending" : "completed";
    
    // Create payment record
    const payment = new Payment({
      eventId,
      userId,
      amount: event.price,
      currency: event.currency,
      paymentMethod: paymentMethod || "GPay",
      paymentStatus,
      transactionId: transactionId || `TXN_${Date.now()}_${userId}`,
      paymentDate: paymentStatus === "completed" ? new Date() : null,
      contactInfo
    });

    await payment.save();

    // Add user to event's registered users
    event.registeredUsers.push(userId);
    await event.save();

    res.json({ 
      msg: "Registration and payment successful!",
      payment,
      event 
    });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update payment status (for Cash on Registration)
router.patch("/update-status/:paymentId", authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paymentStatus, transactionId } = req.body;
    const userId = req.user;

    // Find payment record
    const payment = await Payment.findById(paymentId).populate("eventId");
    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    // Check authorization (user owns payment OR user is event organizer/admin)
    const token = req.headers["authorization"]?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const isOwner = payment.userId.toString() === userId;
    const isOrganizer = payment.eventId.createdBy.toString() === userId;
    const isAdmin = decoded.role === "admin";

    if (!isOwner && !isOrganizer && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update payment status
    if (paymentStatus) {
      payment.paymentStatus = paymentStatus;
      if (paymentStatus === "completed" && !payment.paymentDate) {
        payment.paymentDate = new Date();
      }
    }

    if (transactionId) {
      payment.transactionId = transactionId;
    }

    await payment.save();

    res.json({ 
      msg: "Payment status updated successfully!",
      payment
    });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's payment history
router.get("/my-payments", authMiddleware, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user })
      .populate("eventId", "title startAt endAt location")
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment details for an event (admin/organizer only)
router.get("/event/:eventId", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if user is event organizer or admin
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const token = req.headers["authorization"]?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (event.createdBy.toString() !== req.user && decoded.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const payments = await Payment.find({ eventId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    
    const stats = {
      total: payments.length,
      completed: payments.filter(p => p.paymentStatus === "completed").length,
      pending: payments.filter(p => p.paymentStatus === "pending").length,
      failed: payments.filter(p => p.paymentStatus === "failed").length,
      totalRevenue: payments
        .filter(p => p.paymentStatus === "completed")
        .reduce((sum, p) => sum + p.amount, 0),
    };

    res.json({ payments, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if user has paid for an event
router.get("/check/:eventId", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user;

    const payment = await Payment.findOne({ 
      eventId, 
      userId, 
      paymentStatus: "completed" 
    });

    res.json({ 
      hasPaid: !!payment,
      payment: payment || null 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
