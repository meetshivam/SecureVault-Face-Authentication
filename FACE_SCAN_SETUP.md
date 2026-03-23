# Face Scan Login - Quick Setup & Testing Guide

## Quick Start (5 minutes)

### 1. Verify Backend is Running
```bash
cd backend
python app.py
# Should see: "Running on http://127.0.0.1:5000"
```

### 2. Build & Start Frontend
```bash
cd frontend
npm run build
npm run dev
# Navigate to http://localhost:5173
```

### 3. Test Registration (Create account with face)
1. Go to `http://localhost:5173/register`
2. Fill in: Email, Password, Name
3. Click "Continue"
4. Allow camera permission
5. Click "Capture Face"
6. Position your face in frame, click capture (3 times for full enrollment)
7. Should see success message

### 4. Test Face Login
1. Go to `http://localhost:5173/login`
2. Enter email and password from registration
3. Click "Proceed with Face Scan"
4. Modal opens with webcam
5. Position face in frame
6. Click "Capture & Verify"
7. **Success:** Redirects to dashboard
8. **Failure:** Shows error, can retry

---

## New Components Added

### Frontend Files Created:

```
frontend/src/
├── components/
│   ├── FaceScanLogin.jsx ............................ Main login form component
│   ├── FaceScanModal.jsx ............................ Webcam + face detection modal
│   └── FaceScanModal.css ............................ Modal styling & animations
├── hooks/
│   └── useFaceDetection.js .......................... Webcam management hook
└── utils/
    └── faceAuthErrors.js ........................... Error handling utilities
```

### Pages Modified:
- `pages/LoginPage.jsx` - Now uses FaceScanLogin component

### API Methods (Already in utils/api.js):
- `api.loginEmail()` - POST /auth/login-email
- `api.loginFace()` - POST /auth/login-face

---

## Component Hierarchy

```
LoginPage.jsx
└── FaceScanLogin.jsx (Main Component)
    ├── FaceScanModal.jsx (Webcam Modal)
    │   └── useFaceDetection() Hook
    ├── GlassCard.jsx (UI Container)
    ├── useAuth() Context (Auth Management)
    └── api.loginEmail() & api.loginFace() (API Calls)
```

---

## How It Works

### Step 1: Email & Password Validation
```javascript
User enters email + password
         ↓
Frontend validates format
         ↓
POST /auth/login-email
         ↓
Backend verifies credentials
         ↓
Response: { success: true } or error
```

### Step 2: Face Scan Modal
```javascript
Modal opens with webcam
         ↓
useFaceDetection hook initializes camera
         ↓
User positions face in frame
         ↓
User clicks "Capture & Verify"
         ↓
captureFrame() converts video to base64
```

### Step 3: Face Verification
```javascript
Frontend sends to POST /auth/login-face
         ↓
Backend extracts face encoding from image
         ↓
Compares with stored encoding from signup
         ↓
Calculates face_distance (< 0.5 = match)
         ↓
Response: 
  - Success: { success: true, token, user_data }
  - Failure: { success: false, error, confidence }
```

### Step 4: Authentication
```javascript
On success:
  - Store JWT token in localStorage
  - Store user data in localStorage
  - AuthContext.login() called
  - Redirect to /dashboard

On failure:
  - Display error message
  - Show match confidence
  - Allow retry or restart
```

---

## Error Handling

### Automatic Error Recovery

| Error | Auto-Recovery | User Action |
|-------|---|---|
| Face timeout (30s) | Reset after 2s | Retry scan |
| Face not detected | Show error, reset | Reposition face |
| Face not recognized | Show confidence | Try again or use email |
| Camera denied | Show permission message | Allow in browser settings |
| Network error | Show retry option | Check internet |

### Error Messages Displayed

- **Email errors:** "Invalid email format", "User not found"
- **Password errors:** "Password too short", "Password incorrect"
- **Camera errors:** "Camera access denied", "Camera in use", "No camera found"
- **Face errors:** "No face detected", "Face does not match", "Face scan timed out"
- **Network errors:** "Network error", "Server error"

---

## Debugging

### View Logs in Browser Console
```javascript
// Example logs you'll see:
[FaceScanLogin] Credentials error: {...}
[useFaceDetection] Error: Camera access denied...
[FaceScanModal] Capture error: {...}
```

### View Backend Logs
```
[FACE AUTH] email=user@example.com distance=0.42 confidence=87.50
```

### Test a Specific Feature

**Test webcam without login:**
```javascript
// In browser console:
import { useFaceDetection } from '../hooks/useFaceDetection';
// Manually test hook
```

