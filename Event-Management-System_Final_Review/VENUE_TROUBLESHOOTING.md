# 🔧 Venue Selection Troubleshooting Guide

## Issue: Venues Not Showing in Event Creation Dropdown

If you've created venues but they're not appearing in the event creation form, follow these steps:

---

## ✅ Step-by-Step Debugging

### 1. **Check Backend Server is Running**
```bash
cd backend
npm run dev
```
- Server should be running on `http://localhost:5000`
- Check terminal for any errors

### 2. **Check Frontend Server is Running**
```bash
cd frontend
npm start
```
- Frontend should be running on `http://localhost:3000`
- Check terminal for any errors

### 3. **Verify Venues Were Created**

#### Option A: Check in Venue Management Page
```
1. Login as admin
2. Go to Admin Dashboard
3. Click "Venue Management"
4. You should see your created venues
```

#### Option B: Check Database Directly
```bash
# Open MongoDB shell or MongoDB Compass
# Check 'venues' collection
# Should have documents with name, location, capacity
```

#### Option C: Test API Directly
```bash
# In browser or Postman
GET http://localhost:5000/api/venues
# Headers: Authorization: Bearer YOUR_JWT_TOKEN

# Should return array of venues
```

### 4. **Check Browser Console**

Open browser console (F12) and look for:
```
Fetching venues...
Venues fetched: [array of venues]
```

If you see:
- **Empty array `[]`**: Venues not in database
- **Error message**: API issue
- **Nothing**: Fetch not happening

### 5. **Check Network Tab**

1. Open DevTools (F12)
2. Go to Network tab
3. Reload Admin Dashboard
4. Look for request to `/api/venues`
5. Check:
   - **Status**: Should be 200
   - **Response**: Should have venues array
   - **Headers**: Should have Authorization token

---

## 🐛 Common Issues & Fixes

### Issue 1: "No venues available" message shows
**Cause**: Venues array is empty

**Fix:**
```
1. Go to Venue Management page
2. Create at least one venue
3. Go back to event creation
4. Refresh page
5. Venues should now appear
```

### Issue 2: Console shows "Fetching venues..." but no data
**Cause**: API endpoint not responding

**Fix:**
```
1. Check backend terminal for errors
2. Verify route is registered in server.js:
   app.use("/api/venues", venueRoutes);
3. Restart backend server
```

### Issue 3: Console shows 401 Unauthorized
**Cause**: JWT token expired or invalid

**Fix:**
```
1. Logout
2. Login again as admin
3. Try creating event again
```

### Issue 4: Console shows 404 Not Found
**Cause**: Route not registered

**Fix:**
```
1. Check backend/src/server.js has:
   const venueRoutes = require("./routes/venueRoutes");
   app.use("/api/venues", venueRoutes);
2. Restart backend server
```

### Issue 5: Venues show in management but not in dropdown
**Cause**: State not updating or fetch not happening

**Fix:**
```
1. Hard refresh browser (Ctrl + Shift + R)
2. Clear browser cache
3. Check console for errors
4. Verify fetchVenues() is called in useEffect
```

---

## 🧪 Manual Testing Steps

### Test 1: Create and Verify Venue
```
1. Login as admin
2. Admin Dashboard → Venue Management
3. Click "Add Venue"
4. Fill:
   - Name: "Test Hall"
   - Location: "Building A"
   - Capacity: 100
5. Click "Create Venue"
6. Verify venue appears in list
7. Open browser console
8. Check for: "Venues fetched: [{...}]"
```

### Test 2: Check Venue in Event Creation
```
1. Go to Admin Dashboard
2. Click any category (e.g., "Tech")
3. Scroll to event creation form
4. Look at "Select Venue" dropdown
5. Should see: "Test Hall - Building A (Capacity: 100)"
6. If not visible:
   - Check console for errors
   - Check Network tab for /api/venues request
   - Verify response has venues
```

