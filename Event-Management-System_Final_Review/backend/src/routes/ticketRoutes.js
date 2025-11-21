const express = require("express");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const Event = require("../models/Event");
const User = require("../models/User");

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

// Generate QR Code Ticket for an event
router.get("/generate/:eventId", authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user;

    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user is registered
    const isRegistered = event.registeredUsers.some(
      (user) => user.toString() === userId
    );

    if (!isRegistered) {
      return res.status(403).json({ error: "You must be registered for this event to get a ticket" });
    }

    // Get user details
    const user = await User.findById(userId).select("name email");

    // Create ticket data
    const ticketData = {
      eventId: event._id,
      eventTitle: event.title,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      eventDate: event.startAt,
      location: event.location || "TBA",
      ticketId: `${event._id}-${user._id}`,
      generatedAt: new Date().toISOString(),
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(ticketData), {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 300,
    });

    res.json({
      success: true,
      qrCode: qrCodeDataURL,
      ticketData,
    });
  } catch (error) {
    console.error("QR Code generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify QR Code Ticket (for event check-in)
router.post("/verify", authMiddleware, async (req, res) => {
  try {
    const { ticketData } = req.body;

    if (!ticketData || !ticketData.eventId || !ticketData.userId) {
      return res.status(400).json({ error: "Invalid ticket data" });
    }

    // Verify event exists
    const event = await Event.findById(ticketData.eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Verify user is registered
    const isRegistered = event.registeredUsers.some(
      (user) => user.toString() === ticketData.userId
    );

    if (!isRegistered) {
      return res.status(403).json({ 
        valid: false, 
        error: "User not registered for this event" 
      });
    }

    // Verify user exists
    const user = await User.findById(ticketData.userId).select("name email");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      valid: true,
      message: "Ticket is valid",
      event: {
        title: event.title,
        date: event.startAt,
        location: event.location,
      },
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Ticket verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
