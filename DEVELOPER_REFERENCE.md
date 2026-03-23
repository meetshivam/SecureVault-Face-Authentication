# Developer Reference - SecureVault
## Code Architecture & Maintenance Guide

---

## 📦 PROJECT STRUCTURE

```
Face-Authentication-Using-Python/
├── app.py                 # Main Flask API server
├── face_data.py          # OpenCV face recognition module
├── train.py              # Face model trainer
├── trainer.yml           # Face recognition config
├── Templates/            # HTML pages
│   ├── index.html        # Landing page
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   └── dashboard.html    # Main dashboard (React-ready)
├── static/               # JavaScript & CSS
│   ├── style.css         # Global styles
│   ├── script.js         # Shared utilities
│   ├── js/main.js        # Dashboard JavaScript
│   └── css/style.css     # Additional styles
├── dataset/              # Face recognition training data
│   └── user/
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies (optional)
└── database/
    └── (MongoDB - not in repo)
```

---

## 🔧 DEPENDENCIES

### Python (app.py, face_data.py, train.py)
```
Flask==2.3.2              # Web framework
Flask-CORS==4.0.0         # Cross-Origin requests
pymongo==4.4.1            # MongoDB driver
bcrypt==4.0.1             # Password hashing
cryptography==41.0.0      # Fernet encryption
PyPDF2==3.0.1             # PDF handling
Pillow==10.0.0            # Image processing
opencv-python==4.8.1      # Face recognition
opencv-contrib-python     # OpenCV extras
numpy==1.24.3             # Numerical computing
PyJWT==2.8.0              # JWT token generation
PyMuPDF==1.23.0           # PDF manipulation
```

### Install all:
```bash
pip install -r requirements.txt
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### 1. **Authentication Flow**
```
User → Login (email) 
  → Face Recognition (webcam)
  → Verify in MongoDB
  → Generate JWT Token
  → Store in localStorage
  → Access Dashboard
```

### 2. **Data Flow**
```
User Input (HTML Form)
  → JavaScript Validation
  → API Call (fetch)
  → Flask Route Handler
  → MongoDB CRUD
  → Response (JSON)
  → JavaScript Update DOM
  → User Feedback
```

### 3. **Security Layers**
```
Browser (localStorage)
  ↓ JWT Token
  ↓ HTTPS (if deployed)
API Server (Flask)
  ↓ @require_auth decorator
  ↓ Token Verification
  ↓ User Authorization
Database (MongoDB)
  ↓ Password Hashing (bcrypt)
  ↓ Data Encryption (Fernet)
```

---

## 🔐 ENCRYPTION SYSTEM

### Password Vault Encryption
```python
from cryptography.fernet import Fernet

# Generate key
cipher_suite = Fernet(encryption_key)
encrypted_password = cipher_suite.encrypt(plain_password.encode())
base64_encoded = base64.b64encode(encrypted_password).decode('utf-8')

# Store in MongoDB
vault_entry = {
    "password": base64_encoded,
    "encryption_key": encryption_key  # base64-encoded
}

# Retrieve and decrypt
cipher_suite = Fernet(encryption_key)
decrypted = cipher_suite.decrypt(base64.b64decode(password))
plain_password = decrypted.decode('utf-8')
```

### PDF Vault Encryption
```python
# Same Fernet encryption for PDFs
encrypted_pdf = cipher_suite.encrypt(pdf_bytes)

