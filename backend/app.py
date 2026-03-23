from flask import Flask, send_from_directory, Response, jsonify, request
from flask_cors import CORS
import cv2
import os
import numpy as np
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import jwt
import json
from functools import wraps
import hashlib
import secrets
import string
import base64
from cryptography.fernet import Fernet
import fitz  # PyMuPDF
import face_recognition
import pickle

# ================== PATH SETUP ==================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), 'frontend')
FRONTEND_DIST = os.path.join(FRONTEND_DIR, 'dist')

app = Flask(
    __name__,
    static_folder=FRONTEND_DIST,
    static_url_path=''
)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
CORS(app)

# ================== MONGODB SETUP ==================
client = MongoClient("mongodb://localhost:27017/")
db = client["FaceAuthDB"]
users_collection = db["users"]
users_auth = db["users_auth"]  # Email, password, verification
vaults = db["vaults"]  # Encrypted vault data
audit_logs = db["audit_logs"]  # Activity tracking
devices = db["devices"]  # Device management
pdf_vault = db["pdf_vault"]  # PDF vault storage with encryption
vault_access_log = db["vault_access_log"]  # PDF vault access logging

# ================== FACE RECOGNITION CONFIG ==================
FACE_DIR = os.path.join(BASE_DIR, "face_data")
FACE_DISTANCE_THRESHOLD = 0.5  # face_distance < 0.5 means match
os.makedirs(FACE_DIR, exist_ok=True)

# ================== HELPER FUNCTIONS ==================

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(secrets.choice(string.digits) for _ in range(6))

