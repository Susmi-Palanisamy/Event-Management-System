import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, MapPin, DollarSign, Plus, Edit3, Trash2, ArrowLeft, Check, X } from 'lucide-react';

export default function VenueManagement({ token }) {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/venues', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setVenues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/venues/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          location,
          capacity: parseInt(capacity),
          description,
          amenities: amenities.split(',').map(a => a.trim()).filter(Boolean),
          pricePerHour: pricePerHour ? parseFloat(pricePerHour) : 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Venue created successfully!');
        resetForm();
        setShowCreate(false);
        fetchVenues();
      } else {
        alert(data.error || 'Failed to create venue');
      }
    } catch (error) {
      alert('Error creating venue');
    }
  };

  const handleUpdate = async (venueId) => {
    try {
      const venue = venues.find(v => v._id === venueId);
      const res = await fetch(`http://localhost:5000/api/venues/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: venue.name,
          location: venue.location,
          capacity: venue.capacity,
          description: venue.description,
          isAvailable: venue.isAvailable
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Venue updated successfully!');
        setEditingId(null);
        fetchVenues();
      } else {
        alert(data.error || 'Failed to update venue');
      }
    } catch (error) {
      alert('Error updating venue');
    }
  };

  const handleDelete = async (venueId) => {
    if (!window.confirm('Are you sure you want to delete this venue?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/venues/${venueId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert('Venue deleted successfully!');
        fetchVenues();
      } else {
        alert(data.error || 'Failed to delete venue');
      }
    } catch (error) {
      alert('Error deleting venue');
    }
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setCapacity('');
    setDescription('');
    setAmenities('');
    setPricePerHour('');
    setIsAvailable(true);
  };

  const updateVenueField = (id, field, value) => {
    setVenues(venues.map(v => v._id === id ? { ...v, [field]: value } : v));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-purple-600 hover:text-purple-700 font-medium"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Venue Management</h1>
              <p className="text-gray-600 mt-1">Manage available venues for events</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Venue
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Venue</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Grand Hall"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Building A, Floor 2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (Max People) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Per Hour (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows="2"
                  placeholder="Spacious hall with modern amenities..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities (comma separated)
                </label>
                <input
                  type="text"
                  value={amenities}
                  onChange={(e) => setAmenities(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Projector, WiFi, AC, Stage"
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  Create Venue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Venues List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading venues...</p>
          </div>
        ) : venues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <div
                key={venue._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition"
              >
                {editingId === venue._id ? (
                  /* Edit Mode */
                  <div className="p-6 space-y-3">
                    <input
                      type="text"
                      value={venue.name}
                      onChange={(e) => updateVenueField(venue._id, 'name', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Venue Name"
                    />
                    <input
                      type="text"
                      value={venue.location}
                      onChange={(e) => updateVenueField(venue._id, 'location', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Location"
                    />
                    <input
                      type="number"
                      value={venue.capacity}
                      onChange={(e) => updateVenueField(venue._id, 'capacity', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      placeholder="Capacity"
                    />
                    <textarea
                      value={venue.description || ''}
                      onChange={(e) => updateVenueField(venue._id, 'description', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      rows="2"
                      placeholder="Description"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={venue.isAvailable}
                        onChange={(e) => updateVenueField(venue._id, 'isAvailable', e.target.checked)}
                        className="w-4 h-4 text-purple-600 mr-2"
                      />
                      <span className="text-sm text-gray-700">Available</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(venue._id)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center justify-center"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <>
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <Building2 className="w-8 h-8" />
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          venue.isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {venue.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold">{venue.name}</h3>
                    </div>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center text-gray-700">
                        <MapPin className="w-5 h-5 mr-2 text-purple-600" />
                        <span className="text-sm">{venue.location}</span>
                      </div>

                      <div className="flex items-center text-gray-700">
                        <Users className="w-5 h-5 mr-2 text-purple-600" />
                        <span className="text-sm font-semibold">Capacity: {venue.capacity} people</span>
                      </div>

                      {venue.pricePerHour > 0 && (
                        <div className="flex items-center text-gray-700">
                          <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
                          <span className="text-sm">₹{venue.pricePerHour}/hour</span>
                        </div>
                      )}

                      {venue.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{venue.description}</p>
                      )}

                      {venue.amenities && venue.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {venue.amenities.map((amenity, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => setEditingId(venue._id)}
                          className="flex-1 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 flex items-center justify-center"
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(venue._id)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Venues Yet</h3>
            <p className="text-gray-600 mb-4">Create your first venue to get started</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Add Venue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
