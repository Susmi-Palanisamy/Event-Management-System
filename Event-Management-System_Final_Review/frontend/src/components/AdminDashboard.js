import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Users, BarChart3, Trophy, Plus, Edit3, Trash2, FolderKanban, Search } from "lucide-react";

export default function AdminDashboard({ token, onLogout }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", startAt: "", endAt: "" });
  const [category, setCategory] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [expandedEvent, setExpandedEvent] = useState(null);

  const categories = ["Tech", "Music", "Sports", "Education", "Business", "Health", "Arts", "Food"];

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/events/admin-events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setEvents([]);
    }
  };

  const fetchVenues = async (checkDates = false) => {
    try {
      console.log('Fetching venues from API...');
      
      let url = "http://localhost:5000/api/venues/available";
      
      // Add date filters if dates are selected and checkDates is true
      if (checkDates && startAt) {
        const params = new URLSearchParams();
        params.append('startAt', new Date(startAt).toISOString());
        if (endAt) {
          params.append('endAt', new Date(endAt).toISOString());
        }
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Venue API response status:', res.status);
      
      if (!res.ok) {
        console.error('Venue API error:', res.status, res.statusText);
        setVenues([]);
        return;
      }
      
      const data = await res.json();
      console.log('Venues fetched successfully:', data);
      console.log('Number of venues:', Array.isArray(data) ? data.length : 0);
      
      if (Array.isArray(data)) {
        setVenues(data);
        console.log('Venues state updated with', data.length, 'venues');
        
        // Clear selected venue if it's no longer available
        if (selectedVenue && !data.find(v => v._id === selectedVenue)) {
          setSelectedVenue("");
        }
      } else {
        console.warn('API returned non-array data:', data);
        setVenues([]);
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
      setVenues([]);
    }
  };

  const startEdit = (ev) => {
    setEditingId(ev._id);
    setEditForm({
      title: ev.title || "",
      description: ev.description || "",
      startAt: ev.startAt ? new Date(ev.startAt).toISOString().slice(0, 16) : "",
      endAt: ev.endAt ? new Date(ev.endAt).toISOString().slice(0, 16) : "",
    });
    setCategory(ev.category || "");
  };

  const saveEdit = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          startAt: editForm.startAt ? new Date(editForm.startAt).toISOString() : null,
          endAt: editForm.endAt ? new Date(editForm.endAt).toISOString() : null,
          category: category || null,
        }),
      });
      const data = await res.json();
      if (data.event) {
        setEditingId(null);
        fetchEvents();
      } else {
        alert(data.error || "Update failed");
      }
    } catch (e) {}
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.msg) {
        fetchEvents();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (token) {
      fetchEvents();
      fetchVenues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Refetch venues when dates change to show only available venues
  useEffect(() => {
    if (token && showCreate && (startAt || endAt)) {
      fetchVenues(true); // Pass true to check dates
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAt, endAt]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
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
          category: selectedCategory,
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
        setTitle("");
        setDescription("");
        setStartAt("");
        setEndAt("");
        setIsPaid(false);
        setPrice("");
        setCurrency("INR");
        setMaxAttendees("");
        setShowCreate(false);
        setSelectedCategory(null);
        fetchEvents();
      } else {
        alert(data.error || "Failed to create event");
      }
    } catch (err) {}
  };

  const totalRegistrations = events.reduce((sum, ev) => sum + (ev.registeredUsers?.length || 0), 0);
  const upcomingEvents = events.filter((ev) => new Date(ev.startAt || ev.date) >= new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage events, categories, and certificates</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button
              onClick={() => navigate('/search')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Events
            </button>
            <Link to="/admin/categories" className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700">
              <FolderKanban className="w-4 h-4 mr-2" />
              Manage Categories
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">{events.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Registrations</p>
                <p className="text-3xl font-bold text-gray-900">{totalRegistrations}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900">{upcomingEvents.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Admin Tools */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/admin/venues" className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <div className="flex items-center mb-2">
                <FolderKanban className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Venue Management</h3>
              </div>
              <p className="text-sm text-gray-600">Manage event venues and capacities</p>
            </Link>
            <Link to="/admin/certificates" className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <div className="flex items-center mb-2">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                <h3 className="font-semibold text-gray-900">Certificate Management</h3>
              </div>
              <p className="text-sm text-gray-600">Generate and manage digital certificates</p>
            </Link>
            <Link to="/admin/analytics" className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all">
              <div className="flex items-center mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Analytics Dashboard</h3>
              </div>
              <p className="text-sm text-gray-600">View charts, trends, and revenue analytics</p>
            </Link>
          </div>
        </div>

        {/* Categories grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat} to={`/admin/category/${encodeURIComponent(cat)}`} className="p-6 bg-white rounded-2xl shadow border border-gray-100 hover:shadow-lg transition text-center">
                <div className="text-2xl mb-2">
                  {cat === 'Tech' && '💻'}
                  {cat === 'Music' && '🎵'}
                  {cat === 'Sports' && '⚽'}
                  {cat === 'Education' && '📚'}
                  {cat === 'Business' && '💼'}
                  {cat === 'Health' && '🏥'}
                  {cat === 'Arts' && '🎨'}
                  {cat === 'Food' && '🍕'}
                </div>
                <h3 className="font-medium text-gray-900">{cat}</h3>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Create for selected category */}
        {selectedCategory && (
          <div className="mb-6">
            <button onClick={() => setSelectedCategory(null)} className="text-purple-600 hover:text-purple-700 font-medium">← Back to Categories</button>
            <h2 className="text-xl font-semibold text-gray-900 mt-2">Create {selectedCategory} Event</h2>
          </div>
        )}

        {selectedCategory && showCreate && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6 max-w-xl">
            <h2 className="font-bold text-xl mb-4 text-purple-700">Create {selectedCategory} Event</h2>
            
            {/* Debug Info - VERY VISIBLE */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-lg">
              <div className="text-lg font-bold mb-2">🔍 DEBUG INFO</div>
              <div className="text-sm space-y-1">
                <div>✓ Venues loaded: <span className="font-bold text-2xl">{venues.length}</span></div>
                <div>✓ Token: {token ? '✅ YES' : '❌ NO'}</div>
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => {
                    console.log('=== VENUE DEBUG ===');
                    console.log('Venues array:', venues);
                    console.log('Venues count:', venues.length);
                    console.log('Token:', token);
                    alert(`Venues: ${venues.length}\nCheck console for details`);
                  }} className="bg-white text-purple-600 px-3 py-1 rounded font-semibold hover:bg-gray-100">
                    Log to Console
                  </button>
                  <button type="button" onClick={() => {
                    fetchVenues();
                    alert('Fetching venues... Check console!');
                  }} className="bg-yellow-400 text-gray-900 px-3 py-1 rounded font-semibold hover:bg-yellow-300">
                    Force Reload Venues
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
              <input placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              
              {/* Venue Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Venue
                    {venues.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {venues.length} available
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchVenues()}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline transition-all"
                  >
                    ↻ Refresh
                  </button>
                </div>
                <select 
                  value={selectedVenue} 
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                >
                  <option value="">No Venue (Manual Location)</option>
                  {venues.map(venue => (
                    <option key={venue._id} value={venue._id}>
                      {venue.name} - {venue.location} (Capacity: {venue.capacity})
                    </option>
                  ))}
                </select>
                
                {/* Selected Venue Confirmation */}
                {selectedVenue && venues.find(v => v._id === selectedVenue) && (
                  <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
                    <span className="text-purple-600 text-xs">✓</span>
                    <div className="flex-1">
                      <p className="text-xs text-purple-800 font-medium">
                        {venues.find(v => v._id === selectedVenue).name}
                      </p>
                      <p className="text-xs text-purple-700">
                        Max capacity: {venues.find(v => v._id === selectedVenue).capacity} people
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Empty State */}
                {venues.length === 0 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <span className="text-amber-600 text-xs">⚠️</span>
                    <p className="text-xs text-amber-800">
                      No venues available. <Link to="/admin/venues" className="text-purple-600 hover:underline font-semibold">Create one</Link> or click Refresh.
                    </p>
                  </div>
                )}
              </div>

              {/* Max Attendees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees</label>
                <input 
                  type="number" 
                  min="1"
                  placeholder={selectedVenue && venues.find(v => v._id === selectedVenue) ? `Venue capacity: ${venues.find(v => v._id === selectedVenue).capacity}` : "Unlimited"}
                  value={maxAttendees} 
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  max={selectedVenue && venues.find(v => v._id === selectedVenue) ? venues.find(v => v._id === selectedVenue).capacity : undefined}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited attendees</p>
              </div>
              
              {/* Payment Settings */}
              <div className="border-t border-gray-200 pt-3">
                <label className="flex items-center mb-3">
                  <input 
                    type="checkbox" 
                    checked={isPaid} 
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-900">This is a paid event</span>
                </label>
                
                {isPaid && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
                      <input 
                        type="number" 
                        min="1"
                        step="0.01"
                        placeholder="500" 
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)}
                        required={isPaid}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Attendees</label>
                      <input 
                        type="number" 
                        min="1"
                        placeholder="Unlimited" 
                        value={maxAttendees} 
                        onChange={(e) => setMaxAttendees(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" 
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition">
                Create {selectedCategory} Event
              </button>
            </div>
          </form>
        )}

        {selectedCategory && !showCreate && (
          <button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-lg mb-6 hover:from-purple-700 hover:to-pink-700">
            <Plus className="w-4 h-4 inline-block mr-2" /> Create {selectedCategory} Event
          </button>
        )}

        {/* All Events List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Events</h2>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {events.map((ev) => (
                <div key={ev._id} className="bg-white p-6 rounded-2xl shadow border border-gray-100">
                  {editingId === ev._id ? (
                    /* Edit Form */
                    <div className="space-y-3">
                      <input
                        placeholder="Title"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                      <textarea
                        placeholder="Description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        rows="2"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="datetime-local"
                          value={editForm.startAt}
                          onChange={(e) => setEditForm({ ...editForm, startAt: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="datetime-local"
                          value={editForm.endAt}
                          onChange={(e) => setEditForm({ ...editForm, endAt: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{ev.title}</h3>
                          {ev.category && (
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full mt-1">
                              {ev.category}
                            </span>
                          )}
                          {ev.isPaid && (
                            <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full mt-1 ml-2">
                              Paid: {ev.currency === 'INR' ? '₹' : ev.currency}{ev.price}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(ev)}
                            className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEvent(ev._id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {ev.description && (
                        <p className="text-gray-600 text-sm mb-2">{ev.description}</p>
                      )}
                      <div className="text-sm text-gray-500">
                        <p>📅 {ev.startAt ? new Date(ev.startAt).toLocaleString() : 'No date'}</p>
                        <button 
                          onClick={() => setExpandedEvent(expandedEvent === ev._id ? null : ev._id)}
                          className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                          👥 {ev.registeredUsers?.length || 0} registered
                          <span className="text-xs">{expandedEvent === ev._id ? '▼' : '▶'}</span>
                        </button>
                      </div>
                      
                      {/* Expanded Registered Users List */}
                      {expandedEvent === ev._id && ev.registeredUsers && ev.registeredUsers.length > 0 && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="text-sm font-semibold text-purple-900 mb-2">Registered Users:</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {ev.registeredUsers.map((user, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs bg-white p-2 rounded border border-purple-100">
                                <Users className="w-4 h-4 text-purple-600" />
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{user.name || 'N/A'}</p>
                                  <p className="text-gray-600">{user.email || 'N/A'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No events created yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

