import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Edit3, Trash2, Send, ArrowLeft, Users, ChevronDown, ChevronRight } from "lucide-react";

export default function AdminCategoryPage({ token }) {
  const { cat } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", startAt: "", endAt: "" });
  const [rsvpForEvent, setRsvpForEvent] = useState({});
  const [expandedRegistered, setExpandedRegistered] = useState(null);
  const [expandedRsvp, setExpandedRsvp] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/events/admin-events?category=${encodeURIComponent(cat)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); setEvents([]); }
    })();
  }, [cat, token]);

  const refresh = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/admin-events?category=${encodeURIComponent(cat)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const startEdit = (ev) => {
    setEditingId(ev._id);
    setEditForm({
      title: ev.title || "",
      description: ev.description || "",
      startAt: ev.startAt ? new Date(ev.startAt).toISOString().slice(0, 16) : "",
      endAt: ev.endAt ? new Date(ev.endAt).toISOString().slice(0, 16) : "",
    });
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
          category: cat,
        }),
      });
      const data = await res.json();
      if (data.event) {
        setEditingId(null);
        await refresh();
      } else {
        alert(data.error || "Update failed");
      }
    } catch (e) { console.error(e); }
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
        await refresh();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (e) { console.error(e); }
  };

  const loadRsvp = async (eventId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/rsvps/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data && data.counts) {
        setRsvpForEvent((prev) => ({ ...prev, [eventId]: data }));
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-purple-600 hover:text-purple-700 font-medium flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{cat} Events</h1>
          </div>
          <Link to={`/admin/category/${encodeURIComponent(cat)}/create`} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700">Create {cat} Event</Link>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-600">No events yet in this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div key={ev._id} className="bg-white p-6 rounded-2xl shadow border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{ev.title}</h3>
                    {ev.isPaid && (
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full mt-1">
                        Paid: {ev.currency === 'INR' ? '₹' : ev.currency === 'USD' ? '$' : ev.currency === 'EUR' ? '€' : ev.currency === 'GBP' ? '£' : ev.currency}{ev.price}
                      </span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{new Date(ev.startAt).toLocaleDateString()}</span>
                </div>
                {ev.description && <p className="text-gray-600 mb-3 line-clamp-2">{ev.description}</p>}
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {ev.startAt ? new Date(ev.startAt).toLocaleString() : ''}</div>
                  <div>Created by: {ev.createdBy?.name} ({ev.createdBy?.email})</div>
                  <button 
                    onClick={() => setExpandedRegistered(expandedRegistered === ev._id ? null : ev._id)}
                    className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    {expandedRegistered === ev._id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    Registered Users: {ev.registeredUsers?.length || 0}
                  </button>
                </div>
                
                {/* Expanded Registered Users List */}
                {expandedRegistered === ev._id && ev.registeredUsers && ev.registeredUsers.length > 0 && (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-1">
                      <Users className="w-4 h-4" /> Registered Users:
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {ev.registeredUsers.map((user, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs bg-white p-2 rounded border border-green-100">
                          <Users className="w-4 h-4 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{user.name || 'N/A'}</p>
                            <p className="text-gray-600">{user.email || 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => startEdit(ev)} className="px-3 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 flex items-center"><Edit3 className="w-4 h-4 mr-1" /> Edit</button>
                  <button className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center" onClick={() => deleteEvent(ev._id)}><Trash2 className="w-4 h-4 mr-1" /> Delete</button>
                  <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center" onClick={async () => {
                    const emails = prompt('Enter emails (comma separated)');
                    if (!emails) return;
                    const list = emails.split(',').map(x => x.trim()).filter(Boolean);
                    if (list.length === 0) return;
                    try {
                      const res = await fetch(`http://localhost:5000/api/invitations/${ev._id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ emails: list })
                      });
                      const data = await res.json();
                      if (data.msg) alert('Invitations sent'); else alert(data.error || 'Failed');
                    } catch (e) { console.error(e); }
                  }}><Send className="w-4 h-4 mr-1" /> Send Invites</button>
                  <button 
                    className="px-3 py-2 bg-purple-700 text-white rounded hover:bg-purple-800 flex items-center" 
                    onClick={async () => {
                      await loadRsvp(ev._id);
                      setExpandedRsvp(ev._id);
                    }}
                  >
                    Load RSVPs
                  </button>
                </div>

                {rsvpForEvent[ev._id]?.counts && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedRsvp(expandedRsvp === ev._id ? null : ev._id)}
                      className="text-sm text-purple-700 font-medium flex items-center gap-1 mb-2"
                    >
                      {expandedRsvp === ev._id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      RSVPs: Going {rsvpForEvent[ev._id].counts.going || 0} · Maybe {rsvpForEvent[ev._id].counts.maybe || 0} · Not going {rsvpForEvent[ev._id].counts.not_going || 0}
                    </button>
                    
                    {/* Expanded RSVP Details */}
                    {expandedRsvp === ev._id && rsvpForEvent[ev._id]?.rsvps && rsvpForEvent[ev._id].rsvps.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">RSVP Details:</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {rsvpForEvent[ev._id].rsvps.map((rsvp, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs bg-white p-2 rounded border border-blue-100">
                              <div className={`px-2 py-1 rounded text-xs font-semibold ${
                                rsvp.status === 'going' ? 'bg-green-100 text-green-700' :
                                rsvp.status === 'maybe' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {rsvp.status === 'going' ? '✓ Going' : rsvp.status === 'maybe' ? '? Maybe' : '✗ Not Going'}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{rsvp.user?.name || rsvp.email || 'N/A'}</p>
                                <p className="text-gray-600">{rsvp.user?.email || rsvp.email || 'N/A'}</p>
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
        )}

        {editingId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow w-full max-w-lg">
              <h3 className="text-xl font-semibold mb-3">Edit Event</h3>
              <input className="w-full p-3 border border-gray-200 rounded-xl mb-2" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              <textarea className="w-full p-3 border border-gray-200 rounded-xl mb-2" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <input type="datetime-local" className="w-full p-3 border border-gray-200 rounded-xl" value={editForm.startAt} onChange={(e) => setEditForm({ ...editForm, startAt: e.target.value })} />
                <input type="datetime-local" className="w-full p-3 border border-gray-200 rounded-xl" value={editForm.endAt} onChange={(e) => setEditForm({ ...editForm, endAt: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <button className="px-3 py-2" onClick={() => setEditingId(null)}>Cancel</button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={saveEdit}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