# Store in MongoDB binary field
db.pdf_vault.insert_one({
    "pdf_data": Binary(encrypted_pdf),
    "encryption_key": encryption_key,
    "filename": "document.pdf"
})
```

---

## 📡 API ENDPOINTS

### Authentication Endpoints
```
POST   /api/login              - Start face authentication
GET    /get_status             - Check auth status & get JWT token
POST   /api/user/logout        - Logout user & clear session
POST   /api/register           - Register new user
POST   /api/verify-email       - Verify OTP
```

### Profile Endpoints
```
GET    /api/user/profile       - Get user profile
POST   /api/user/update-profile - Update profile
POST   /api/user/change-password - Change password
```

### Password Vault Endpoints
```
POST   /api/vault/add-password      - Add encrypted password
GET    /api/vault/passwords         - List passwords
PUT    /api/vault/update-password/<id> - Update password
DELETE /api/vault/delete-password/<id> - Delete password
GET    /api/vault/password-count    - Count passwords
```

### PDF Vault Endpoints
```
POST   /vault/upload              - Upload & encrypt PDF
GET    /vault/list                - List PDFs
POST   /vault/access/<pdf_id>     - Access PDF with auth
DELETE /vault/delete/<pdf_id>     - Delete PDF
POST   /vault/verify-face         - Verify face for PDF
```

---

## 🗄️ DATABASE SCHEMA

### MongoDB Collections

#### users_auth
```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",
  "password": "bcrypt_hash",
  "name": "User Name",
  "verified": true,
  "created_at": ISODate,
  "label_id": "face_model_id",
  "otp": "123456",
  "otp_expires": ISODate
}
```

#### vaults (Password Vault)
```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "type": "password",
  "site": "github.com",
  "url": "https://github.com",
  "username": "user",
  "password": "base64_encrypted_password",
  "encryption_key": "base64_fernet_key",
  "notes": "My GitHub account",
  "created_at": ISODate,
  "updated_at": ISODate
}
```

#### pdf_vault
```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "filename": "document.pdf",
  "original_name": "Document.pdf",
  "pdf_data": BinData,
  "encryption_key": "base64_fernet_key",
  "auth_type": "face|password|both",
  "password_hash": "bcrypt_hash_or_null",
  "file_size": 102400,
  "upload_date": ISODate,
  "is_locked": true
}
```

#### vault_access_log
```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "action": "login|pdf_upload|password_add|logout",
  "details": "Additional info",
  "timestamp": ISODate
}
```

---

## 🎨 FRONTEND ARCHITECTURE

### HTML Structure (dashboard.html)
```html
<div id="app">
  <nav>Dashboard Navigation</nav>
  <sidebar>
    <button>Tab 1</button>
    <button>Tab 2</button>
  </sidebar>
  <main>
    <section id="tab1">Content</section>
    <section id="tab2">Content</section>
  </main>
</div>

<!-- Modals -->
<div id="profileModal" class="modal">...</div>
<div id="settingsModal" class="modal">...</div>
<div id="addPasswordModal" class="modal">...</div>
<div id="faceAuthModal" class="modal">...</div>
```

### JavaScript Patterns

#### Token Management
```javascript
function getAuthToken() {
    return localStorage.getItem('authToken');
}

function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

function clearAuthToken() {
    localStorage.removeItem('authToken');
}

// API calls
function fetchAPI(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
    };
    return fetch(endpoint, { ...options, headers });
}
```

#### Modal Management
```javascript
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    document.getElementById(modalId).classList.add('flex');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.getElementById(modalId).classList.remove('flex');
}