### Test 3: API Test with Curl
```bash
# Get your JWT token from browser localStorage
# Then test:

curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:5000/api/venues

# Should return:
[
  {
    "_id": "...",
    "name": "Test Hall",
    "location": "Building A",
    "capacity": 100,
    ...
  }
]
```

---

## 📊 Debug Checklist

Use this checklist to debug:

- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000)
- [ ] MongoDB connected
- [ ] Logged in as admin
- [ ] At least one venue created
- [ ] Venue appears in Venue Management page
- [ ] Browser console shows "Fetching venues..."
- [ ] Browser console shows "Venues fetched: [...]"
- [ ] Network tab shows 200 response for /api/venues
- [ ] Dropdown shows venue count: "(X available)"
- [ ] Dropdown has venue options

---

## 🔍 What to Look For

### In Browser Console:
```javascript
// Good:
Fetching venues...
Venues fetched: [{_id: "...", name: "Grand Hall", ...}]

// Bad:
Fetching venues...
Venues fetched: []
// OR
Error fetching venues: ...
```

### In Network Tab:
```
Request URL: http://localhost:5000/api/venues
Status: 200 OK
Response: [
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Grand Hall",
    "location": "Building A, Floor 2",
    "capacity": 500,
    ...
  }
]
```

### In Dropdown:
```html
<select>
  <option value="">No Venue (Manual Location)</option>
  <option value="507f...">Grand Hall - Building A, Floor 2 (Capacity: 500)</option>
  <!-- More venues... -->
</select>
```

---

## 🚀 Quick Fix Commands

### Restart Everything:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start

# Browser
# Hard refresh: Ctrl + Shift + R (Windows/Linux) or Cmd + Shift + R (Mac)
```

### Check MongoDB:
```bash
# If using MongoDB Compass:
# Connect to mongodb://localhost:27017
# Check database: event-management
# Check collection: venues
# Should have documents
```

### Clear Browser Data:
```
1. Open DevTools (F12)
2. Application tab
3. Clear Storage → Clear site data
4. Refresh page
5. Login again
```

---

## 💡 Expected Behavior

### When Working Correctly:

1. **Venue Management Page:**
   - Shows all created venues
   - Can create, edit, delete venues

2. **Event Creation Form:**
   - Shows "Select Venue (X available)" label
   - Dropdown has all venues listed
   - Format: "Name - Location (Capacity: X)"
   - Can select venue or choose "No Venue"

3. **Console Output:**
   ```
   Fetching venues...
   Venues fetched: [Array(3)]
   ```

4. **Network Tab:**
   - GET /api/venues → 200 OK
   - Response has array of venues

---

## 📞 Still Not Working?

If venues still don't show after all these steps:

1. **Check this file exists:**
   - `backend/src/routes/venueRoutes.js`

2. **Check server.js has:**
   ```javascript
   const venueRoutes = require("./routes/venueRoutes");
   app.use("/api/venues", venueRoutes);
   ```

3. **Check AdminDashboard.js has:**
   ```javascript
   const [venues, setVenues] = useState([]);
   
   const fetchVenues = async () => {
     // ... fetch code
   };
   
   useEffect(() => {
     fetchEvents();
     fetchVenues();
   }, [token]);
   ```

4. **Restart both servers** and **hard refresh browser**

5. **Check browser console** for any error messages

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Venue Management page shows your venues
- ✅ Console shows "Venues fetched: [...]" with data
- ✅ Event creation dropdown shows "(X available)"
- ✅ Dropdown lists all your venues
- ✅ Can select a venue and create event
- ✅ Max attendees field shows venue capacity as placeholder

---

## 🎯 Next Steps After Fix

Once venues are showing:
1. Create an event with a venue
2. Verify max attendees is limited by venue capacity
3. Try creating event without venue (manual location)
4. Test editing venue and see if event form updates

**Good luck! 🚀**
