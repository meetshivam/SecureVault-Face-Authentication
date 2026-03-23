# 🔐 SecureVault — Face Authentication System

A full-stack face authentication password manager built with **Flask** (backend) and **React + Tailwind CSS** (frontend). Uses LBPH facial recognition for biometric login, an encrypted password vault, and a PDF vault.

---

## 📁 Project Structure

```
├── backend/              # Flask API server
│   ├── app.py            # Main Flask application
│   ├── face_data.py      # Face verification module
│   ├── train.py          # Model training script
│   ├── requirements.txt  # Python dependencies
│   ├── trainer.yml       # Trained face model
│   ├── face_data/        # Stored face images
│   └── dataset/          # Training dataset
│
├── frontend/             # React SPA
│   ├── src/
│   │   ├── App.jsx       # Root component with routes
│   │   ├── pages/        # All page components
│   │   ├── components/   # Shared UI components
│   │   ├── context/      # Auth context (JWT)
│   │   └── utils/        # API utility
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
```

---

## ⚙️ Prerequisites

- **Python 3.8+**
- **Node.js 18+** & **npm**
- **MongoDB** running locally on `mongodb://localhost:27017/`
- **Webcam** (for face recognition)

---

## 🚀 Setup & Run

### 1. Clone the Repository

```bash
git clone https://github.com/AnubhavChaturvedi-GitHub/Face-Authentication-Using-Python.git
cd Face-Authentication-Using-Python
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python3 -m venv .venv/
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# Install Python dependencies
pip install -r backend/requirements.txt

# Start MongoDB (if not running)
mongod --dbpath /path/to/your/db

# Run the Flask server
cd backend
python app.py
```

> Flask will start at **http://127.0.0.1:5000**

### 3. Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install Node dependencies
npm install

# Start the Vite dev server
npm run dev
```

> React dev server starts at **http://localhost:5173** with API requests proxied to Flask.

### 4. Production Build

```bash
# Build the React app
cd frontend
npm run build

# The build output goes to frontend/dist/
# Flask will automatically serve it at http://127.0.0.1:5000
cd ../backend
python app.py
```

---

## 📋 All Commands at a Glance

| Action | Command |
|--------|---------|
| Install backend deps | `pip install -r backend/requirements.txt` |
| Run backend server | `cd backend && python app.py` |
| Install frontend deps | `cd frontend && npm install` |
| Run frontend dev server | `cd frontend && npm run dev` |
| Build frontend for production | `cd frontend && npm run build` |
| Train face model manually | `cd backend && python train.py` |

---

## 🔑 Key Features

- **Face Registration** — Multi-angle face capture (front, left, right)
- **Face Login** — Email + face scan authentication with JWT tokens
- **Password Vault** — Encrypted storage with CRUD operations
- **PDF Vault** — Upload, encrypt, and access PDFs with face/password auth
- **Audit Logs** — Full activity trail for all actions
- **Profile Management** — Update name, email, change password

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS v4, Vite, Framer Motion, React Router |
| Backend | Flask, Flask-CORS, OpenCV, PyJWT |
| Database | MongoDB (PyMongo) |
| Encryption | Fernet (AES-256), SHA-256 hashing |
| Face Recognition | OpenCV LBPH Face Recognizer |

---

## 📝 Environment Notes

- The backend OTP is printed to the console (dev mode) — check terminal output during registration.
- Default Flask secret key is a placeholder — change `SECRET_KEY` in `app.py` for production.
- MongoDB must be running before starting the backend.