**Test email validation:**
```javascript
// In browser console:
import { isValidEmail } from '../utils/faceAuthErrors';
isValidEmail('test@example.com'); // true
isValidEmail('invalid-email'); // false
```

**Test API endpoint:**
```bash
# In terminal:
curl -X POST http://localhost:5000/auth/login-email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## Features & Capabilities

### ✅ Implemented
- [x] Email + password validation
- [x] Real-time webcam feed
- [x] Face detection frame visualization
- [x] 30-second timeout with visual timer
- [x] Status messages (idle, loading, success, error)
- [x] Retry mechanism
- [x] Error recovery
- [x] JWT token management
- [x] Mobile responsive design
- [x] Accessibility (ARIA labels, keyboard support)
- [x] Error utilities and logging
- [x] Comprehensive documentation

### 🔄 Can Be Extended
- [ ] Liveness detection (anti-spoofing)
- [ ] Multi-angle face verification
- [ ] Device fingerprinting
- [ ] Rate limiting
- [ ] SMS/Email OTP verification
- [ ] Biometric re-enrollment
- [ ] Face quality assessment

---

## Performance

- **Webcam startup:** ~1-2 seconds
- **Face detection:** ~500ms per frame
- **Face capture & upload:** ~1-2 seconds
- **Backend verification:** ~500ms - 2 seconds
- **Modal animations:** 300ms (spring physics)
- **Total login time:** 3-5 seconds (from credentials to dashboard)

---

## Security

- ✅ HTTPS recommended for production
- ✅ JWT tokens expire in 30 minutes
- ✅ Passwords hashed with SHA256
- ✅ Face encodings stored as pickle (not image)
- ✅ Base64 image transmission over HTTPS
- ✅ Audit logging of all attempts
- ✅ CORS enabled for specific origins
- ✅ Bearer token required for API calls

---

## Testing Scenarios

### Scenario 1: Successful Login
```
1. Register with email, password, face
2. Go to login
3. Enter valid credentials
4. Verify with same face
5. ✅ Redirects to dashboard
```

### Scenario 2: Wrong Face
```
1. Register with your face
2. Go to login
3. Enter valid credentials
4. Have different person capture face
5. ❌ Shows "Face does not match"
6. Can retry with correct face
```

### Scenario 3: No Permissions
```
1. Go to login
2. Block camera permission
3. Modal opens but camera fails
4. ❌ Shows "Camera access denied"
5. User must allow in settings
```

### Scenario 4: Timeout
```
1. Go to login
2. Valid credentials
3. Modal opens but don't click capture
4. After 30 seconds
5. ❌ Shows "Timeout"
6. Can retry immediately
```

### Scenario 5: Invalid Credentials
```
1. Go to login
2. Wrong email/password
3. ❌ Shows "User not found" or "Invalid password"
4. Can try again
```

---

## File Locations

| Component | Location |
|-----------|----------|
| Main Login | `pages/LoginPage.jsx` |
| Login Form | `components/FaceScanLogin.jsx` |
| Face Modal | `components/FaceScanModal.jsx` |
| Modal CSS | `components/FaceScanModal.css` |
| Webcam Hook | `hooks/useFaceDetection.js` |
| Error Utils | `utils/faceAuthErrors.js` |
| API Client | `utils/api.js` |
| Auth Context | `context/AuthContext.jsx` |
| Backend | `backend/app.py` |

---

## Common Issues & Solutions

### Issue: Modal doesn't appear
**Solution:** Check browser console for errors, ensure FaceScanModal is imported correctly

### Issue: Webcam shows but no face detection frame
**Solution:** Check if modal CSS is loaded, verify useFaceDetection hook returned isReady=true

### Issue: Face verification always fails
**Solution:** Ensure good lighting, face is clear, similar angle to registration, try adjusting FACE_DISTANCE_THRESHOLD

### Issue: Token not persisting
**Solution:** Check localStorage is enabled, ensure AuthContext.login() was called

### Issue: Backend 404 error
**Solution:** Verify backend is running, check endpoint paths in api.js match backend routes

---

## Next Steps

1. **Test the complete flow** - Register, then login with face
2. **Try error scenarios** - Test with wrong face, camera denied, timeout
3. **Customize styling** - Adjust colors/fonts in FaceScanModal.css
4. **Add rate limiting** - Prevent brute force on backend
5. **Enable HTTPS** - Required for production deployment
6. **Set up monitoring** - Track login success rates and failures

---

## Support

For detailed information, see: `FACE_SCAN_LOGIN_GUIDE.md`

Quick Reference:
- Architecture overview
- Component specifications
- API endpoint documentation
- Error handling details
- Debugging tips
- Integration checklist
