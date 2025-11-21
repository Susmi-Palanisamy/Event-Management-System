import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Users, MapPin, Clock, Download, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const localizer = momentLocalizer(moment);

// Custom Toolbar Component
const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToToday = () => {
    toolbar.onNavigate('TODAY');
  };

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span className="text-xl font-bold text-gray-900">
        {date.format('MMMM YYYY')}
      </span>
    );
  };

  return (
    <div className="rbc-toolbar mb-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium text-sm"
          >
            Today
          </button>
          <button
            onClick={goToBack}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            title="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={goToNext}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            title="Next"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Current Date Label */}
        <div>
          {label()}
        </div>

        {/* View Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toolbar.onView('month')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              toolbar.view === 'month'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => toolbar.onView('week')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              toolbar.view === 'week'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => toolbar.onView('day')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              toolbar.view === 'day'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => toolbar.onView('agenda')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              toolbar.view === 'agenda'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Agenda
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EventCalendar({ token, role }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let url = "";
      
      if (role === "admin") {
        // Admin sees all events
        url = "http://localhost:5000/api/events";
      } else {
        // User sees all events + highlights registered ones
        url = "http://localhost:5000/api/events";
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      // Get user's registered events if user
      let registeredEventIds = [];
      if (role === "user") {
        const regRes = await fetch("http://localhost:5000/api/events/my-registrations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const regData = await regRes.json();
        registeredEventIds = regData.map(e => e._id);
      }

      setEvents(Array.isArray(data) ? data : []);
      
      // Transform events for calendar
      const transformed = (Array.isArray(data) ? data : []).map(event => {
        const isRegistered = registeredEventIds.includes(event._id);
        const isPast = new Date(event.startAt) < new Date();
        
        // Include venue in title only if venue exists
        let displayTitle = event.title;
        if (event.venue && typeof event.venue === 'object' && event.venue.name) {
          displayTitle = `${event.title} 📍 ${event.venue.name}`;
        } else if (event.location) {
          displayTitle = `${event.title} 📍 ${event.location}`;
        }
        
        return {
          id: event._id,
          title: displayTitle,
          start: new Date(event.startAt),
          end: event.endAt ? new Date(event.endAt) : new Date(new Date(event.startAt).getTime() + 2 * 60 * 60 * 1000),
          resource: {
            ...event,
            isRegistered,
            isPast
          }
        };
      });
      
      setCalendarEvents(transformed);
    } catch (err) {
      console.error("Error fetching events:", err);
      setEvents([]);
      setCalendarEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.resource);
    setShowModal(true);
  };

  const downloadICS = async (eventId, eventTitle) => {
    try {
      const res = await fetch(`http://localhost:5000/api/calendar/export/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const addToGoogleCalendar = async (eventId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/calendar/google/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Google Calendar error:', error);
    }
  };

  const eventStyleGetter = (event) => {
    const { isRegistered, isPast } = event.resource;
    
    let backgroundColor = '#8B5CF6'; // Default purple
    
    if (role === 'user' && isRegistered) {
      backgroundColor = '#10B981'; // Green for registered
    }
    
    if (isPast) {
      backgroundColor = '#9CA3AF'; // Gray for past events
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: isPast ? 0.6 : 1,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '13px',
        fontWeight: '500'
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 shadow-2xl text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-purple-200 text-sm font-medium">
                {role === 'admin' ? 'All Events Calendar' : 'My Events Calendar'}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold">Event Calendar</h1>
            </div>
          </div>
          <p className="text-purple-100">
            {role === 'admin' 
              ? 'View and manage all events in calendar format' 
              : 'View all upcoming events and your registered events'}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4 flex flex-wrap gap-4 items-center">
          <span className="text-sm font-semibold text-gray-700">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-600 rounded"></div>
            <span className="text-sm text-gray-600">
              {role === 'admin' ? 'All Events' : 'Available Events'}
            </span>
          </div>
          {role === 'user' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-sm text-gray-600">Registered Events</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-sm text-gray-600">Past Events</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day', 'agenda']}
            view={currentView}
            onView={setCurrentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            popup
            tooltipAccessor={(event) => `${event.title} - ${moment(event.start).format('LT')}`}
            components={{
              toolbar: CustomToolbar
            }}
          />
        </div>
      </div>

      {/* Event Details Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold mb-2">{selectedEvent.title}</h2>
              <p className="text-purple-100">{selectedEvent.category}</p>
            </div>

            <div className="p-6 space-y-4">
              {selectedEvent.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">
                      {moment(selectedEvent.startAt).format('MMM DD, YYYY h:mm A')}
                    </p>
                  </div>
                </div>

                {selectedEvent.endAt && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">End Date</p>
                      <p className="font-semibold text-gray-900">
                        {moment(selectedEvent.endAt).format('MMM DD, YYYY h:mm A')}
                      </p>
                    </div>
                  </div>
                )}

                {selectedEvent.venue && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Venue</p>
                      <p className="font-semibold text-gray-900">{selectedEvent.venue.name}</p>
                    </div>
                  </div>
                )}

                {selectedEvent.capacity && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Users className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-600">Capacity</p>
                      <p className="font-semibold text-gray-900">{selectedEvent.capacity} people</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Calendar Export Buttons */}
              {role === 'user' && selectedEvent.isRegistered && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Add to Calendar</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadICS(selectedEvent._id, selectedEvent.title)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download .ics
                    </button>
                    <button
                      onClick={() => addToGoogleCalendar(selectedEvent._id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Google Calendar
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                >
                  Close
                </button>
                {role === 'admin' && (
                  <button
                    onClick={() => navigate(`/admin/category/${selectedEvent.category}`)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
                  >
                    Manage Event
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
