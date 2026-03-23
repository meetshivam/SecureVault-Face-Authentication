# 🚀 SecureVault - Command Cheat Sheet
## Quick Reference for Common Operations

---

## 💻 TERMINAL COMMANDS

### Start the Application
```bash
cd /Users/shivamgautam/Desktop/Face-Authentication-Using-Python
python app.py
```

### Install/Update Dependencies
```bash
pip3 install -r requirements.txt
pip3 install -r requirements.txt --force-reinstall  # Force update
```

### Check Dependencies Installed
```bash
pip3 list | grep -E "Flask|cryptography|PyMuPDF"
```

### Test Python Syntax
```bash
python3 -m py_compile app.py
python3 -c "import app; print('✅ OK')"
```

### Start MongoDB (macOS)
```bash
brew services start mongodb-community
brew services stop mongodb-community
brew services restart mongodb-community
brew services list | grep mongodb
```

### Stop Flask App
```bash
# In Flask terminal: Ctrl+C
# Or from another terminal:
kill-port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Check if Port 5000 is in Use
```bash
lsof -i :5000
netstat -an | grep 5000
```

### Clear Python Cache
```bash
find . -type d -name __pycache__ -exec rm -r {} +
find . -type f -name "*.pyc" -delete
```

---

## 🌐 BROWSER COMMANDS

### Open Application
```
http://127.0.0.1:5000/login.html
http://localhost:5000/login.html
```

### Pages Available
```
/login.html           - Login page
/register.html        - Registration page
/dashboard.html       - Main dashboard (if authenticated)
/index.html           - Landing page
```

### Browser DevTools Shortcuts
```
F12              - Open DevTools
Ctrl+Shift+I     - Open DevTools (Windows/Linux)
Cmd+Option+I     - Open DevTools (macOS)
Ctrl+Shift+J     - Open Console
Ctrl+Shift+E     - Open Network tab
Ctrl+Shift+K     - Open Console only
```

### Clear Browser Storage
```javascript
// In DevTools Console:
localStorage.clear();     // Clear all stored data
localStorage.removeItem('authToken');  // Clear specific item
sessionStorage.clear();
location.reload();
```

### Check Token in Browser
```javascript
// In DevTools Console:
localStorage.getItem('authToken')
// Or in Application tab: Local Storage → http://localhost:5000
```

---

## 🗄️ MONGODB COMMANDS

### Connect to MongoDB
```bash
mongosh
# or older versions:
mongo
```

### Inside MongoDB Shell
```bash
# Show all databases
show dbs

# Switch to face-vault database
use face-vault

# Show all collections
show collections

# Find all users
db.users_auth.find()

# Find specific user
db.users_auth.findOne({"email": "test@example.com"})

# Count documents
db.users_auth.countDocuments()

# Find all passwords in vault
db.vaults.find()

# Find all PDFs in vault
db.pdf_vault.find()

# Delete all data (⚠️ WARNING)
db.dropDatabase()

# Delete specific user
db.users_auth.deleteOne({"email": "test@example.com"})

# Exit MongoDB
exit
```

---

## 📝 API TESTING COMMANDS

### Using curl
```bash
# Test if server is running
curl -X GET http://127.0.0.1:5000/get_status

# Login (get OTP from terminal)
curl -X POST http://127.0.0.1:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check status with token
curl -X GET http://127.0.0.1:5000/get_status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Logout
curl -X POST http://127.0.0.1:5000/api/user/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Python
```python
import requests

# Test connection
response = requests.get('http://127.0.0.1:5000/get_status')
print(response.json())

# Login
response = requests.post('http://127.0.0.1:5000/api/login', 
                        json={"email": "test@example.com"})
print(response.json())

# With token
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://127.0.0.1:5000/get_status', 
                       headers=headers)
print(response.json())
```

### Using JavaScript (Browser Console)
```javascript
// Check status
fetch('http://127.0.0.1:5000/get_status')
  .then(r => r.json())
  .then(data => console.log(data))

// Get passwords
fetch('http://127.0.0.1:5000/api/vault/passwords', {
  headers: {'Authorization': `Bearer ${localStorage.getItem('authToken')}`}
})
  .then(r => r.json())
  .then(data => console.log(data))

// Add password
fetch('http://127.0.0.1:5000/api/vault/add-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  },
  body: JSON.stringify({
    site: 'github.com',
    username: 'myuser',
    password: 'mypass123'
  })
})
  .then(r => r.json())
  .then(data => console.log(data))
```

---

## 🐛 DEBUGGING COMMANDS

### Check Logs
```bash
# In running Flask terminal - all output shows here
# Look for:
# - WARNING messages (usually safe to ignore)
# - ERROR messages (problems to fix)
# - Your debug print statements

# Scroll through history
# Ctrl+C to stop, scroll up in terminal
```

### Enable Debug Logging
```python
# In app.py, add near top:
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Use in routes:
logger.debug(f"User email: {email}")
logger.info(f"Password added successfully")
logger.error(f"Database connection failed")
```

### Test Specific Module
```bash
python3 << 'EOF'
# Test imports
import app
import face_data
print("✅ All imports successful")

# Test MongoDB
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017/')
print("✅ MongoDB connection successful")

# Test encryption
from cryptography.fernet import Fernet
key = Fernet.generate_key()
cipher = Fernet(key)
print("✅ Encryption working")
EOF
```

### Check Device Info
```bash
# Python version
python3 --version

# pip location
which pip3

# Virtual environment (if using)
which python

# System info (macOS)
sw_vers
```

---

## 🔧 QUICK FIXES

### Reset Everything
```bash
# Kill Flask
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Clear database
mongosh
use face-vault
db.dropDatabase()
exit

# Clear browser storage
# DevTools (F12) → Application → Clear Site Data

# Restart
python app.py
```

