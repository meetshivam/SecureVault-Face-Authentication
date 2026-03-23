#!/usr/bin/env python3
"""
Diagnostic script to check Face Scan Login setup
"""

import subprocess
import sys
import requests
import time

def check_backend_running():
    """Check if backend Flask app is running"""
    print("\n✓ Checking if backend is running on localhost:5000...")
    try:
        response = requests.get('http://localhost:5000/', timeout=2)
        print("✅ Backend is running!")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend is NOT running")
        print("   Run: cd backend && python app.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_mongodb_running():
    """Check if MongoDB is running"""
    print("\n✓ Checking MongoDB connection...")
    try:
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
        client.server_info()
        print("✅ MongoDB is running!")
        return True
    except Exception as e:
        print(f"❌ MongoDB is NOT running: {e}")
        print("   Run: mongod")
        return False

def check_api_endpoints():
    """Check if API endpoints are accessible"""
    print("\n✓ Checking API endpoints...")
    endpoints = [
        "/auth/login-email",
        "/auth/login-face",
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.options(f'http://localhost:5000{endpoint}', timeout=2)
            if response.status_code in [200, 204, 405]:  # 405 = OPTIONS not allowed, which is OK
                print(f"  ✅ {endpoint} - accessible")
            else:
                print(f"  ⚠️  {endpoint} - status {response.status_code}")
        except Exception as e:
            print(f"  ❌ {endpoint} - {e}")

def check_frontend_running():
    """Check if frontend dev server is running"""
    print("\n✓ Checking if frontend is running on localhost:5173...")
    try:
        response = requests.get('http://localhost:5173/', timeout=2)
        print("✅ Frontend is running!")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Frontend is NOT running")
        print("   Run: cd frontend && npm run dev")
        return False
    except Exception as e:
        print(f"⚠️  Frontend check: {e}")
        return False

def test_login_endpoint():
    """Test login endpoint with dummy data"""
    print("\n✓ Testing /auth/login-email endpoint...")
    try:
        response = requests.post('http://localhost:5000/auth/login-email', 
                               json={"email": "test@example.com", "password": "test"},
                               timeout=2)
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.json()}")
        return True
    except requests.exceptions.ConnectionError:
        print("  ❌ Cannot connect to backend")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("Face Scan Login - Diagnostic Check")
    print("=" * 60)
    
    backend_ok = check_backend_running()
    mongo_ok = check_mongodb_running()
    frontend_ok = check_frontend_running()
    
    if backend_ok:
        check_api_endpoints()
        test_login_endpoint()
    
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print("=" * 60)
    print(f"✓ Backend: {'✅ Running' if backend_ok else '❌ Not running'}")
    print(f"✓ MongoDB: {'✅ Running' if mongo_ok else '❌ Not running'}")
    print(f"✓ Frontend: {'✅ Running' if frontend_ok else '❌ Not running'}")
    print("=" * 60)
    
    if not backend_ok or not mongo_ok:
        print("\n⚠️  REQUIRED: Start backend and MongoDB:")
        print("   Terminal 1: mongod")
        print("   Terminal 2: cd backend && python app.py")
        print("\n✓ Then in a 3rd terminal:")
        print("   Terminal 3: cd frontend && npm run dev")
    elif not frontend_ok:
        print("\n⚠️  Start frontend:")
        print("   cd frontend && npm run dev")
    else:
        print("\n✅ Everything is running! Check browser at http://localhost:5173/login")

if __name__ == '__main__':
    main()
