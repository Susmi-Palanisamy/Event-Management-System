const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try { 
    const d = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = d.id; 
    req.role = d.role; 
    next(); 
  } catch { 
    return res.status(401).json({ error: "Invalid token" }); 
  }
};

// Generate iCal format for a single event
const generateICalEvent = (event, userEmail) => {
  const startDate = new Date(event.startAt);
  const endDate = event.endAt ? new Date(event.endAt) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
  
  // Format dates to iCal format (YYYYMMDDTHHMMSSZ)
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Management System//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:event-${event._id}@eventmanagement.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || 'No description provided'}
LOCATION:${event.venue?.name || 'TBD'}
ORGANIZER:mailto:${userEmail}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  return ical;
};

// Download .ics file for a single event
router.get('/export/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId).populate('venue');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is registered for this event
    const rsvp = await RSVP.findOne({ event: eventId, user: req.user });
    if (!rsvp) {
      return res.status(403).json({ error: 'You must be registered for this event to export it' });
    }

    const icalContent = generateICalEvent(event, 'user@example.com');

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, '_')}.ics"`);
    res.send(icalContent);
  } catch (error) {
    console.error('Calendar export error:', error);
    res.status(500).json({ error: 'Failed to export calendar event' });
  }
});

// Export all user's registered events
router.get('/export-all', auth, async (req, res) => {
  try {
    // Get all events user is registered for (any status)
    const rsvps = await RSVP.find({ user: req.user }).populate({
      path: 'event',
      populate: { path: 'venue' }
    });

    if (rsvps.length === 0) {
      return res.status(404).json({ error: 'No registered events found' });
    }

    // Generate iCal for all events
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Management System//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    rsvps.forEach(rsvp => {
      if (rsvp.event) {
        const event = rsvp.event;
        const startDate = new Date(event.startAt);
        const endDate = event.endAt ? new Date(event.endAt) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        
        const formatDate = (date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        icalContent += `BEGIN:VEVENT
UID:event-${event._id}@eventmanagement.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || 'No description provided'}
LOCATION:${event.venue?.name || 'TBD'}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`;
      }
    });

    icalContent += 'END:VCALENDAR';

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="my-events.ics"');
    res.send(icalContent);
  } catch (error) {
    console.error('Calendar export all error:', error);
    res.status(500).json({ error: 'Failed to export calendar events' });
  }
});

// Get Google Calendar URL for an event
router.get('/google/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId).populate('venue');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const startDate = new Date(event.startAt);
    const endDate = event.endAt ? new Date(event.endAt) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
    const formatGoogleDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.venue?.name || '')}`;

    res.json({ url: googleCalendarUrl });
  } catch (error) {
    console.error('Google Calendar URL error:', error);
    res.status(500).json({ error: 'Failed to generate Google Calendar URL' });
  }
});

module.exports = router;
