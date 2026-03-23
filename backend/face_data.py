import cv2
import os
import time

# Initialize the Haar Cascade for face and eye detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

# Create a directory for storing images if it doesn't exist
output_dir = 'dataset'
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# ================== VAULT FACE VERIFICATION ==================

def verify_face_for_vault(recognizer, expected_user_id, confidence_threshold=80):
    """
    Opens webcam, captures frame, runs LBPH face recognition.
    Returns dict: { "verified": bool, "confidence": float, "user_id": str }
    Closes camera after verification attempt.
    Timeout after 10 seconds if no face detected.
    
    Args:
        recognizer: cv2.face.LBPHFaceRecognizer trained model
        expected_user_id: Expected user ID to verify against
        confidence_threshold: Threshold for face match confidence
    
    Returns:
        dict with verified (bool), confidence (float), user_id (str), and optional error message
    """
    try:
        face_cascade_verify = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        cap_verify = cv2.VideoCapture(0)
        
        if not cap_verify.isOpened():
            return {
                "verified": False,
                "confidence": 0,
                "user_id": None,
                "error": "Cannot access camera"
            }
        
        start_time = time.time()
        timeout = 10  # 10 seconds timeout
        face_detected_frames = 0
        
        while True:
            current_time = time.time()
            if current_time - start_time > timeout:
                cap_verify.release()
                return {
                    "verified": False,
                    "confidence": 0,
                    "user_id": None,
                    "reason": "timeout"
                }
            
            ret, frame = cap_verify.read()
            if not ret:
                cap_verify.release()
                return {
                    "verified": False,
                    "confidence": 0,
                    "user_id": None,
                    "error": "Failed to capture frame"
                }
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade_verify.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) > 0:
                face_detected_frames += 1
                
                # Use the largest face
                (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])
                face_img = gray[y:y+h, x:x+w]
                face_img = cv2.resize(face_img, (200, 200))
                
                # Recognize face
                label, confidence = recognizer.predict(face_img)
                
                # After 3 stable frames with detection, return result
                if face_detected_frames >= 3:
                    cap_verify.release()
                    
                    # Check if confidence is within threshold (lower is better)
                    is_verified = confidence <= confidence_threshold
                    
                    return {
                        "verified": is_verified,
                        "confidence": float(confidence),
                        "user_id": str(label),
                        "expected_user_id": str(expected_user_id),
                        "match": str(label) == str(expected_user_id)
                    }
            else:
                face_detected_frames = 0
        
    except Exception as e:
        return {
            "verified": False,
            "confidence": 0,
            "user_id": None,
            "error": str(e)
        }

# ================== MAIN SCRIPT (Run directly only) ==================

if __name__ == "__main__":
    # Initialize webcam
    cap = cv2.VideoCapture(0)
    
    print("Collecting images. Press 'q' to quit.")
    
    count = 0
    user_id = input("Enter user ID: ")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
    
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
        for (x, y, w, h) in faces:
            face = gray[y:y+h, x:x+w]
            color_face = frame[y:y+h, x:x+w]
            
            # Detect eyes within the face region
            eyes = eye_cascade.detectMultiScale(face)
            
            # Draw rectangle around face
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            
            # Draw rectangles around eyes
            for (ex, ey, ew, eh) in eyes:
                cv2.rectangle(color_face, (ex, ey), (ex+ew, ey+eh), (0, 255, 0), 2)
            
            # Save face image
            if len(eyes) >= 2:  # Check if at least two eyes are detected
                face_filename = os.path.join(output_dir, f'user.{user_id}.{count}.jpg')
                cv2.imwrite(face_filename, face)
                print(f"Image {count} saved.")
                count += 1
    
        # Display the frame with face and eye detection
        cv2.imshow('Collecting Images', frame)
    
        # Break the loop if 'q' is pressed or if 10 images are collected
        if cv2.waitKey(1) & 0xFF == ord('q') or count >= 10:
            break
    
    cap.release()
    cv2.destroyAllWindows()

