# 📦 Installation Guide - New Features

## Prerequisites
- Node.js (v14 or higher)
- MongoDB running
- Existing project setup

---

## 🚀 Quick Setup

### 1. Install New Backend Dependencies

```bash
cd backend
npm install qrcode
```

That's it! The QR code library is the only new dependency needed.

---

## 2. Restart Servers

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm start
```

---

## 3. Test New Features

### ✅ Test Advanced Search
1. Login as user or admin
2. Click "Search Events" button
3. Try searching for "Tech"
4. Click "Filters" and apply multiple filters
5. Verify results update automatically

### ✅ Test QR Ticket Generation
1. Login as user
2. Register for any event (free or paid)
3. Click "Get Ticket (QR Code)" button
4. Verify ticket displays with QR code
5. Test Download, Print, and Share buttons

---

## 4. Verify All Routes

### New API Endpoints
- `GET /api/events/search` - Advanced search
- `GET /api/tickets/generate/:eventId` - Generate QR ticket
- `POST /api/tickets/verify` - Verify ticket

### New Frontend Routes
- `/search` - Search page
- `/ticket/:eventId` - Ticket page

---

## 5. Environment Variables

No new environment variables needed! Uses existing:
- `JWT_SECRET` - For authentication
- `MONGO_URI` - For database
- `PORT` - For server

---

## 🧪 Testing Checklist

### Search Feature
- [ ] Text search works
- [ ] Category filter works
- [ ] Price range filter works
- [ ] Date range filter works
- [ ] Free/Paid filter works
- [ ] Location search works
- [ ] Auto-search (debouncing) works
- [ ] Results display correctly
- [ ] Empty state shows when no results
- [ ] Loading spinner appears

### QR Ticket Feature
- [ ] Ticket generates for registered users
- [ ] QR code displays correctly
- [ ] Download button works
- [ ] Print button works
- [ ] Share button works
- [ ] Ticket shows all event details
- [ ] Error shows for non-registered users
- [ ] Back button works

### Fixed Features
- [ ] Payment checkbox visible in all create forms
- [ ] Edit button works in category pages
- [ ] Password requires special character
- [ ] Reset code not visible in frontend

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'qrcode'"
**Solution:** Run `npm install qrcode` in backend folder

### Issue: Search returns no results
**Solution:** 
1. Check MongoDB is running
2. Verify events exist in database
3. Check browser console for errors

### Issue: QR code not generating
**Solution:**
1. Verify user is registered for event
2. Check backend console for errors
3. Verify JWT token is valid

### Issue: Ticket page shows error
**Solution:**
1. Make sure you're logged in as user (not admin)
2. Verify you're registered for the event
3. Check event ID in URL is valid

---

## 📱 Browser Compatibility

### Tested On:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Mobile:
- ✅ iOS Safari
- ✅ Chrome Android

---

## 🔒 Security Notes

1. **QR Code Data:** Contains event and user info (not sensitive)
2. **Ticket Verification:** Requires authentication
3. **Search:** Protected by JWT authentication
4. **Password:** Now requires special character

---

## 📊 Performance Tips

1. **Search Debouncing:** 500ms delay prevents excessive API calls
2. **MongoDB Indexing:** Consider adding indexes on:
   - `title` (text index)
   - `category`
   - `startAt`
   - `price`

```javascript
// Add in MongoDB shell or model
db.events.createIndex({ title: "text", description: "text" })
db.events.createIndex({ category: 1 })
db.events.createIndex({ startAt: 1 })
db.events.createIndex({ price: 1 })
```

---

## 🎯 Next Steps

1. ✅ Features installed and tested
2. 📝 Read `NEW_FEATURES_IMPLEMENTED.md` for details
3. 🎬 Practice demo for jury
4. 🚀 Deploy to production (optional)

---

## 💡 Quick Demo Commands

### Demo Search:
```
1. Go to /search
2. Type "Tech" → See results
3. Click Filters → Select Category=Tech, Price=Free
4. See filtered results
```

### Demo QR Ticket:
```
1. Go to /dashboard
2. Find registered event
3. Click "Get Ticket (QR Code)"
4. Click Download → Saves PNG
5. Click Print → Opens print dialog
```

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check backend terminal for errors
3. Verify MongoDB is running
4. Verify all dependencies installed
5. Clear browser cache and restart

---

## ✨ You're All Set!

Your Event Management System now has:
- ✅ Advanced Search & Filtering
- ✅ QR Code Ticket Generation
- ✅ All bug fixes applied

**Ready to impress your jury! 🎉**
