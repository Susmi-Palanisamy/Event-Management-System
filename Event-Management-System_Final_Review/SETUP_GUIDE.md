# Setup Guide for Review Updates

## Quick Start

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

This will install the new `razorpay` package along with all other dependencies.

### 2. Configure Environment Variables

Update your `backend/.env` file with Razorpay credentials:

```env
# Existing variables
MONGO_URI=mongodb://localhost:27017/eventdb
JWT_SECRET=your-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="Events <noreply@example.com>"
PUBLIC_WEB_URL=http://localhost:3000

# NEW: Razorpay Configuration (Optional - for paid events)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
```

### 3. Get Razorpay Credentials (For Testing)

1. Go to https://razorpay.com/
2. Sign up for a free account
3. Navigate to **Settings** > **API Keys**
4. Click **Generate Test Key**
5. Copy the **Key ID** and **Key Secret**
6. Paste them into your `.env` file

**Note**: For testing, use Test Mode keys. For production, generate Live keys.

### 4. Start the Application

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

### 5. Test the New Features

#### A. Test Form Validation
1. Go to http://localhost:3000/signup
2. Try submitting with:
   - Empty fields
   - Invalid email (e.g., "notanemail")
   - Weak password (e.g., "123")
   - Name with numbers
3. Verify error messages appear

#### B. Test Past Event Prevention
1. Login as admin
2. Create an event with a past date
3. Try to register for it
4. Should see "Event Ended" button (disabled)

#### C. Test Payment Flow (After Frontend UI is implemented)
1. Create a paid event (isPaid=true, price=500)
2. Try to register
3. Payment modal should open
4. Complete test payment
5. Verify registration success

---

## Testing Payment with Razorpay Test Mode

### Test Card Details
Use these test cards in Razorpay Test Mode:

**Successful Payment**:
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

**Failed Payment**:
- Card Number: `4000 0000 0000 0002`
- This will simulate a failed payment

**More test cards**: https://razorpay.com/docs/payments/payments/test-card-details/

---

## API Testing with Postman/Thunder Client

### 1. Create a Paid Event
```http
POST http://localhost:5000/api/events/create
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "title": "Premium Workshop",
  "description": "Advanced React Training",
  "startAt": "2025-12-01T10:00:00Z",
  "endAt": "2025-12-01T16:00:00Z",
  "location": "Online",
  "category": "Tech",
  "isPaid": true,
  "price": 500,
  "currency": "INR",
  "maxAttendees": 50
}
```

### 2. Create Payment Order
```http
POST http://localhost:5000/api/payments/create-order/EVENT_ID
Authorization: Bearer YOUR_TOKEN
```

### 3. Check Payment Status
```http
GET http://localhost:5000/api/payments/check/EVENT_ID
Authorization: Bearer YOUR_TOKEN
```

### 4. Get My Payments
```http
GET http://localhost:5000/api/payments/my-payments
Authorization: Bearer YOUR_TOKEN
```

---

## Troubleshooting

### Issue: "Payment gateway not configured"
**Solution**: Make sure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in `.env`

### Issue: "Invalid payment signature"
**Solution**: 
- Check that `RAZORPAY_KEY_SECRET` is correct
- Ensure you're using the same key for order creation and verification

### Issue: Form validation not showing
**Solution**: 
- Clear browser cache
- Check browser console for errors
- Verify React is running on port 3000

### Issue: Cannot register for event
**Solution**:
- Check if event date is in the past
- Verify you're not already registered
- For paid events, check if payment is completed

---

## Database Verification

Check if payment records are being created:

```javascript
// In MongoDB shell or Compass
use eventdb

// View all payments
db.payments.find().pretty()

// View payments for specific event
db.payments.find({ eventId: ObjectId("EVENT_ID") }).pretty()

// Check event with payment fields
db.events.find({ isPaid: true }).pretty()
```

---

## Security Checklist

- [ ] Never commit `.env` file to Git
- [ ] Use Test keys for development
- [ ] Use Live keys only in production
- [ ] Verify payment signatures on backend
- [ ] Validate all inputs on both frontend and backend
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins

---

## Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Configure Razorpay credentials
3. ✅ Test form validation
4. ✅ Test past event prevention
5. ⏳ Implement frontend payment UI
6. ⏳ Test complete payment flow
7. ⏳ Deploy to production

---

## Support

If you encounter any issues:
1. Check the console logs (both frontend and backend)
2. Verify all environment variables are set
3. Ensure MongoDB is running
4. Check Razorpay dashboard for payment logs

---

## Production Deployment

Before deploying to production:

1. **Switch to Live Keys**:
   - Generate Live API keys from Razorpay dashboard
   - Update `.env` with live keys

2. **Update URLs**:
   - Set `PUBLIC_WEB_URL` to your production domain
   - Update CORS origin in `server.js`

3. **Enable Webhooks** (Optional but recommended):
   - Set up Razorpay webhooks for payment updates
   - Handle `payment.captured`, `payment.failed` events

4. **Security**:
   - Use environment variables (never hardcode keys)
   - Enable HTTPS
   - Set up proper rate limiting
   - Monitor payment logs

5. **Testing**:
   - Test with small amounts first
   - Verify payment reconciliation
   - Test refund flow if needed

---

Happy coding! 🚀
