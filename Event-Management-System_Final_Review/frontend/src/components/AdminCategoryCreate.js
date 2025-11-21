import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminCategoryCreate({ token }) {
  const { cat } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venueConflict, setVenueConflict] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    fetchVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    // Check venue availability when venue, start time, or end time changes
    const timeoutId = setTimeout(() => {
      checkVenueAvailability();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVenue, startAt, endAt]);

  const fetchVenues = async () => {
    try {
      setLoadingVenues(true);
      const res = await fetch("http://localhost:5000/api/venues", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        console.error('Venue API error:', res.status);
        setVenues([]);
        return;
      }
      
      const data = await res.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching venues:', err);
      setVenues([]);
    } finally {
      setLoadingVenues(false);
    }
  };

  const checkVenueAvailability = async () => {
    if (!selectedVenue || !startAt) {
      setVenueConflict(null);
      setCheckingAvailability(false);
      return;
    }

    try {
      setCheckingAvailability(true);
      const res = await fetch("http://localhost:5000/api/venues/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          venueId: selectedVenue,
          startAt: startAt ? new Date(startAt).toISOString() : null,
          endAt: endAt ? new Date(endAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      
      if (!data.available && data.conflicts && data.conflicts.length > 0) {
        setVenueConflict(data.conflicts[0]);
      } else {
        setVenueConflict(null);
      }
    } catch (err) {
      console.error('Error checking venue availability:', err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Final check before submission
    if (venueConflict) {
      if (!window.confirm('This venue has a scheduling conflict. Do you want to proceed anyway? (Not recommended)')) {
        return;
      }
    }
    
    try {
      const res = await fetch("http://localhost:5000/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          description,
          startAt: startAt ? new Date(startAt).toISOString() : null,
          endAt: endAt ? new Date(endAt).toISOString() : null,
          category: cat,
          venue: selectedVenue || null,
          isPaid,
          price: isPaid ? parseFloat(price) : 0,
          currency,
          maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        }),
      });
      const data = await res.json();
      if (data.event) {
        alert("Event created successfully!");
        navigate(`/admin/category/${encodeURIComponent(cat)}`);
      } else {
        alert(data.error || "Failed to create event");
      }
    } catch (e) { 
      console.error(e);
      alert('Error creating event. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-8">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="group flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-6 transition-all hover:gap-3"
        >
          <span className="text-xl">←</span>
          <span>Back to Events</span>
        </button>
        
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 shadow-2xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <p className="text-purple-200 text-sm font-medium">Event Creation Wizard</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Create {cat} Event</h1>
            </div>
          </div>
          <p className="text-purple-100 mt-4">Fill in the details below to create an amazing event with advanced features like venue management, conflict detection, and capacity control.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="max-w-4xl mx-auto">
        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Progress Indicator */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5"></div>
          
          <div className="p-6 sm:p-8 space-y-6">
            {/* Event Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                  1
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
                  <p className="text-sm text-gray-500">Basic information about your event</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-purple-600">📝</span>
                    Event Title *
                  </label>
                  <input 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-purple-300 bg-gray-50 focus:bg-white" 
                    placeholder="Enter an engaging event title..." 
                    value={title} 
                    onChange={(e)=>setTitle(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-purple-600">📄</span>
                    Description
                  </label>
                  <textarea 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-purple-300 bg-gray-50 focus:bg-white min-h-[100px]" 
                    placeholder="Describe what makes this event special..." 
                    value={description} 
                    onChange={(e)=>setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Date & Time Section */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                  2
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Schedule</h2>
                  <p className="text-sm text-gray-500">When will this event take place?</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-blue-600">🗓️</span>
                    Start Date & Time *
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300 bg-gray-50 focus:bg-white" 
                    value={startAt} 
                    onChange={(e)=>setStartAt(e.target.value)} 
                    required 
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-blue-600">⏰</span>
                    End Date & Time
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-blue-300 bg-gray-50 focus:bg-white" 
                    value={endAt} 
                    onChange={(e)=>setEndAt(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            {/* Venue Selection Section */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                  3
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Venue & Capacity</h2>
                  <p className="text-sm text-gray-500">Smart venue management with conflict detection</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-green-600">🏢</span>
                    Select Venue
                    {!loadingVenues && venues.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-green-600 bg-white px-2 py-0.5 rounded-full border border-green-200">
                        {venues.length} available
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchVenues()}
                    disabled={loadingVenues}
                    className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                  >
                    {loadingVenues ? '⟳ Loading...' : '↻ Refresh'}
                  </button>
                </div>
                
                <select 
                  value={selectedVenue} 
                  onChange={(e) => {
                    setSelectedVenue(e.target.value);
                    // Auto-fill max attendees with venue capacity if venue is selected
                    if (e.target.value) {
                      const venue = venues.find(v => v._id === e.target.value);
                      if (venue && !maxAttendees) {
                        setMaxAttendees(venue.capacity.toString());
                      }
                    }
                  }}
                  className="w-full p-4 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:border-green-300 bg-white"
                >
            <option value="">No Venue (Manual Location)</option>
            {loadingVenues ? (
              <option disabled>Loading venues...</option>
            ) : (
              venues.map(venue => (
                <option key={venue._id} value={venue._id}>
                  {venue.name} - {venue.location} (Capacity: {venue.capacity})
                </option>
              ))
            )}
          </select>

          {/* Empty State Warning */}
          {!loadingVenues && venues.length === 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <span className="text-amber-600 text-sm">⚠️</span>
              <div className="flex-1">
                <p className="text-xs text-amber-800 font-medium">No venues available</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Please create a venue first in <a href="/admin/venues" className="text-purple-600 hover:underline font-semibold">Venue Management</a> or click Refresh.
                </p>
              </div>
            </div>
          )}

          {/* Selected Venue Confirmation */}
          {selectedVenue && venues.find(v => v._id === selectedVenue) && !checkingAvailability && !venueConflict && (
            <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
              <span className="text-purple-600 text-sm">✓</span>
              <div className="flex-1">
                <p className="text-xs text-purple-800 font-medium">
                  {venues.find(v => v._id === selectedVenue).name}
                </p>
                <p className="text-xs text-purple-700 mt-0.5">
                  {venues.find(v => v._id === selectedVenue).location} • Max capacity: {venues.find(v => v._id === selectedVenue).capacity} people
                </p>
              </div>
            </div>
          )}

          {/* Checking Availability Indicator */}
          {checkingAvailability && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-xs text-blue-800 font-medium">
                Checking venue availability...
              </p>
            </div>
          )}

          {/* Conflict Warning */}
          {venueConflict && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-red-600 text-sm">⚠️</span>
                <div className="flex-1">
                  <p className="text-xs text-red-800 font-semibold">
                    Venue Conflict Detected!
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    This venue is already booked for "<strong>{venueConflict.title}</strong>"
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    From: {new Date(venueConflict.startAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-red-600">
                    To: {venueConflict.endAt ? new Date(venueConflict.endAt).toLocaleString() : 'No end time'}
                  </p>
                  <p className="text-xs text-red-700 mt-2 font-medium">
                    → Please select a different venue or change the event time.
                  </p>
                </div>
              </div>
            </div>
          )}
              </div>
              
              {/* Max Attendees */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-green-600">👥</span>
                  Maximum Attendees
                </label>
                <input 
                  type="number" 
                  min="1"
                  placeholder={selectedVenue && venues.find(v => v._id === selectedVenue) ? `Venue capacity: ${venues.find(v => v._id === selectedVenue).capacity}` : "Unlimited capacity"}
                  value={maxAttendees} 
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  max={selectedVenue && venues.find(v => v._id === selectedVenue) ? venues.find(v => v._id === selectedVenue).capacity : undefined}
                  className="w-full p-4 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all hover:border-green-300 bg-white" 
                />
                <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                  <span>💡</span>
                  Leave empty for unlimited attendees
                </p>
              </div>
            </div>

            {/* Payment Settings Section */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                  4
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pricing & Registration</h2>
                  <p className="text-sm text-gray-500">Set ticket pricing and registration options</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={isPaid} 
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="w-6 h-6 text-yellow-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 cursor-pointer transition-all"
                    />
                  </div>
                  <div>
                    <span className="text-base font-semibold text-gray-900 group-hover:text-yellow-700 transition-colors">💰 This is a paid event</span>
                    <p className="text-xs text-gray-600">Enable ticket pricing for this event</p>
                  </div>
                </label>
                
                {isPaid && (
                  <div className="mt-4 pt-4 border-t border-yellow-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-yellow-600">💵</span>
                          Ticket Price *
                        </label>
                        <input 
                          type="number" 
                          min="1"
                          step="0.01"
                          placeholder="Enter price (e.g., 500)" 
                          value={price} 
                          onChange={(e) => setPrice(e.target.value)}
                          required={isPaid}
                          className="w-full p-4 border-2 border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all hover:border-yellow-300 bg-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-yellow-600">💱</span>
                          Currency
                        </label>
                        <select 
                          value={currency} 
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full p-4 border-2 border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all hover:border-yellow-300 bg-white"
                        >
                          <option value="INR">🇮🇳 INR (₹)</option>
                          <option value="USD">🇺🇸 USD ($)</option>
                          <option value="EUR">🇪🇺 EUR (€)</option>
                          <option value="GBP">🇬🇧 GBP (£)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transform hover:scale-[1.02] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">✨</span>
                <span>Create {cat} Event</span>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                🔒 Your event will be created with advanced features enabled
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}