### Restart Services
```bash
# Restart MongoDB
brew services restart mongodb-community

# Restart Flask
# (Stop Flask, then python app.py)

# Clear cache and restart browser
# (Ctrl+Shift+Delete in Chrome/Firefox)
```

### Fix Common Errors

#### "Port 5000 already in use"
```bash
kill-port 5000
python app.py
```

#### "MongoDB connection refused"
```bash
brew services start mongodb-community
python app.py
```

#### "ModuleNotFoundError: No module named 'X'"
```bash
pip3 install -r requirements.txt --force-reinstall
python app.py
```

#### "Flask route already defined error"
```bash
# Check for duplicates
grep -n "def logout" app.py
grep -n "@app.route" app.py | grep duplicate

# App auto-recompiles, should fix after restart
python app.py
```

#### "Face won't recognize"
```bash
# Try different camera port
# In face_data.py line with cv2.VideoCapture(0):
# Change 0 to 1, 2, 3...

# Or check camera works:
python3 << 'EOF'
import cv2
cap = cv2.VideoCapture(0)
ret, frame = cap.read()
print(f"Camera works: {ret}")
cap.release()
EOF
```

---

## 📊 MONITORING COMMANDS

### Watch File Changes (Optional)
```bash
# Install watchmedo (if needed):
pip3 install watchdog[watchmedo]

# Watch for changes (auto-restart capability):
watchmedo shell-command \
  --patterns="*.py" \
  --recursive \
  --command='echo "File changed at $(date)"' \
  .
```

### Check System Resources (macOS)
```bash
# CPU/Memory usage
top

# Disk usage
df -h

# Network connections
netstat -an | grep 5000
```

---

## 🎯 TEST SCENARIO COMMANDS

### Quick Registration Test
```bash
curl -X POST http://127.0.0.1:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quicktest@example.com",
    "password": "Test123!",
    "name": "Quick Test"
  }'
```

### Quick Login Test
```bash
# 1. Start face verification
curl -X POST http://127.0.0.1:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "quicktest@example.com"}'

# 2. Show face to webcam (in browser window)

# 3. Check status
curl -X GET http://127.0.0.1:5000/get_status
```

### Quick Password Add Test
```bash
curl -X POST http://127.0.0.1:5000/api/vault/add-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "site": "github.com",
    "username": "testuser",
    "password": "testpass123"
  }'
```

---

## 📚 QUICK LINKS

### Documentation
```
DOCUMENTATION_INDEX.md      - Navigation hub (START HERE)
PRODUCTION_READY.md         - Quick start & status
TESTING_GUIDE.md            - All test scenarios
DEVELOPER_REFERENCE.md      - Technical details
SECUREVAULT_FIXES_SUMMARY.md - What was fixed
```

### Code Files
```
app.py              - Main Flask API
face_data.py        - Face recognition
Templates/*.html    - Web pages
static/*            - CSS & JavaScript
requirements.txt    - Dependencies
```

### Configuration
```
Port: 5000 (in app.py last line)
Database: mongodb://localhost:27017/face-vault
JWT Expiry: 30 minutes (in generate_jwt)
```

---

## ⏱️ COMMON TIMINGS

| Operation | Time |
|-----------|------|
| Start Flask | 3 sec |
| Open login page | 2 sec |
| Register account | 2 min |
| Verify OTP | 1 min |
| Face enrollment (3 angles) | 2 min |
| Login with face | 30 sec |
| Add password | 20 sec |
| Upload PDF | 1 min |
| Change password | 1 min |
| Logout & re-login | 2 min |

**Total first run**: ~15 minutes

---

## 🎓 USEFUL PATTERNS

### Check Something Works
```bash
python3 -c "YOUR_CODE_HERE"
# Examples:
python3 -c "import app; print('✅ OK')"
python3 -c "from cryptography.fernet import Fernet; print('✅ OK')"
```

### Run API Test
```bash
# Simple GET
curl -X GET http://127.0.0.1:5000/endpoint

# With JSON
curl -X POST http://127.0.0.1:5000/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# With auth token
curl -X GET http://127.0.0.1:5000/endpoint \
  -H "Authorization: Bearer token_here"
```

### Check Database
```bash
mongosh
use face-vault
db.users_auth.findOne()
exit
```

---

## 📞 EMERGENCY FIXES

### Everything Is Broken
```bash
# 1. Stop Flask
Ctrl+C in Flask terminal

# 2. Start fresh
cd /Users/shivamgautam/Desktop/Face-Authentication-Using-Python
python app.py

# 3. If that doesn't work:
pip3 install -r requirements.txt --force-reinstall
python app.py

# 4. If database is corrupt:
brew services restart mongodb-community
python app.py
```

### Can't Connect to Database
```bash
brew services start mongodb-community
mongosh  # verify it starts
exit
python app.py
```

### App Won't Start
```python
# Test if app loads:
python3 -c "import app"

# If error, check:
# 1. Print error
# 2. Look at line number
# 3. Fix that line
# 4. Try again
```

---

## ✅ VERIFICATION CHECKLIST

Before assuming something is broken:

- [ ] Flask running? (Terminal shows "Running on...")
- [ ] Browser showing page? (Page loads)
- [ ] DevTools show errors? (F12 → Console)
- [ ] Network requests failing? (DevTools → Network)
- [ ] Database connected? (Check MongoDB running)
- [ ] Token present? (localStorage in DevTools)
- [ ] Correct port? (http://localhost:5000)

---

**Last Updated**: March 17, 2026  
**Purpose**: Quick reference for common commands  
**Keep**: Bookmarked for daily use

**Most Common Command**: `python app.py` 🚀

