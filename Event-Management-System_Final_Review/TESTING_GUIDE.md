# Testing Guide - Event Management System

## 🎉 All Features Implemented!

**Status**: ✅ Backend Complete | ✅ Frontend Complete | Ready for Testing

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
```
Backend should run on: http://localhost:5000

### 2. Start Frontend
```bash
cd frontend
npm start
```
Frontend should run on: http://localhost:3000

---

## 🧪 Testing Checklist

### ✅ Test 1: Form Validation (Signup)

**Steps**:
1. Go to http://localhost:3000/signup
2. Try these invalid inputs:

| Field | Invalid Input | Expected Error |
|-------|--------------|----------------|
| Name | "123" | "Name can only contain letters and spaces" |
| Name | "A" | "Name must be at least 2 characters" |
| Email | "notanemail" | "Please enter a valid email address" |
| Password | "weak" | "Password must contain at least one uppercase letter" |
| Password | "WEAK" | "Password must contain at least one lowercase letter" |
| Password | "Weak" | "Password must contain at least one number" |
| Role | (not selected) | "Role is required" |

3. ✅ **Expected**: Error messages appear below each field with red borders

**Valid Test**:
- Name: "John Doe"
- Email: "john@example.com"
- Password: "Test123"
- Role: "user"
- ✅ **Expected**: Account created successfully

---

### ✅ Test 2: Form Validation (Login)

**Steps**:
1. Go to http://localhost:3000/login
2. Try invalid inputs (similar to signup)
3. ✅ **Expected**: Validation errors appear

---

### ✅ Test 3: Past Date Event Creation Prevention

**Steps**:
1. Login as **admin**
2. Go to Admin Dashboard → Create Event
3. Fill in event details
4. Select **yesterday's date** for "Start date & time"
5. Click "Create Event"

✅ **Expected**: Alert shows "Cannot create events with past dates. Please select a future date and time."

**Valid Test**:
- Select tomorrow's date
- ✅ **Expected**: Event created successfully

---

### ✅ Test 4: Past Date Event Registration Prevention

**Steps**:
1. Create an event with past date (via database or temporarily disable validation)
2. Login as **user**
3. Go to Dashboard
4. Find the past event

✅ **Expected**: 
- Button shows "Event Ended" (red, disabled)
- Cannot click to register

---

### ✅ Test 5: Create Free Event

**Steps**:
1. Login as **admin**
2. Go to Admin Dashboard → Create Event
3. Fill in event details:
   - Title: "Free Workshop"
   - Description: "Open to all"
   - Start date: Tomorrow
   - **Do NOT check** "This is a paid event"
4. Click "Create Event"

✅ **Expected**: Event created as free event

---

### ✅ Test 6: Create Paid Event

**Steps**:
1. Login as **admin**
2. Go to Admin Dashboard → Create Event
3. Fill in event details:
   - Title: "Premium Workshop"
   - Description: "Advanced training"
   - Start date: Tomorrow
   - **Check** "This is a paid event" ✅
   - Price: 500
   - Currency: INR
   - Max Attendees: 50 (optional)
4. Click "Create Event"

✅ **Expected**: 
- Event created successfully
- Payment fields saved

---

### ✅ Test 7: Register for Free Event

**Steps**:
1. Login as **user**
2. Go to Dashboard
3. Find a free event
4. Click "Register Now (Free)" button

✅ **Expected**:
- Alert: "Registered successfully!"
- Button changes to "Registered" (gray, disabled)
- User added to event

---

### ✅ Test 8: Register for Paid Event (GPay)

**Steps**:
1. Login as **user**
2. Go to Dashboard
3. Find a paid event
4. ✅ **Check**: Event shows price badge (e.g., "₹500")
5. Click "Pay ₹500 & Register" button (orange)
6. Payment page opens
7. Fill in contact information:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "9876543210"
   - Address: "123 Main St, City"
8. Payment Method: Select "Google Pay (GPay)"
9. Transaction ID: "GPY123456789"
10. Click "Complete Payment"

✅ **Expected**:
- Success message appears
- Redirected to Dashboard
- User is now registered for the event
- Button shows "Registered"

---

### ✅ Test 9: Register for Paid Event (Cash on Registration)

**Steps**:
1. Login as **user**
2. Find a paid event
3. Click "Pay ₹500 & Register"
4. Fill in contact information
5. Payment Method: Select "Cash on Registration"
6. ✅ **Note**: No transaction ID field appears
7. Click "Complete Payment"

✅ **Expected**:
- Success message appears
- User registered
- Payment status: "pending" (will be completed at event)

---

### ✅ Test 10: View Payment History

**API Test** (use Postman/Thunder Client):
```http
GET http://localhost:5000/api/payments/my-payments
Authorization: Bearer YOUR_USER_TOKEN
```

✅ **Expected Response**:
```json
[
  {
    "_id": "...",
    "eventId": {
      "title": "Premium Workshop",
      "startAt": "2025-12-01T10:00:00Z"
    },
    "amount": 500,
    "currency": "INR",
    "paymentMethod": "GPay",
    "paymentStatus": "completed",
    "transactionId": "GPY123456789",
    "contactInfo": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    "paymentDate": "2025-10-22T10:30:00Z"
  }
]
```

---

### ✅ Test 11: Admin View Event Payments

**API Test**:
```http
GET http://localhost:5000/api/payments/event/EVENT_ID
Authorization: Bearer YOUR_ADMIN_TOKEN
```

✅ **Expected Response**:
```json
{
  "payments": [...],
  "stats": {
    "total": 10,
    "completed": 8,
    "pending": 2,
    "failed": 0,
    "totalRevenue": 4000
  }
}
```

---

### ✅ Test 12: Event Full (Max Attendees)

**Steps**:
1. Create paid event with Max Attendees: 2
2. Register 2 users
3. Try to register 3rd user

✅ **Expected**: Error "Event is full"

---

### ✅ Test 13: Duplicate Payment Prevention

**Steps**:
1. Register for paid event
2. Try to register again for same event

✅ **Expected**: Error "Payment already completed for this event"

---

## 🎯 Key Features to Verify

### Form Validation
- ✅ Frontend validation (real-time errors)
- ✅ Backend validation (API errors)
- ✅ Password strength requirements
- ✅ Email format validation

### Past Date Prevention
- ✅ Cannot create events with past dates
- ✅ Cannot register for past events
- ✅ UI shows "Event Ended" for past events

### Payment System
- ✅ Free events work without payment
- ✅ Paid events show price badge
- ✅ Payment page with contact form
- ✅ Multiple payment methods (GPay, PhonePe, Paytm, Cash)
- ✅ Transaction ID required for digital payments
- ✅ Cash on Registration (no transaction ID)
- ✅ Payment status tracking
- ✅ Duplicate payment prevention
- ✅ Event full validation

---

## 📊 Database Verification

### Check Events Collection
```javascript
// In MongoDB Compass or shell
db.events.find({ isPaid: true }).pretty()
```

Should show:
```json
{
  "title": "Premium Workshop",
  "isPaid": true,
  "price": 500,
  "currency": "INR",
  "maxAttendees": 50,
  "registeredUsers": [...]
}
```

### Check Payments Collection
```javascript
db.payments.find().pretty()
```

Should show:
```json
{
  "eventId": ObjectId("..."),
  "userId": ObjectId("..."),
  "amount": 500,
  "currency": "INR",
  "paymentMethod": "GPay",
  "paymentStatus": "completed",
  "transactionId": "GPY123456789",
  "contactInfo": {...},
  "paymentDate": ISODate("...")
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot create events with past dates" even for future dates
**Solution**: Check your system time. Ensure it's correct.

### Issue 2: Payment page not opening
**Solution**: 
- Check browser console for errors
- Verify PaymentPage.js is imported in App.js
- Check route is added correctly

### Issue 3: "Payment gateway not configured"
**Solution**: This error is from old Razorpay code. We've removed it. If you see this, restart backend.

### Issue 4: Form validation not showing
**Solution**:
- Clear browser cache
- Check browser console for errors
- Verify Signup.js and Login.js have validation code

### Issue 5: Events not showing price
**Solution**:
- Check event was created with isPaid=true
- Verify Dashboard.js has price badge code
- Refresh page

---

## ✅ Final Checklist

Before marking as complete, verify:

- [ ] Backend running without errors
- [ ] Frontend running without errors
- [ ] Can create user account with validation
- [ ] Can login with validation
- [ ] Cannot create past date events
- [ ] Cannot register for past events
- [ ] Can create free events
- [ ] Can create paid events with price
- [ ] Free events show "Register Now (Free)"
- [ ] Paid events show price badge
- [ ] Paid events show "Pay ₹X & Register"
- [ ] Payment page opens correctly
- [ ] Can complete payment with GPay/PhonePe/Paytm
- [ ] Can select Cash on Registration
- [ ] Payment creates record in database
- [ ] User gets registered after payment
- [ ] Cannot pay twice for same event
- [ ] Event full validation works

---

## 🎉 Success Criteria

**All features working if**:
1. ✅ Form validation shows errors for invalid inputs
2. ✅ Past date events cannot be created or registered
3. ✅ Free events work normally
4. ✅ Paid events require payment
5. ✅ Payment page collects info and processes payment
6. ✅ Users get registered after successful payment
7. ✅ Payment records stored in database

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Test 1 - Signup Validation: ☐ Pass ☐ Fail
Test 2 - Login Validation: ☐ Pass ☐ Fail
Test 3 - Past Date Creation: ☐ Pass ☐ Fail
Test 4 - Past Date Registration: ☐ Pass ☐ Fail
Test 5 - Create Free Event: ☐ Pass ☐ Fail
Test 6 - Create Paid Event: ☐ Pass ☐ Fail
Test 7 - Register Free Event: ☐ Pass ☐ Fail
Test 8 - Pay with GPay: ☐ Pass ☐ Fail
Test 9 - Cash on Registration: ☐ Pass ☐ Fail
Test 10 - View Payments: ☐ Pass ☐ Fail

Overall Status: ☐ All Pass ☐ Some Fail

Notes:
_________________________________
_________________________________
```

---

## 🚀 Ready to Test!

Everything is implemented. Start testing now! 🎉

If you find any issues, check:
1. Console logs (browser & terminal)
2. Network tab (browser DevTools)
3. Database records (MongoDB Compass)

Good luck! 🍀
