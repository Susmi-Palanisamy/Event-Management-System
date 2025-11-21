import React, { useState, useEffect } from "react";

function CreateEvent({ token, onEventCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("published");
  const [guests, setGuests] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [saving, setSaving] = useState(false);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState("");

  // Fetch available venues based on event dates
  useEffect(() => {
    const fetchAvailableVenues = async () => {
      try {
        let url = "http://localhost:5000/api/venues/available";
        
        // Add date filters if dates are selected
        const params = new URLSearchParams();
        if (startAt) {
          params.append('startAt', new Date(startAt).toISOString());
        }
        if (endAt) {
          params.append('endAt', new Date(endAt).toISOString());
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setVenues(Array.isArray(data) ? data : []);
        
        // Clear selected venue if it's no longer available
        if (selectedVenue && !data.find(v => v._id === selectedVenue)) {
          setSelectedVenue("");
          alert("The previously selected venue is no longer available for the chosen time slot.");
        }
      } catch (err) {
        console.error('Error fetching venues:', err);
        setVenues([]);
      }
    };
    
    if (token) {
      fetchAvailableVenues();
    }
  }, [token, startAt, endAt, selectedVenue]);

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validate start date is not in the past
    if (startAt) {
      const selectedDate = new Date(startAt);
      const currentDate = new Date();
      
      if (selectedDate < currentDate) {
        alert("Cannot create events with past dates. Please select a future date and time.");
        return;
      }
    }
    
    // Validate end date is after start date
    if (startAt && endAt) {
      const start = new Date(startAt);
      const end = new Date(endAt);
      
      if (end < start) {
        alert("End date cannot be before start date.");
        return;
      }
    }
    
    try {
      setSaving(true);
      const res = await fetch("http://localhost:5000/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          startAt: startAt ? new Date(startAt).toISOString() : null,
          endAt: endAt ? new Date(endAt).toISOString() : null,
          timezone,
          location,
          venue: selectedVenue || null,
          status,
          guests: guests.split(",").map((g) => g.trim()).filter(Boolean),
          isPaid,
          price: isPaid ? parseFloat(price) : 0,
          currency,
          maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        }),
      });
      const data = await res.json();
      if (data.event) {
        onEventCreated && onEventCreated(data.event);
        setTitle("");
        setDescription("");
        setStartAt("");
        setEndAt("");
        setTimezone("UTC");
        setLocation("");
        setStatus("published");
        setGuests("");
        setIsPaid(false);
        setPrice("");
        setCurrency("INR");
        setMaxAttendees("");
        setSelectedVenue("");
        alert("Event created successfully!");
      } else {
        alert(data.error || "Failed to create event");
      }
    } catch (err) {
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Create Event</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Enter event title" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Short description (optional)" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start date & time</label>
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End date & time</label>
          <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="UTC">UTC</option>
            <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {/* Venue Selection */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Select Venue {venues.length > 0 && startAt && <span className="text-green-600 text-xs">({venues.length} available for selected time)</span>}
            </label>
            {startAt && (
              <button
                type="button"
                onClick={() => {
                  // Force refetch by updating a dummy state
                  const fetchNow = async () => {
                    try {
                      let url = "http://localhost:5000/api/venues/available";
                      const params = new URLSearchParams();
                      if (startAt) {
                        params.append('startAt', new Date(startAt).toISOString());
                      }
                      if (endAt) {
                        params.append('endAt', new Date(endAt).toISOString());
                      }
                      if (params.toString()) {
                        url += `?${params.toString()}`;
                      }
                      const res = await fetch(url, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      const data = await res.json();
                      setVenues(Array.isArray(data) ? data : []);
                    } catch (err) {
                      console.error('Error:', err);
                    }
                  };
                  fetchNow();
                }}
                className="text-xs text-purple-600 hover:text-purple-700 underline"
              >
                🔄 Refresh Availability
              </button>
            )}
          </div>
          
          {!startAt && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl mb-3">
              <p className="text-sm text-blue-800 font-medium">
                📅 Please select event start date/time above to check venue availability
              </p>
            </div>
          )}
          
          <select 
            value={selectedVenue} 
            onChange={(e) => setSelectedVenue(e.target.value)}
            disabled={!startAt}
            className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${!startAt ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">No Venue (Manual Location)</option>
            {venues.map(venue => (
              <option key={venue._id} value={venue._id}>
                {venue.name} - {venue.location} (Capacity: {venue.capacity})
              </option>
            ))}
          </select>
          
          {venues.length === 0 && startAt && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                ❌ No venues available for the selected date/time!
              </p>
              <p className="text-xs text-red-700 mt-1">
                All venues are booked for this time slot. Try a different time or use manual location below.
              </p>
            </div>
          )}
          
          {venues.length > 0 && startAt && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                ✅ Showing {venues.length} venue(s) available for: {new Date(startAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Manual Location (Optional)</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Enter location if no venue selected" />
          <p className="text-xs text-gray-500 mt-1">Leave empty if you selected a venue above</p>
        </div>
        
        {/* Max Attendees - Moved here for all events */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees</label>
          <input 
            type="number" 
            min="1"
            placeholder={selectedVenue && venues.find(v => v._id === selectedVenue) ? `Venue capacity: ${venues.find(v => v._id === selectedVenue).capacity}` : "Unlimited"}
            value={maxAttendees} 
            onChange={(e) => setMaxAttendees(e.target.value)}
            max={selectedVenue && venues.find(v => v._id === selectedVenue) ? venues.find(v => v._id === selectedVenue).capacity : undefined}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited attendees</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
          <input type="text" value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Comma separated emails (optional)" />
          <p className="text-xs text-gray-500 mt-1">Guests will receive invitations after the event is created.</p>
        </div>
        
        {/* Payment Settings */}
        <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
          <div className="flex items-center mb-4">
            <input 
              type="checkbox" 
              id="isPaid"
              checked={isPaid} 
              onChange={(e) => setIsPaid(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="isPaid" className="ml-2 text-sm font-medium text-gray-900">
              This is a paid event (requires payment for registration)
            </label>
          </div>
          
          {isPaid && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input 
                  type="number" 
                  min="1"
                  step="0.01"
                  placeholder="500" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  required={isPaid}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Note</label>
                <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                  Max attendees is set above. Price: {currency} {price || '0'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6">
        <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50">
          {saving ? "Creating..." : "Create Event"}
        </button>
      </div>
    </form>
  );
}

export default CreateEvent;