def hash_password(password):
    """Hash password with SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_jwt(email, user_id):
    """Generate JWT token valid for 30 minutes"""
    payload = {
        'email': email,
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(minutes=30),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return token

def verify_jwt(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def log_audit(user_id, action, details="", status="success"):
    """Log user activity to audit trail"""
    audit_logs.insert_one({
        "user_id": user_id,
        "action": action,
        "details": details,
        "status": status,
        "timestamp": datetime.utcnow(),
        "ip_address": request.remote_addr
    })

def require_auth(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Missing authorization token"}), 401
        
        token = token.replace('Bearer ', '')
        payload = verify_jwt(token)
        
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        request.user_id = payload['user_id']
        request.user_email = payload['email']
        return f(*args, **kwargs)
    
    return decorated

def decode_base64_image(image_data):
    """Decode a base64 image string to a numpy array (RGB)."""
    if ',' in image_data:
        image_data = image_data.split(',')[1]
    image_bytes = base64.b64decode(image_data)
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if frame is None:
        return None
    # face_recognition uses RGB, OpenCV uses BGR
    return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

def extract_face_encoding(rgb_image):
    """Extract face encoding from an RGB image. Returns (encoding, error_msg)."""
    face_locations = face_recognition.face_locations(rgb_image)
    if len(face_locations) == 0:
        return None, "No face detected in image"
    if len(face_locations) > 1:
        # Use the largest face
        face_locations = [max(face_locations, key=lambda loc: (loc[2] - loc[0]) * (loc[1] - loc[3]))]
    encodings = face_recognition.face_encodings(rgb_image, face_locations)
    if len(encodings) == 0:
        return None, "Could not encode face"
    return encodings[0], None

# ================== PDF VAULT ENCRYPTION/DECRYPTION ==================

def encrypt_pdf(pdf_bytes):
    """
    Encrypt PDF bytes using Fernet encryption.
    Returns: (encrypted_bytes, encryption_key_base64)
    """
    key = Fernet.generate_key()
    f = Fernet(key)
    encrypted = f.encrypt(pdf_bytes)
    key_base64 = base64.b64encode(key).decode('utf-8')
    return encrypted, key_base64

def decrypt_pdf(encrypted_bytes, key_base64):
    """
    Decrypt PDF bytes using Fernet encryption.
    """
    try:
        key = base64.b64decode(key_base64)
        f = Fernet(key)
        decrypted = f.decrypt(encrypted_bytes)
        return decrypted
    except Exception as e:
        print(f"Decryption error: {str(e)}")
        return None

def hash_pdf_password(password):
    """Hash password with SHA256 for storage"""
    return hashlib.sha256(password.encode()).hexdigest()

# ================== SERVE REACT SPA ==================

@app.route('/')
@app.route('/features')
@app.route('/pricing')
@app.route('/demo')
@app.route('/login')
@app.route('/register')
@app.route('/dashboard')
def serve_spa(**kwargs):
    return send_from_directory(FRONTEND_DIST, 'index.html')

# ==================== PHASE 1: ONBOARDING ====================

@app.route("/api/signup", methods=['POST'])
def signup():
    """User registration with email, password, and face image.
    Extracts face_encoding using face_recognition and stores as pickle in DB.
    """
    try:
        data = request.json
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        face_image = data.get('face_image', '')  # base64 encoded image
        
        # Validate required fields
        if not email or not password or not name:
            missing = []
            if not email: missing.append('email')
            if not password: missing.append('password')
            if not name: missing.append('name')
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
        
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        
        # Check if user already exists
        existing_user = users_auth.find_one({"email": email})
        if existing_user:
            print(f"[SIGNUP] User already exists: {email}")
            return jsonify({"error": "Email already registered"}), 409
        
        # Process face image if provided
        face_encoding_pickle = None
        face_saved_path = None
        
        if face_image:
            print(f"[SIGNUP] Processing face image for {email}...")
            
            # Decode base64 image
            rgb_image = decode_base64_image(face_image)
            if rgb_image is None:
                print(f"[SIGNUP] Failed to decode face image for {email}")
                return jsonify({"error": "Failed to decode face image"}), 400
            
            # Extract face encoding
            encoding, err = extract_face_encoding(rgb_image)
            if err:
                print(f"[SIGNUP] Face encoding error for {email}: {err}")
                return jsonify({"error": err}), 400
            
            # Save face image to disk
            try:
                dir_path = os.path.join(FACE_DIR, email)
                os.makedirs(dir_path, exist_ok=True)
                file_path = os.path.join(dir_path, "face.jpg")
                
                # Convert RGB back to BGR for saving
                bgr_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
                cv2.imwrite(file_path, bgr_image)
                face_saved_path = file_path
                print(f"[SIGNUP] Face image saved: {face_saved_path}")
            except Exception as e:
                print(f"[SIGNUP] Error saving face image: {e}")
                return jsonify({"error": f"Failed to save face image: {str(e)}"}), 400
            
            # Pickle the face encoding for storage
            try:
                face_encoding_pickle = pickle.dumps(encoding)
                print(f"[SIGNUP] Face encoding pickled successfully for {email}")
            except Exception as e:
                print(f"[SIGNUP] Error pickling face encoding: {e}")
                return jsonify({"error": f"Failed to process face encoding: {str(e)}"}), 400
        
        # Store user in database
        try:
            user_doc = {
                "email": email,
                "password": hash_password(password),
                "name": name,
                "verified": True,
                "face_enrolled": face_image != '',
                "face_encoding": face_encoding_pickle,
                "created_at": datetime.utcnow(),
            }
            
            result = users_auth.insert_one(user_doc)
            print(f"[SIGNUP] User created successfully: {email} (ID: {result.inserted_id})")
            
            log_audit(result.inserted_id, "signup", f"Account created with face_enrolled={face_image != ''}")
            
            return jsonify({
                "success": True,
                "message": "Signup successful.",
                "email": email,
                "name": name,
                "face_enrolled": face_image != ''
            }), 201
            
        except Exception as e:
            print(f"[SIGNUP] Database error for {email}: {e}")
            return jsonify({"error": f"Failed to create account: {str(e)}"}), 500
    
    except Exception as e:
        print(f"[SIGNUP] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Signup failed: {str(e)}"}), 500

# ==================== PHASE 2: LOGIN ====================

@app.route("/auth/login-email", methods=['POST'])
def login_email():
    """Step 1: Verify email + password. Returns success if valid (no token yet)."""
    data = request.json
    email = data.get('email', '').lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    user = users_auth.find_one({"email": email, "verified": True})
    if not user:
        return jsonify({"error": "User not found or not verified"}), 404
    
    if user.get('password') != hash_password(password):
        return jsonify({"error": "Invalid password"}), 401
    
    if not user.get('face_enrolled'):
        return jsonify({"error": "Face not enrolled. Please register again with face scan."}), 400
    
    log_audit(user['_id'], "login_email", "Email/password verified")
    
    return jsonify({
        "success": True,
        "email": email,
        "name": user.get('name', ''),
        "message": "Email verified. Please proceed with face scan."
    }), 200


@app.route("/auth/login-face", methods=['POST'])
def login_face():
    """Step 2: Face verification gate. Compare incoming face with stored encoding.
    Uses face_recognition.face_distance(). Grants JWT only if distance < 0.5.
    """
    data = request.json
    email = data.get('email', '').lower()
    face_image = data.get('face_image', '')
    
    if not email or not face_image:
        return jsonify({"error": "Email and face_image are required"}), 400
    
    user = users_auth.find_one({"email": email, "verified": True})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.get('face_encoding'):
        return jsonify({"error": "No face encoding stored for this user"}), 400
    
    # Decode and extract incoming face
    rgb_image = decode_base64_image(face_image)
    if rgb_image is None:
        return jsonify({"error": "Failed to decode face image"}), 400
    
    incoming_encoding, err = extract_face_encoding(rgb_image)
    if err:
        return jsonify({"error": err}), 400
    
    # Load stored encoding
    stored_encoding = pickle.loads(user['face_encoding'])
    
    # Compare using face_distance
    distances = face_recognition.face_distance([stored_encoding], incoming_encoding)
    distance = float(distances[0])
    match_confidence = round((1.0 - distance) * 100, 2)
    
    print(f"[FACE AUTH] email={email} distance={distance:.4f} confidence={match_confidence}% threshold={FACE_DISTANCE_THRESHOLD}")
    
    if distance < FACE_DISTANCE_THRESHOLD:
        # Face matches — grant JWT token
        token = generate_jwt(email, user['_id'])
        log_audit(user['_id'], "login_face", f"Face verified. distance={distance:.4f} confidence={match_confidence}%")
        
        return jsonify({
            "success": True,
            "token": token,
            "match_confidence": match_confidence,
            "face_distance": distance,
            "user_data": {
                "email": email,
                "name": user.get('name', ''),
                "id": str(user['_id'])
            },
            "message": "Face verified successfully"
        }), 200
    else:
        # Face does NOT match — reject
        log_audit(user['_id'], "login_face_failed", f"Face rejected. distance={distance:.4f} confidence={match_confidence}%", status="failed")
        
        return jsonify({
            "success": False,
            "match_confidence": match_confidence,
            "face_distance": distance,
            "error": "Face does not match. Access denied."
        }), 401


# ==================== VAULT FACE VERIFICATION (for PDF vault) ====================

def verify_face_from_base64(email, face_image_b64):
    """Verify face from base64 image against stored encoding.
    Returns dict with verified, confidence, distance.
    """
    user = users_auth.find_one({"email": email, "verified": True})
    if not user or not user.get('face_encoding'):
        return {"verified": False, "error": "No face encoding stored"}
    
    rgb_image = decode_base64_image(face_image_b64)
    if rgb_image is None:
        return {"verified": False, "error": "Failed to decode image"}
    
    incoming_encoding, err = extract_face_encoding(rgb_image)
    if err:
        return {"verified": False, "error": err}
    
    stored_encoding = pickle.loads(user['face_encoding'])
    distances = face_recognition.face_distance([stored_encoding], incoming_encoding)
    distance = float(distances[0])
    confidence = round((1.0 - distance) * 100, 2)
    
    return {
        "verified": distance < FACE_DISTANCE_THRESHOLD,
        "confidence": confidence,
        "distance": distance
    }


# ==================== PHASE 3: VAULT OPERATIONS ====================

@app.route("/api/vault/add-password", methods=['POST'])
@require_auth
def add_password():
    """Add new password to vault with encryption"""
    try:
        data = request.json
        
        # Validate required fields
        site = data.get('site', '').strip()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not site or not username or not password:
            return jsonify({"error": "Site, username, and password are required"}), 400
        
        user = users_auth.find_one({"email": request.user_email})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Encrypt password
        password_bytes = password.encode()
        key = Fernet.generate_key()
        f = Fernet(key)
        encrypted_password = f.encrypt(password_bytes)
        encryption_key = base64.b64encode(key).decode('utf-8')
        
        vault_entry = {
            "user_id": user['_id'],
            "type": "password",
            "site": site,
            "username": username,
            "password": base64.b64encode(encrypted_password).decode('utf-8'),
            "encryption_key": encryption_key,
            "email": data.get('email', '').strip(),
            "url": data.get('url', '').strip(),
            "notes": data.get('notes', '').strip(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_accessed": None
        }
        
        result = vaults.insert_one(vault_entry)
        log_audit(user['_id'], "password_added", f"Added password for {site}")
        
        return jsonify({
            "success": True,
            "message": "Password added successfully and encrypted",
            "id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"Error in add_password: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/vault/passwords", methods=['GET'])
@require_auth
def get_passwords():
    """Get all saved passwords"""
    user = users_auth.find_one({"email": request.user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    passwords = list(vaults.find({
        "user_id": user['_id'],
        "type": "password"
    }, {"password": 0}))  # Don't return actual passwords
    
    return jsonify({
        "count": len(passwords),
        "passwords": [{
            "id": str(p['_id']),
            "site": p.get('site'),
            "username": p.get('username'),
            "notes": p.get('notes')
        } for p in passwords]
    }), 200

@app.route("/api/vault/view-password/<password_id>", methods=['GET'])
@require_auth
def view_password(password_id):
    """View password (requires valid token)"""
    user = users_auth.find_one({"email": request.user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    password = vaults.find_one({
        "_id": ObjectId(password_id),
        "user_id": user['_id'],
        "type": "password"
    })
    
    if not password:
        return jsonify({"error": "Password not found"}), 404
    
    # Update last accessed
    vaults.update_one(
        {"_id": ObjectId(password_id)},
        {"$set": {"last_accessed": datetime.utcnow()}}
    )
    
    log_audit(user['_id'], "password_viewed", f"Accessed {password.get('site')}")
    
    return jsonify({
        "id": str(password['_id']),
        "site": password.get('site'),
        "username": password.get('username'),
        "password": password.get('password'),
        "url": password.get('url', ''),
        "notes": password.get('notes', '')
    }), 200

@app.route("/api/vault/update-password/<password_id>", methods=['PUT'])
@require_auth
def update_password(password_id):
    """Update existing password"""
    user = users_auth.find_one({"email": request.user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.json
    
    # Verify ownership
    password = vaults.find_one({
        "_id": ObjectId(password_id),
        "user_id": user['_id'],
        "type": "password"
    })
    
    if not password:
        return jsonify({"error": "Password not found"}), 404
    
    # Update fields
    update_data = {
        "site": data.get('site', password.get('site')),
        "username": data.get('username', password.get('username')),
        "password": data.get('password', password.get('password')),
        "url": data.get('url', password.get('url')),
        "notes": data.get('notes', password.get('notes')),
        "updated_at": datetime.utcnow()
    }
    
    vaults.update_one(
        {"_id": ObjectId(password_id)},
        {"$set": update_data}
    )
    
    log_audit(user['_id'], "password_updated", f"Updated {data.get('site', 'password')}")
    
    return jsonify({
        "message": "Password updated successfully",
        "id": password_id
    }), 200

@app.route("/api/vault/delete-password/<password_id>", methods=['DELETE'])
@require_auth
def delete_password(password_id):
    """Delete password"""
    user = users_auth.find_one({"email": request.user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    password = vaults.find_one({
        "_id": ObjectId(password_id),
        "user_id": user['_id'],
        "type": "password"
    })
    
    if not password:
        return jsonify({"error": "Password not found"}), 404
    
    site_name = password.get('site', 'Unknown')
    
    vaults.delete_one({"_id": ObjectId(password_id)})
    
    log_audit(user['_id'], "password_deleted", f"Deleted {site_name}")
    
    return jsonify({
        "message": "Password deleted successfully"
    }), 200

@app.route("/api/vault/password-count", methods=['GET'])
@require_auth
def password_count():
    """Get count of passwords for user"""
    user = users_auth.find_one({"email": request.user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    count = vaults.count_documents({
        "user_id": user['_id'],
        "type": "password"
    })
    
    return jsonify({"count": count}), 200

# ==================== AUDIT LOGS ====================

@app.route("/api/audit-logs", methods=['GET'])
@require_auth
def get_audit_logs():
    """Get user's audit trail"""
    user = users_auth.find_one({"email": request.user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    logs = list(audit_logs.find(
        {"user_id": user['_id']},
        sort=[("timestamp", -1)],
        limit=50
    ))
    
    return jsonify({
        "count": len(logs),
        "logs": [{
            "action": log.get('action'),
            "details": log.get('details'),
            "status": log.get('status'),
            "timestamp": log.get('timestamp').isoformat(),
            "ip": log.get('ip_address')
        } for log in logs]
    }), 200

# ==================== USER PROFILE ====================

@app.route("/api/user/profile", methods=['GET'])
@require_auth
def get_profile():
    """Get user profile information"""
    user = users_auth.find_one({"email": request.user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "name": user.get('name', ''),
        "email": user.get('email', ''),
        "face_enrolled": user.get('face_enrolled', False),
        "created_at": user.get('created_at').isoformat() if user.get('created_at') else None,
        "last_login": user.get('last_login', 'N/A')
    }), 200

@app.route("/api/user/update-profile", methods=['POST'])
@require_auth
def update_profile():
    """Update user profile information"""
    user = users_auth.find_one({"email": request.user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.json
    
    # Update name if provided
    if 'name' in data and data['name']:
        users_auth.update_one(
            {"email": request.user_email},
            {"$set": {"name": data['name']}}
        )
        log_audit(user['_id'], "profile_updated", "Name updated")
    
    # Update email if provided
    if 'email' in data and data['email'] and data['email'] != request.user_email:
        # Check if new email already exists
        if users_auth.find_one({"email": data['email'].lower()}):
            return jsonify({"error": "Email already in use"}), 409
        
        users_auth.update_one(
            {"email": request.user_email},
            {"$set": {"email": data['email'].lower()}}
        )
        log_audit(user['_id'], "profile_updated", "Email updated")
    
    return jsonify({"message": "Profile updated successfully"}), 200

@app.route("/api/user/reset-password", methods=['POST'])
@require_auth
def reset_password():
    """Reset user password"""
    user = users_auth.find_one({"email": request.user_email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.json
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')
    
    if not old_password or not new_password:
        return jsonify({"error": "Missing password fields"}), 400
    
    # Verify old password
    if hash_password(old_password) != user.get('password'):
        return jsonify({"error": "Current password is incorrect"}), 401
    
    # Ensure new password is different
    if old_password == new_password:
        return jsonify({"error": "New password must be different"}), 400
    
    # Update password
    users_auth.update_one(
        {"email": request.user_email},
        {"$set": {"password": hash_password(new_password)}}
    )
    
    log_audit(user['_id'], "password_reset", "Master password changed")
    
    return jsonify({"message": "Password reset successfully"}), 200

@app.route("/api/user/logout", methods=['POST'])
@require_auth
def logout():
    """Logout user (invalidate session)"""
    user = users_auth.find_one({"email": request.user_email})
    if user:
        log_audit(user['_id'], "logout", "User logged out")
    
    return jsonify({"message": "Logged out successfully"}), 200

# ================== PDF VAULT ROUTES ==================

@app.route("/vault/list", methods=['GET'])
@require_auth
def vault_list():
    """Get list of PDFs for current user"""
    try:
        user_id = ObjectId(request.user_id)
        pdfs = list(pdf_vault.find({"user_id": user_id}, {"pdf_data": 0, "encryption_key": 0}))
        
        # Convert ObjectIDs to strings for JSON serialization
        for pdf in pdfs:
            pdf['_id'] = str(pdf['_id'])
            pdf['user_id'] = str(pdf['user_id'])
            pdf['upload_date'] = pdf.get('upload_date', datetime.utcnow()).isoformat()
        
        return jsonify({"success": True, "documents": pdfs}), 200
    except Exception as e:
        print(f"Error in vault_list: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/vault/upload", methods=['POST'])
@require_auth
def vault_upload():
    """Upload and encrypt PDF"""
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Validate file is PDF
        if not file.filename.endswith('.pdf'):
            return jsonify({"error": "File must be a PDF"}), 400
        
        auth_type = request.form.get('auth_type', 'face')
        password = request.form.get('password', '')
        
        # Validate auth_type
        if auth_type not in ['face', 'password', 'both']:
            return jsonify({"error": "Invalid auth_type"}), 400
        
        # Validate password if required
        if auth_type in ['password', 'both'] and not password:
            return jsonify({"error": "Password required for selected auth type"}), 400
        
        # Read PDF file
        pdf_bytes = file.read()
        
        # Encrypt PDF
        encrypted_pdf, encryption_key = encrypt_pdf(pdf_bytes)
        
        # Prepare document
        user_id = ObjectId(request.user_id)
        pdf_doc = {
            "user_id": user_id,
            "filename": file.filename,
            "original_name": file.filename,
            "upload_date": datetime.utcnow(),
            "pdf_data": encrypted_pdf,
            "encryption_key": encryption_key,
            "auth_type": auth_type,
            "password_hash": hash_pdf_password(password) if password else None,
            "file_size": len(pdf_bytes),
            "is_locked": True
        }
        
        # Insert into database
        result = pdf_vault.insert_one(pdf_doc)
        pdf_id = str(result.inserted_id)
        
        # Log access
        vault_access_log.insert_one({
            "pdf_id": result.inserted_id,
            "user_id": user_id,
            "access_time": datetime.utcnow(),
            "auth_method": "upload",
            "success": True
        })
        
        log_audit(request.user_id, "PDF_VAULT_UPLOAD", f"Uploaded {file.filename}", "success")
        
        return jsonify({
            "success": True,
            "pdf_id": pdf_id,
            "filename": file.filename,
            "message": "PDF uploaded and encrypted successfully"
        }), 200
        
    except Exception as e:
        print(f"Error in vault_upload: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/vault/verify-face", methods=['POST'])
@require_auth
def vault_verify_face():
    """Verify face for vault access using face_recognition library"""
    try:
        user_email = request.user_email
        data = request.json or {}
        face_image = data.get('face_image', '')
        
        if not face_image:
            return jsonify({"verified": False, "error": "face_image is required"}), 400
        
        result = verify_face_from_base64(user_email, face_image)
        
        # Log access attempt
        vault_access_log.insert_one({
            "pdf_id": None,
            "user_id": ObjectId(request.user_id),
            "access_time": datetime.utcnow(),
            "auth_method": "face_verification",
            "success": result.get("verified", False)
        })
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error in vault_verify_face: {str(e)}")
        return jsonify({"verified": False, "error": str(e)}), 500

@app.route("/vault/access/<pdf_id>", methods=['POST'])
@require_auth
def vault_access(pdf_id):
    """Access and decrypt PDF"""
    try:
        user_id = ObjectId(request.user_id)
        pdf_objectid = ObjectId(pdf_id)
        
        # Get PDF from database
        pdf_doc = pdf_vault.find_one({"_id": pdf_objectid, "user_id": user_id})
        
        if not pdf_doc:
            return jsonify({"success": False, "error": "PDF not found or access denied"}), 403
        
        # Get auth parameters from request
        auth_type = request.json.get('auth_type', pdf_doc.get('auth_type'))
        password = request.json.get('password', '')
        face_image = request.json.get('face_image', '')
        
        auth_success = False
        auth_method = ""
        
        # Check authentication based on auth_type
        if auth_type == 'face':
            if not face_image:
                return jsonify({"success": False, "error": "face_image required for face auth"}), 400
            result = verify_face_from_base64(request.user_email, face_image)
            auth_success = result.get("verified", False)
            auth_method = "face"
                
        elif auth_type == 'password':
            if hash_pdf_password(password) == pdf_doc.get('password_hash'):
                auth_success = True
                auth_method = "password"
            else:
                return jsonify({"success": False, "reason": "invalid_password"}), 401
                
        elif auth_type == 'both':
            if not face_image:
                return jsonify({"success": False, "error": "face_image required"}), 400
            face_result = verify_face_from_base64(request.user_email, face_image)
            face_verified = face_result.get("verified", False)
            password_verified = hash_pdf_password(password) == pdf_doc.get('password_hash')
            
            auth_success = face_verified and password_verified
            auth_method = "both"
            
            if not auth_success:
                return jsonify({"success": False, "reason": "authentication_failed"}), 401
        else:
            return jsonify({"success": False, "error": "Invalid auth_type"}), 400
        
        if not auth_success:
            return jsonify({"success": False, "reason": "authentication_failed"}), 401
        
        # Decrypt PDF
        decrypted_pdf = decrypt_pdf(pdf_doc['pdf_data'], pdf_doc['encryption_key'])
        
        if decrypted_pdf is None:
            return jsonify({"success": False, "error": "Failed to decrypt PDF"}), 500
        
        # Encode to base64 for transmission
        pdf_base64 = base64.b64encode(decrypted_pdf).decode('utf-8')
        
        # Log access
        vault_access_log.insert_one({
            "pdf_id": pdf_objectid,
            "user_id": user_id,
            "access_time": datetime.utcnow(),
            "auth_method": auth_method,
            "success": True
        })
        
        log_audit(request.user_id, "PDF_VAULT_ACCESS", f"Accessed {pdf_doc['original_name']}", "success")
        
        return jsonify({
            "success": True,
            "pdf_data": pdf_base64,
            "filename": pdf_doc['original_name']
        }), 200
        
    except Exception as e:
        print(f"Error in vault_access: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/vault/delete/<pdf_id>", methods=['DELETE'])
@require_auth
def vault_delete(pdf_id):
    """Delete PDF from vault"""
    try:
        user_id = ObjectId(request.user_id)
        pdf_objectid = ObjectId(pdf_id)
        
        # Get PDF to verify ownership
        pdf_doc = pdf_vault.find_one({"_id": pdf_objectid, "user_id": user_id})
        
        if not pdf_doc:
            return jsonify({"success": False, "error": "PDF not found or access denied"}), 403
        
        # Delete PDF
        pdf_vault.delete_one({"_id": pdf_objectid})
        
        # Log deletion
        vault_access_log.insert_one({
            "pdf_id": pdf_objectid,
            "user_id": user_id,
            "access_time": datetime.utcnow(),
            "auth_method": "deletion",
            "success": True
        })
        
        log_audit(request.user_id, "PDF_VAULT_DELETE", f"Deleted {pdf_doc['original_name']}", "success")
        
        return jsonify({
            "success": True,
            "message": "PDF deleted successfully"
        }), 200
        
    except Exception as e:
        print(f"Error in vault_delete: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)