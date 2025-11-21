import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

export default function PaymentPage({ token }) {
  const location = useLocation();
  const navigate = useNavigate();
  const event = location.state?.event;
  
  const [contactInfo, setContactInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('GPay');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Redirect if no event data
  if (!event) {
    navigate('/dashboard');
    return null;
  }
  
  const handlePayment = async (e) => {
    e.preventDefault();
    
    // Validate contact info
    if (!contactInfo.fullName || !contactInfo.email || 
        !contactInfo.phone || !contactInfo.address) {
      alert('Please fill all contact information');
      return;
    }
    
    // For digital payments, require transaction ID
    if (paymentMethod !== 'Cash on Registration' && !transactionId) {
      alert('Please enter transaction ID for digital payments');
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/payments/register-paid-event/${event._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentMethod,
            transactionId: transactionId || undefined,
            contactInfo
          })
        }
      );
      
      const data = await res.json();
      
      if (data.msg) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-6 mb-6 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h3 className="text-xl font-bold text-green-900">Payment Successful!</h3>
              <p className="text-green-700">You are now registered for this event.</p>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex items-center mb-2">
              <CreditCard className="w-6 h-6 mr-2" />
              <h1 className="text-2xl font-bold">Complete Payment</h1>
            </div>
            <p className="text-purple-100">Secure event registration payment</p>
          </div>
          
          {/* Event Details */}
          <div className="bg-purple-50 p-6 border-b border-purple-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h2>
            <p className="text-gray-600 mb-3">{event.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Event Date:</span>
              <span className="font-semibold">
                {new Date(event.startAt).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-purple-200">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-3xl font-bold text-purple-600">
                {event.currency === 'INR' ? '₹' : event.currency} {event.price}
              </span>
            </div>
          </div>
          
          <form onSubmit={handlePayment} className="p-6 space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">1</span>
                Contact Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={contactInfo.fullName}
                    onChange={(e) => setContactInfo({...contactInfo, fullName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    placeholder="Enter your complete address"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Payment Method */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">2</span>
                Payment Method
              </h3>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
              >
                <option value="GPay">Google Pay (GPay)</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
                <option value="Cash on Registration">Cash on Registration</option>
              </select>
            </div>
            
            {/* Transaction ID (for digital payments) */}
            {paymentMethod !== 'Cash on Registration' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm font-bold">3</span>
                  Transaction Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
                  <input
                    type="text"
                    placeholder="Enter transaction ID from your payment app"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">How to get Transaction ID:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Open {paymentMethod} app</li>
                          <li>Send ₹{event.price} to the event organizer</li>
                          <li>Copy the Transaction ID from payment confirmation</li>
                          <li>Paste it in the field above</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Cash on Registration Info */}
            {paymentMethod === 'Cash on Registration' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Cash on Registration</p>
                    <p>You can pay ₹{event.price} in cash when you arrive at the event. Your registration will be marked as pending until payment is received.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : success ? (
                  'Payment Successful!'
                ) : (
                  `Complete Payment - ${event.currency === 'INR' ? '₹' : event.currency}${event.price}`
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full mt-3 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