// Close on Esc key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal('profileModal');
        closeModal('settingsModal');
    }
});
```

#### Form Submission
```javascript
async function handleFormSubmit(formId, endpoint, method = 'POST') {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetchAPI(endpoint, {
            method,
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (response.ok) {
            showSuccess(result.message);
        } else {
            showError(result.error);
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Test all scenarios in TESTING_GUIDE.md
- [ ] Verify MongoDB connection string in app.py
- [ ] Update CORS settings for production domain
- [ ] Set Flask DEBUG=False for production
- [ ] Use environment variables for secrets (not hardcoded)
- [ ] Set strong JWT secret key
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS for frontend domain

### Production Configuration
```python
# app.py
import os
from dotenv import load_dotenv

load_dotenv()

app.config['DEBUG'] = False  # WARNING: Never True in production
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'your-secret-key')
app.config['CORS_HEADERS'] = ['Content-Type']
CORS(app, origins=[os.getenv('FRONTEND_DOMAIN')])
```

### Environment Variables (.env)
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/database
JWT_SECRET=your-very-long-secret-key-min-32-characters
JWT_EXPIRY=1800  # 30 minutes in seconds
FRONTEND_DOMAIN=https://yourdomain.com
FLASK_ENV=production
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["gunicorn", "-w 4", "-b 0.0.0.0:5000", "app:app"]
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Duplicate Route Error
**Error**: `AssertionError: View function mapping is overwriting an existing endpoint`
**Solution**: Check for duplicate function names in app.py
```bash
grep -n "def logout" app.py  # Find duplicates
```
**Fix**: Remove duplicate, keep only one with proper endpoint name

### Issue: Face Recognition Not Working
**Error**: OpenCV camera fails to open
**Solution**:
1. Check permissions: `ls -la /dev/video0`
2. Try USB camera: `python face_data.py`
3. Restart app if camera in use

### Issue: MongoDB Connection Fails
**Error**: `pymongo.errors.ServerSelectionTimeoutError`
**Solution**:
1. Verify MongoDB running: `brew services list` (macOS)
2. Check connection string: `connection_string` in app.py
3. Verify network: `ping localhost` (if local)

### Issue: Token Always Invalid
**Error**: "Invalid or expired token" on every request
**Solution**:
1. Clear localStorage and login again
2. Check JWT_SECRET consistency in app.py
3. Verify token not older than 30 minutes
4. Check Authorization header format: `Bearer <token>`

### Issue: PDF Upload Returns 400
**Error**: "400 Bad Request" on PDF upload
**Solution**:
1. Check file is valid PDF
2. Check Content-Type header: `multipart/form-data`
3. Check file size < 50MB (configurable in app.py)
4. Verify form field name matches backend

---

## 🔍 DEBUGGING TIPS

### Enable Debug Logging
```python
# In app.py
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.route('/api/vault/add-password', methods=['POST'])
def add_password():
    logger.debug(f"Adding password: {request.json}")
    logger.debug(f"User: {request.user_email}")
    # ... rest of code
```

### Check API Response
```javascript
// In browser console
fetch('/api/vault/passwords', {
    headers: {'Authorization': `Bearer ${localStorage.getItem('authToken')}`}
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
```

### Inspect Database
```bash
# MongoDB
mongo
> use face-vault
> db.users_auth.findOne()
> db.vaults.find()
> db.pdf_vault.find()
```

### View Application Logs
```bash
# Terminal running Flask
python app.py
# All debug output displays here
```

---

## 📚 CODE REVIEW CHECKLISTS

### Before Merging New Code
- [ ] All variables properly initialized
- [ ] No hardcoded secrets or credentials
- [ ] Error handling for all API calls
- [ ] Input validation on both frontend & backend
- [ ] Encryption for sensitive data
- [ ] Audit logging for user actions
- [ ] Token verification on protected routes
- [ ] CORS headers properly set
- [ ] No console.log in production code
- [ ] Mobile responsive design verified

---

## 🎓 NEXT FEATURES TO ADD

1. **Email Notifications**
   - Password changed
   - PDF accessed
   - Login from new device

2. **Advanced Security**
   - Two-factor authentication
   - Biometric login (fingerprint)
   - Login attempt limits

3. **Password Manager Features**
   - Bulk import from CSV
   - Password strength meter
   - Expiration reminders

4. **PDF Features**
   - Batch upload
   - Share with others
   - Watermark on access

5. **Analytics & Reporting**
   - Login history
   - Access logs
   - Usage statistics
   - Admin dashboard

---

## 📞 MAINTENANCE NOTES

- **Update Frequency**: Check `requirements.txt` monthly for security updates
- **Database Backups**: Implement MongoDB automated backups
- **Token Expiry**: Currently 30 minutes (configurable in app.py)
- **Face Model**: Retrain monthly as users add more samples
- **Encryption Key**: Store safely, backup essential for decryption
- **CORS Updates**: Update allowed origins when deploying to new domain

---

**Last Updated**: March 17, 2026
**Status**: Production Ready ✅
**Maintainer**: Development Team

