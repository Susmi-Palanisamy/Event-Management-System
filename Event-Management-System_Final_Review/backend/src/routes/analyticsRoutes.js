const express = require("express");
const jwt = require("jsonwebtoken");
const Event = require("../models/Event");
const RSVP = require("../models/RSVP");
const User = require("../models/User");

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try { const d = jwt.verify(token, process.env.JWT_SECRET); req.user=d.id; req.role=d.role; next(); } catch { return res.status(401).json({ error: "Invalid token" }); }
};
const admin = (req, res, next) => req.role === "admin" ? next() : res.status(403).json({ error: "Admins only" });

// Legacy overview endpoint
router.get("/overview", auth, admin, async (req, res) => {
  const totalEvents = await Event.countDocuments();
  const totalRSVPs = await RSVP.countDocuments();
  const byStatus = await RSVP.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  res.json({ totalEvents, totalRSVPs, byStatus });
});

// Comprehensive analytics dashboard
router.get('/dashboard', auth, admin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Total events
    const totalEvents = await Event.countDocuments({ createdAt: { $gte: startDate } });

    // Total registrations (using RSVP model)
    const totalRegistrations = await RSVP.countDocuments({ createdAt: { $gte: startDate } });

    // Total revenue
    const revenueData = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPaid: true
        }
      },
      {
        $lookup: {
          from: 'rsvps',
          localField: '_id',
          foreignField: 'event',
          as: 'rsvps'
        }
      },
      {
        $project: {
          revenue: {
            $multiply: [
              '$price',
              { $size: { $filter: { input: '$rsvps', as: 'r', cond: { $eq: ['$$r.status', 'going'] } } } }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$revenue' }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // Active users
    const activeUsers = await RSVP.distinct('user', { createdAt: { $gte: startDate } });

    // Registration trends (daily)
    const registrationTrends = await RSVP.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          registrations: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          registrations: 1
        }
      }
    ]);

    // Category distribution
    const categoryData = await Event.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$category',
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: 1
        }
      }
    ]);

    // Revenue by category
    const revenueByCategory = await Event.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPaid: true
        }
      },
      {
        $lookup: {
          from: 'rsvps',
          localField: '_id',
          foreignField: 'event',
          as: 'rsvps'
        }
      },
      {
        $project: {
          category: 1,
          revenue: {
            $multiply: [
              '$price',
              { $size: { $filter: { input: '$rsvps', as: 'r', cond: { $eq: ['$$r.status', 'going'] } } } }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$category',
          revenue: { $sum: '$revenue' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          revenue: 1
        }
      }
    ]);

    // Top performing events
    const topEvents = await RSVP.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$event',
          registrations: { $sum: 1 }
        }
      },
      {
        $sort: { registrations: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      {
        $unwind: '$eventData'
      },
      {
        $project: {
          _id: 0,
          title: '$eventData.title',
          category: '$eventData.category',
          registrations: 1
        }
      }
    ]);

    res.json({
      totalEvents,
      totalRegistrations,
      totalRevenue,
      activeUsers: activeUsers.length,
      registrationTrends,
      categoryData,
      revenueByCategory,
      topEvents
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Event-specific analytics
router.get('/event/:eventId', auth, admin, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const registrations = await RSVP.countDocuments({ event: eventId });
    const confirmedRegistrations = await RSVP.countDocuments({ event: eventId, status: 'going' });
    const pendingRegistrations = await RSVP.countDocuments({ event: eventId, status: 'maybe' });
    const cancelledRegistrations = await RSVP.countDocuments({ event: eventId, status: 'not_going' });

    const revenue = event.isPaid ? confirmedRegistrations * event.price : 0;

    // Registration timeline
    const registrationTimeline = await RSVP.aggregate([
      {
        $match: { event: event._id }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1
        }
      }
    ]);

    res.json({
      event: {
        title: event.title,
        category: event.category,
        startAt: event.startAt,
        isPaid: event.isPaid,
        price: event.price
      },
      registrations: {
        total: registrations,
        confirmed: confirmedRegistrations,
        pending: pendingRegistrations,
        cancelled: cancelledRegistrations
      },
      revenue,
      registrationTimeline
    });
  } catch (error) {
    console.error('Event analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch event analytics' });
  }
});

module.exports = router;






