import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Printer, Share2, Calendar, MapPin, Clock, Ticket, ArrowLeft } from 'lucide-react';

export default function EventTicket({ token }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [event, setEvent] = useState(null);

  useEffect(() => {
    fetchTicket();
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEvent(data);
    } catch (err) {
      console.error('Error fetching event:', err);
    }
  };

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/tickets/generate/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setQrCode(data.qrCode);
        setTicketData(data.ticketData);
      } else {
        setError(data.error || 'Failed to generate ticket');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = () => {
    // Create a canvas to draw the ticket
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 1000);
    gradient.addColorStop(0, '#9333ea');
    gradient.addColorStop(1, '#ec4899');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 1000);

    // White ticket area
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(50, 100, 700, 800);

    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EVENT TICKET', 400, 160);

    // Event title
    ctx.font = 'bold 28px Arial';
    ctx.fillText(ticketData.eventTitle, 400, 220);

    // Details
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4b5563';
    ctx.fillText(`Name: ${ticketData.userName}`, 100, 280);
    ctx.fillText(`Email: ${ticketData.userEmail}`, 100, 320);
    ctx.fillText(`Date: ${new Date(ticketData.eventDate).toLocaleString()}`, 100, 360);
    ctx.fillText(`Location: ${ticketData.location}`, 100, 400);
    ctx.fillText(`Ticket ID: ${ticketData.ticketId}`, 100, 440);

    // QR Code
    const qrImage = new Image();
    qrImage.onload = () => {
      ctx.drawImage(qrImage, 250, 500, 300, 300);
      
      // Download
      const link = document.createElement('a');
      link.download = `ticket-${ticketData.eventTitle}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    qrImage.src = qrCode;
  };

  const printTicket = () => {
    window.print();
  };

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${ticketData.eventTitle}`,
          text: `I'm attending ${ticketData.eventTitle}!`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Generating your ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-purple-600 hover:text-purple-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={downloadTicket}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={printTicket}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <button
              onClick={shareTicket}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
        </div>

        {/* Ticket Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <Ticket className="w-12 h-12" />
              <span className="text-sm font-medium bg-white/20 px-4 py-2 rounded-full">
                ADMIT ONE
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{ticketData.eventTitle}</h1>
            <p className="text-purple-100">Official Event Ticket</p>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Attendee Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-lg font-semibold text-gray-900">{ticketData.userName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-lg font-medium text-gray-900">{ticketData.userEmail}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Event Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-purple-600 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Date & Time</p>
                        <p className="font-medium text-gray-900">
                          {new Date(ticketData.eventDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-gray-700">
                          {new Date(ticketData.eventDate).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-purple-600 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">{ticketData.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-purple-600 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Ticket ID</p>
                        <p className="font-mono text-sm text-gray-900">{ticketData.ticketId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-purple-100">
                  <img 
                    src={qrCode} 
                    alt="Ticket QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mt-4 max-w-xs">
                  Scan this QR code at the event entrance for quick check-in
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <p>Generated on {new Date(ticketData.generatedAt).toLocaleDateString()}</p>
                <p className="font-medium text-purple-600">Valid for single entry</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📱 Important Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Please arrive 15 minutes before the event starts</li>
            <li>• Have this QR code ready (digital or printed) for scanning</li>
            <li>• Bring a valid ID for verification</li>
            <li>• This ticket is non-transferable and valid for one person only</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
