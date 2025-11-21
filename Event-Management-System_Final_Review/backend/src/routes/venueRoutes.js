const express = require("express");
const jwt = require("jsonwebtoken");
const Venue = require("../models/Venue");
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

// Middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Venue (Admin only)
router.post("/create", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, location, capacity, description, amenities, pricePerHour, images } = req.body;

    if (!name || !location || !capacity) {
      return res.status(400).json({ error: "Name, location, and capacity are required" });
    }

    if (capacity < 1) {
      return res.status(400).json({ error: "Capacity must be at least 1" });
    }

    const venue = new Venue({
      name,
      location,
      capacity,
      description,
      amenities: amenities || [],
      pricePerHour: pricePerHour || 0,
      images: images || [],
      createdBy: req.user
    });

    await venue.save();
    res.json({ msg: "Venue created successfully", venue });
  } catch (error) {
    console.error("Venue creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Available Venues for specific date/time (checks for conflicts)
router.get("/available", authMiddleware, async (req, res) => {
  try {
    const { startAt, endAt } = req.query;
    const Event = require("../models/Event");
    
    console.log("=== VENUE AVAILABILITY CHECK ===");
    console.log("Requested startAt:", startAt);
    console.log("Requested endAt:", endAt);
    
    // Get all venues that are marked as available
    const allVenues = await Venue.find({ isAvailable: true })
      .populate("createdBy", "name email")
      .sort({ capacity: 1 });
    
    console.log("Total available venues:", allVenues.length);
    
    // If no date range provided, return all available venues
    if (!startAt) {
      console.log("No date provided, returning all venues");
      return res.json(allVenues);
    }
    
    const requestedStart = new Date(startAt);
    const requestedEnd = endAt ? new Date(endAt) : new Date(requestedStart.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
    
    console.log("Checking conflicts between:", requestedStart, "and", requestedEnd);
    
    // Find all events that overlap with the requested time
    const conflictingEvents = await Event.find({
      venue: { $exists: true, $ne: null },
      status: { $nin: ['cancelled', 'completed'] }, // Exclude cancelled/completed events
      $or: [
        // Event starts during requested time
        { startAt: { $gte: requestedStart, $lt: requestedEnd } },
        // Event ends during requested time
        { endAt: { $gt: requestedStart, $lte: requestedEnd } },
        // Event spans the entire requested time
        { startAt: { $lte: requestedStart }, endAt: { $gte: requestedEnd } }
      ]
    }).select('venue startAt endAt title status');
    
    console.log("Conflicting events found:", conflictingEvents.length);
    conflictingEvents.forEach(event => {
      console.log("  - Event:", event.title, "Venue:", event.venue, "Time:", event.startAt, "-", event.endAt, "Status:", event.status);
    });
    
    // Get list of occupied venue IDs
    const occupiedVenueIds = conflictingEvents.map(event => event.venue.toString());
    console.log("Occupied venue IDs:", occupiedVenueIds);
    
    // Filter out occupied venues
    const availableVenues = allVenues.filter(venue => 
      !occupiedVenueIds.includes(venue._id.toString())
    );
    
    console.log("Available venues after filtering:", availableVenues.length);
    console.log("=== END VENUE AVAILABILITY CHECK ===");
    
    res.json(availableVenues);
  } catch (error) {
    console.error("Error fetching available venues:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get All Venues (Available for event creation)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { minCapacity, maxCapacity, location, available } = req.query;
    
    const filters = {};
    
    // Filter by availability
    if (available === 'true') {
      filters.isAvailable = true;
    }
    
    // Filter by capacity range
    if (minCapacity) {
      filters.capacity = { ...filters.capacity, $gte: parseInt(minCapacity) };
    }
    if (maxCapacity) {
      filters.capacity = { ...filters.capacity, $lte: parseInt(maxCapacity) };
    }
    
    // Filter by location
    if (location) {
      filters.location = { $regex: location, $options: 'i' };
    }

    const venues = await Venue.find(filters)
      .populate("createdBy", "name email")
      .sort({ capacity: 1 }); // Sort by capacity (smallest to largest)

    res.json(Array.isArray(venues) ? venues : []);
  } catch (error) {
    console.error("Fetch venues error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Check Venue Availability for a time slot
router.post("/check-availability", authMiddleware, async (req, res) => {
  try {
    const { venueId, startAt, endAt, excludeEventId } = req.body;

    if (!venueId || !startAt) {
      return res.status(400).json({ error: "venueId and startAt are required" });
    }

    const Event = require("../models/Event");
    
    const eventStart = new Date(startAt);
    const eventEnd = endAt ? new Date(endAt) : new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);

    // Build query
    const query = {
      venue: venueId,
      status: { $ne: "completed" },
      $or: [
        {
          startAt: { $lte: eventStart },
          $or: [
            { endAt: { $gte: eventStart } },
            { endAt: null }
          ]
        },
        {
          startAt: { $lte: eventEnd },
          $or: [
            { endAt: { $gte: eventEnd } },
            { endAt: null }
          ]
        },
        {
          startAt: { $gte: eventStart },
          $or: [
            { endAt: { $lte: eventEnd } },
            { endAt: null }
          ]
        }
      ]
    };

    // Exclude specific event if provided (for updates)
    if (excludeEventId) {
      query._id = { $ne: excludeEventId };
    }

    const conflictingEvents = await Event.find(query)
      .populate('venue', 'name location')
      .select('title startAt endAt venue');

    if (conflictingEvents.length > 0) {
      return res.json({
        available: false,
        conflicts: conflictingEvents.map(e => ({
          title: e.title,
          startAt: e.startAt,
          endAt: e.endAt,
          venue: e.venue
        }))
      });
    }

    res.json({ available: true, conflicts: [] });
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Single Venue
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id).populate("createdBy", "name email");
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }
    res.json(venue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Venue (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, location, capacity, description, amenities, pricePerHour, images, isAvailable } = req.body;

    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Update fields
    if (name) venue.name = name;
    if (location) venue.location = location;
    if (capacity) venue.capacity = capacity;
    if (description !== undefined) venue.description = description;
    if (amenities) venue.amenities = amenities;
    if (pricePerHour !== undefined) venue.pricePerHour = pricePerHour;
    if (images) venue.images = images;
    if (isAvailable !== undefined) venue.isAvailable = isAvailable;

    await venue.save();
    res.json({ msg: "Venue updated successfully", venue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Venue (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    await Venue.findByIdAndDelete(req.params.id);
    res.json({ msg: "Venue deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Venue Statistics (Admin only)
router.get("/stats/overview", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalVenues = await Venue.countDocuments();
    const availableVenues = await Venue.countDocuments({ isAvailable: true });
    const totalCapacity = await Venue.aggregate([
      { $group: { _id: null, total: { $sum: "$capacity" } } }
    ]);

    res.json({
      totalVenues,
      availableVenues,
      totalCapacity: totalCapacity[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
