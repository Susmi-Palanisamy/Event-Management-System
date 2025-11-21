const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get analytics dashboard data
router.get('/dashboard', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Total events
    const totalEvents = await Event.countDocuments({ createdAt: { $gte: startDate } });

    // Total registrations
    const totalRegistrations = await Registration.countDocuments({ createdAt: { $gte: startDate } });

    // Total revenue
    const revenueData = await Registration.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'confirmed'
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      {
        $unwind: '$eventData'
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $eq: ['$eventData.isPaid', true] },
                '$eventData.price',
                0
              ]
            }
          }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // Active users (users who registered for events)
    const activeUsers = await Registration.distinct('user', { createdAt: { $gte: startDate } });

    // Registration trends (daily)
    const registrationTrends = await Registration.aggregate([
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
    const revenueByCategory = await Registration.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'confirmed'
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'eventData'
        }
      },
      {
        $unwind: '$eventData'
      },
      {
        $group: {
          _id: '$eventData.category',
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$eventData.isPaid', true] },
                '$eventData.price',
                0
              ]
            }
          }
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
    const topEvents = await Registration.aggregate([
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

// Get event-specific analytics
router.get('/event/:eventId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const registrations = await Registration.countDocuments({ event: eventId });
    const confirmedRegistrations = await Registration.countDocuments({ event: eventId, status: 'confirmed' });
    const pendingRegistrations = await Registration.countDocuments({ event: eventId, status: 'pending' });
    const cancelledRegistrations = await Registration.countDocuments({ event: eventId, status: 'cancelled' });

    const revenue = event.isPaid ? confirmedRegistrations * event.price : 0;

    // Registration timeline
    const registrationTimeline = await Registration.aggregate([
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
      registracd "C:\Users\Susmi.P\OneDrive\Desktop\Event management"tionTimeline
    });
  } catch (error) {
    console.error('Event analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch event analytics' });
  }
});

module.exports = router;
