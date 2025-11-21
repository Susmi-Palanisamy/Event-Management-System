const express = require("express");
const jwt = require("jsonwebtoken");
const Event = require("../models/Event");

const router = express.Router();

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // attach user ID to request
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Create Event
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { title, description, startAt, endAt, timezone, location, status, guests, category, isPaid, price, currency, maxAttendees, venue } = req.body;

    if (!title || !startAt) {
      return res.status(400).json({ error: "title and startAt are required" });
    }

    // Prevent creating events with past dates
    const currentDate = new Date();
    const eventStartDate = new Date(startAt);
    
    if (eventStartDate < currentDate) {
      return res.status(400).json({ error: "Cannot create events with past dates. Please select a future date." });
    }

    if (endAt && new Date(endAt) < new Date(startAt)) {
      return res.status(400).json({ error: "endAt cannot be before startAt" });
    }

    // Validate payment fields
    if (isPaid && (!price || price <= 0)) {
      return res.status(400).json({ error: "Price must be greater than 0 for paid events" });
    }

    // Check venue availability if venue is selected
    if (venue) {
      const eventStart = new Date(startAt);
      const eventEnd = endAt ? new Date(endAt) : new Date(eventStart.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours if no end time

      // Find conflicting events for the same venue
      const conflictingEvents = await Event.find({
        venue: venue,
        status: { $ne: "completed" }, // Exclude completed events
        $or: [
          // New event starts during existing event
          {
            startAt: { $lte: eventStart },
            $or: [
              { endAt: { $gte: eventStart } },
              { endAt: null } // Events without end time
            ]
          },
          // New event ends during existing event
          {
            startAt: { $lte: eventEnd },
            $or: [
              { endAt: { $gte: eventEnd } },
              { endAt: null }
            ]
          },
          // New event completely contains existing event
          {
            startAt: { $gte: eventStart },
            $or: [
              { endAt: { $lte: eventEnd } },
              { endAt: null }
            ]
          }
        ]
      }).populate('venue', 'name location');

      if (conflictingEvents.length > 0) {
        const conflict = conflictingEvents[0];
        const venueName = conflict.venue?.name || 'Selected venue';
        const conflictStart = new Date(conflict.startAt).toLocaleString();
        const conflictEnd = conflict.endAt ? new Date(conflict.endAt).toLocaleString() : 'No end time';
        
        return res.status(409).json({ 
          error: `Venue conflict detected! ${venueName} is already booked for "${conflict.title}" from ${conflictStart} to ${conflictEnd}. Please select a different venue or time slot.`,
          conflictingEvent: {
            title: conflict.title,
            startAt: conflict.startAt,
            endAt: conflict.endAt,
            venue: conflict.venue
          }
        });
      }
    }

    const event = new Event({
      title,
      description,
      startAt,
      endAt,
      timezone: timezone || "UTC",
      location,
      venue: venue || null,
      status: status || "published",
      createdBy: req.user,
      guests,
      category,
      isPaid: isPaid || false,
      price: isPaid ? price : 0,
      currency: currency || "INR",
      maxAttendees: maxAttendees || null,
    });

    await event.save();
    res.json({ msg: "Event created successfully!", event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List Events (only user's events)
router.get("/my-events", authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List Events where user is registered
router.get("/my-registrations", authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ registeredUsers: req.user })
      .populate("createdBy", "name email")
      .populate("venue"); 
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced Search with Filters
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { 
      query,        // search text
      category,     // category filter
      minPrice,     // minimum price
      maxPrice,     // maximum price
      startDate,    // events starting after this date
      endDate,      // events starting before this date
      isPaid,       // filter by paid/free
      location      // location filter
    } = req.query;

    const filters = {};

    // Text search (title or description)
    if (query) {
      filters.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filters.category = category;
    }

    // Price range filter
    if (isPaid === 'true') {
      filters.isPaid = true;
      if (minPrice) filters.price = { ...filters.price, $gte: parseFloat(minPrice) };
      if (maxPrice) filters.price = { ...filters.price, $lte: parseFloat(maxPrice) };
    } else if (isPaid === 'false') {
      filters.isPaid = false;
    }

    // Date range filter
    if (startDate) {
      filters.startAt = { ...filters.startAt, $gte: new Date(startDate) };
    }
    if (endDate) {
      filters.startAt = { ...filters.startAt, $lte: new Date(endDate) };
    }

    // Location filter
    if (location) {
      filters.location = { $regex: location, $options: 'i' };
    }

    const events = await Event.find(filters)
      .populate("registeredUsers", "name email")
      .populate("createdBy", "name email")
      .sort({ startAt: 1 }); // Sort by start date

    res.json(Array.isArray(events) ? events : []);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get ALL events for user dashboard
router.get("/", authMiddleware, async (req, res) => {
  try {
    const q = {};
    if (req.query.category) q.category = req.query.category;
    const events = await Event.find(q)
      .populate("registeredUsers", "name email")
      .populate("venue"); // <-- populate venue
    res.json(Array.isArray(events) ? events : []); // always send an array
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all events created by any admin
router.get("/admin-events", authMiddleware, async (req, res) => {
  try {
    const q = {};
    if (req.query.category) q.category = req.query.category;
    const events = await Event.find(q)
      .populate("createdBy", "name email role")       // creator info
      .populate("registeredUsers", "name email");     // registered users
    res.json(Array.isArray(events) ? events : []);    // always an array
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get single event by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register logged-in user for an event
router.post("/register/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is already registered
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    
    // Check if event is in the past
    const currentDate = new Date();
    const eventStartDate = new Date(event.startAt);
    
    if (eventStartDate < currentDate) {
      return res.status(400).json({ error: "Cannot register for past events" });
    }
    
    const isAlreadyRegistered = event.registeredUsers.some(userId => String(userId) === String(req.user));
    if (isAlreadyRegistered) {
      return res.status(400).json({ error: "You are already registered for this event" });
    }
    
    // Add user to registeredUsers
    const updated = await Event.findOneAndUpdate(
      { _id: id },
      { $addToSet: { registeredUsers: req.user } },
      { new: true }
    );
    
    res.json({ msg: "Registered successfully!", event: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// Update Event
router.put("/:id", authMiddleware, async (req, res) => {
  try {
  const { id } = req.params;
  const { title, description, startAt, endAt, timezone, location, status, guests, category, venue } = req.body;

    // Find event by ID and check ownership
    let event = await Event.findOne({ _id: id, createdBy: req.user });
    if (!event) {
      return res.status(404).json({ error: "Event not found or not authorized" });
    }

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (typeof startAt !== "undefined") {
      // Prevent updating to past dates
      const currentDate = new Date();
      const newStartDate = new Date(startAt);
      
      if (newStartDate < currentDate) {
        return res.status(400).json({ error: "Cannot update event to a past date. Please select a future date." });
      }
      event.startAt = startAt;
    }
    if (typeof endAt !== "undefined") {
      if (endAt && event.startAt && new Date(endAt) < new Date(event.startAt)) {
        return res.status(400).json({ error: "endAt cannot be before startAt" });
      }
      event.endAt = endAt;
    }
    if (timezone) event.timezone = timezone;
    if (location) event.location = location;
    if (status) event.status = status;
    if (guests) event.guests = guests;
    if (typeof category !== "undefined") event.category = category;
    if (typeof venue !== "undefined") event.venue = venue;

    // Check venue availability if venue is being updated or time is changed
    if (event.venue) {
      const eventStart = new Date(event.startAt);
      const eventEnd = event.endAt ? new Date(event.endAt) : new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);

      // Find conflicting events (excluding current event)
      const conflictingEvents = await Event.find({
        _id: { $ne: id }, // Exclude current event
        venue: event.venue,
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
      }).populate('venue', 'name location');

      if (conflictingEvents.length > 0) {
        const conflict = conflictingEvents[0];
        const venueName = conflict.venue?.name || 'Selected venue';
        const conflictStart = new Date(conflict.startAt).toLocaleString();
        const conflictEnd = conflict.endAt ? new Date(conflict.endAt).toLocaleString() : 'No end time';
        
        return res.status(409).json({ 
          error: `Venue conflict detected! ${venueName} is already booked for "${conflict.title}" from ${conflictStart} to ${conflictEnd}. Please select a different venue or time slot.`,
          conflictingEvent: {
            title: conflict.title,
            startAt: conflict.startAt,
            endAt: conflict.endAt,
            venue: conflict.venue
          }
        });
      }
    }

    await event.save();
    res.json({ msg: "Event updated successfully!", event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// DELETE an event (auth + ownership)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, createdBy: req.user });
    if (!event) {
      return res.status(404).json({ msg: "Event not found or not authorized" });
    }
    await event.deleteOne();
    res.json({ msg: "Event deleted successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


module.exports = router;
