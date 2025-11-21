# 🧪 Testing Venue Conflict Detection

## Step-by-Step Test

### **Step 1: Check Backend Logs**

Open your backend terminal and watch for these logs:
```
=== VENUE AVAILABILITY CHECK ===
Requested startAt: ...
Requested endAt: ...
Total available venues: 1
Checking conflicts between: ...
Conflicting events found: X
Occupied venue IDs: [...]
Available venues after filtering: X
=== END VENUE AVAILABILITY CHECK ===
```

---

### **Step 2: Create First Event**

1. **Refresh browser** (Ctrl + Shift + R)
2. **Login as Admin**
3. **Go to Create Event page**
4. **Fill in details:**
   - Title: "Test Event 1"
   - Description: "Testing venue conflict"
   - Start Date: Tomorrow, 2:00 PM
   - End Date: Tomorrow, 4:00 PM
   - **Select Venue: TBI Seminar Hall**
   - Fill other required fields
5. **Click "Create Event"**
6. **Check backend logs** - Should show event created

---

### **Step 3: Create Second Event (Test Conflict)**

1. **Go to Create Event page again**
2. **Fill in details:**
   - Title: "Test Event 2"
   - Description: "Testing conflict detection"
   - **Start Date: Tomorrow, 2:00 PM** (same as Event 1)
   - **End Date: Tomorrow, 4:00 PM** (same as Event 1)
3. **Watch the venue dropdown**
4. **Check backend logs** - Should show:
   ```
   Conflicting events found: 1
   Occupied venue IDs: [TBI Hall ID]
   Available venues after filtering: 0
   ```
5. **Result: TBI Hall should NOT appear in dropdown!**

---

### **Step 4: Test Different Time (No Conflict)**

1. **Change dates to:**
   - Start: Tomorrow, 5:00 PM (different time)
   - End: Tomorrow, 7:00 PM
2. **Check backend logs** - Should show:
   ```
   Conflicting events found: 0
   Occupied venue IDs: []
   Available venues after filtering: 1
   ```
3. **Result: TBI Hall SHOULD appear!**

---

## 🔍 Debugging Checklist

If TBI Hall still appears when it shouldn't:

### **Check 1: Backend Logs**
- [ ] Do you see "=== VENUE AVAILABILITY CHECK ===" in logs?
- [ ] Does it show "Conflicting events found: 1"?
- [ ] Does it show the occupied venue ID?

### **Check 2: Event Data**
- [ ] Is the first event saved with venue reference?
- [ ] Check MongoDB: Does event have `venue` field?
- [ ] Is event status "published" (not "completed")?

### **Check 3: Frontend**
- [ ] Is frontend calling `/api/venues/available`?
- [ ] Check browser Network tab for the request
- [ ] Check response - does it include TBI Hall?

### **Check 4: Dates**
- [ ] Are dates in ISO format?
- [ ] Are timezones correct?
- [ ] Do dates actually overlap?

---

## 🐛 Common Issues

### **Issue 1: Backend not logging**
**Solution:** Backend not restarted
```bash
# Stop backend (Ctrl+C)
cd backend
npm run dev
```

### **Issue 2: Venue still appears**
**Possible causes:**
1. First event doesn't have venue saved
2. First event is "completed" status
3. Dates don't actually overlap
4. Frontend calling wrong endpoint

**Debug:**
```javascript
// In browser console
fetch('http://localhost:5000/api/venues/available?startAt=2025-10-24T14:00:00.000Z&endAt=2025-10-24T16:00:00.000Z', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
})
.then(r => r.json())
.then(d => console.log('Available venues:', d))
```

### **Issue 3: All venues disappear**
**Cause:** Query error or all venues occupied
**Check:** Backend logs for errors

---

## ✅ Expected Behavior

### **Scenario 1: Same Time**
```
Event 1: Oct 24, 2:00 PM - 4:00 PM (TBI Hall)
Event 2: Oct 24, 2:00 PM - 4:00 PM
Result: TBI Hall NOT in dropdown ✅
```

### **Scenario 2: Overlapping Start**
```
Event 1: Oct 24, 2:00 PM - 4:00 PM (TBI Hall)
Event 2: Oct 24, 3:00 PM - 5:00 PM
Result: TBI Hall NOT in dropdown ✅
```

### **Scenario 3: Overlapping End**
```
Event 1: Oct 24, 2:00 PM - 4:00 PM (TBI Hall)
Event 2: Oct 24, 1:00 PM - 3:00 PM
Result: TBI Hall NOT in dropdown ✅
```

### **Scenario 4: Spanning**
```
Event 1: Oct 24, 2:00 PM - 4:00 PM (TBI Hall)
Event 2: Oct 24, 1:00 PM - 5:00 PM
Result: TBI Hall NOT in dropdown ✅
```

### **Scenario 5: No Overlap**
```
Event 1: Oct 24, 2:00 PM - 4:00 PM (TBI Hall)
Event 2: Oct 24, 5:00 PM - 7:00 PM
Result: TBI Hall IS in dropdown ✅
```

---

## 📊 What to Check in Backend Logs

### **Good Log (Conflict Detected):**
```
=== VENUE AVAILABILITY CHECK ===
Requested startAt: 2025-10-24T14:00:00.000Z
Requested endAt: 2025-10-24T16:00:00.000Z
Total available venues: 1
Checking conflicts between: Thu Oct 24 2025 14:00:00 and Thu Oct 24 2025 16:00:00
Conflicting events found: 1
  - Event: Test Event 1 Venue: 67f8b70811928d8d322b1e83 Time: 2025-10-24T14:00:00.000Z - 2025-10-24T16:00:00.000Z Status: published
Occupied venue IDs: [ '67f8b70811928d8d322b1e83' ]
Available venues after filtering: 0
=== END VENUE AVAILABILITY CHECK ===
```

### **Bad Log (No Conflict Found):**
```
=== VENUE AVAILABILITY CHECK ===
Requested startAt: 2025-10-24T14:00:00.000Z
Requested endAt: 2025-10-24T16:00:00.000Z
Total available venues: 1
Checking conflicts between: Thu Oct 24 2025 14:00:00 and Thu Oct 24 2025 16:00:00
Conflicting events found: 0
Occupied venue IDs: []
Available venues after filtering: 1
=== END VENUE AVAILABILITY CHECK ===
```

If you see "Conflicting events found: 0" when there should be a conflict:
- First event might not have venue saved
- First event might be completed/cancelled
- Dates might not overlap

---

## 🔧 Manual Database Check

Check if event has venue:
```javascript
// In MongoDB Compass or shell
db.events.find({ venue: { $exists: true, $ne: null } })
```

Should show events with venue field populated.

---

## 📞 Next Steps

1. **Create Event 1** with venue
2. **Watch backend logs** when creating Event 2
3. **Share the logs** with me if it's not working
4. I'll help debug based on what the logs show!

---

**The logs will tell us exactly what's happening!** 🔍
