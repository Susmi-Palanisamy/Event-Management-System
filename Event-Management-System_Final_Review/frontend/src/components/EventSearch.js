import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, DollarSign, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EventSearch({ token }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPaid, setIsPaid] = useState('');
  const [location, setLocation] = useState('');

  const categories = ['Tech', 'Music', 'Sports', 'Education', 'Business', 'Health', 'Arts', 'Food'];

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (category) params.append('category', category);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (isPaid) params.append('isPaid', isPaid);
      if (location) params.append('location', location);

      const res = await fetch(`http://localhost:5000/api/events/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Search error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
    setIsPaid('');
    setLocation('');
    setEvents([]);
  };

  useEffect(() => {
    // Auto-search when filters change (debounced)
    const timer = setTimeout(() => {
      if (searchQuery || category || minPrice || maxPrice || startDate || endDate || isPaid || location) {
        handleSearch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, category, minPrice, maxPrice, startDate, endDate, isPaid, location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Search Events</h1>
          <p className="text-gray-600">Find the perfect event for you</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
                showFilters 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
            {(searchQuery || category || minPrice || maxPrice || startDate || endDate || isPaid || location) && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Clear
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              {/* Category */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 mr-1" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price Type */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Price Type
                </label>
                <select
                  value={isPaid}
                  onChange={(e) => setIsPaid(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Events</option>
                  <option value="false">Free Only</option>
                  <option value="true">Paid Only</option>
                </select>
              </div>

              {/* Min Price */}
              {isPaid === 'true' && (
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {/* Max Price */}
              {isPaid === 'true' && (
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-1" />
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-1" />
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City or venue"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Searching events...</p>
            </div>
          ) : events.length > 0 ? (
            <>
              <div className="mb-4 text-gray-600">
                Found <span className="font-semibold text-purple-600">{events.length}</span> event{events.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <Link
                    key={event._id}
                    to={`/event/${event._id}`}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{event.title}</h3>
                        {event.category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full whitespace-nowrap ml-2">
                            {event.category}
                          </span>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                      )}

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                          {new Date(event.startAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                            {event.location}
                          </div>
                        )}

                        {event.isPaid ? (
                          <div className="flex items-center font-semibold text-orange-600">
                            <DollarSign className="w-4 h-4 mr-2" />
                            {event.currency === 'INR' ? '₹' : event.currency === 'USD' ? '$' : event.currency === 'EUR' ? '€' : '£'}
                            {event.price}
                          </div>
                        ) : (
                          <div className="flex items-center font-semibold text-green-600">
                            <Tag className="w-4 h-4 mr-2" />
                            Free Event
                          </div>
                        )}

                        <div className="flex items-center text-gray-500">
                          👥 {event.registeredUsers?.length || 0} registered
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (searchQuery || category || minPrice || maxPrice || startDate || endDate || isPaid || location) ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start searching</h3>
              <p className="text-gray-600">Enter a search term or apply filters to find events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
