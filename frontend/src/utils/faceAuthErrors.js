/**
 * Face Authentication Error Utilities
 * Centralized error handling for face scan login flow
 */

/**
 * Specific error types for face authentication
 */
export const FaceAuthErrors = {
  CAMERA_NOT_ALLOWED: {
    code: 'CAMERA_NOT_ALLOWED',
    message: 'Camera access denied. Please allow camera permissions in your browser settings.',
    recoveryAction: 'Allow camera in browser settings'
  },
  CAMERA_NOT_FOUND: {
    code: 'CAMERA_NOT_FOUND',
    message: 'No camera device found on this computer.',
    recoveryAction: 'Check that a camera is connected'
  },
  CAMERA_IN_USE: {
    code: 'CAMERA_IN_USE',
    message: 'Camera is already in use by another application.',
    recoveryAction: 'Close other applications using the camera'
  },
  CAMERA_NOT_READABLE: {
    code: 'CAMERA_NOT_READABLE',
    message: 'Camera failed to initialize. Please try again.',
    recoveryAction: 'Refresh the page and try again'
  },
  FACE_NOT_DETECTED: {
    code: 'FACE_NOT_DETECTED',
    message: 'No face detected in image. Please position your face clearly in the frame.',
    recoveryAction: 'Move closer and ensure good lighting'
  },
  MULTIPLE_FACES: {
    code: 'MULTIPLE_FACES',
    message: 'Multiple faces detected. Please ensure only you are in the frame.',
    recoveryAction: 'Remove other people from background'
  },
  FACE_NOT_RECOGNIZED: {
    code: 'FACE_NOT_RECOGNIZED',
    message: 'Face does not match. Access denied.',
    recoveryAction: 'Try with better lighting or different angle'
  },
  FACE_SCAN_TIMEOUT: {
    code: 'FACE_SCAN_TIMEOUT',
    message: 'Face scan timed out. Please try again.',
    recoveryAction: 'Start a new scan'
  },
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Please enter a valid email address.',
    recoveryAction: 'Correct the email format'
  },
  INVALID_PASSWORD: {
    code: 'INVALID_PASSWORD',
    message: 'Password must be at least 6 characters.',
    recoveryAction: 'Enter a stronger password'
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    message: 'User account not found.',
    recoveryAction: 'Check email or register a new account'
  },
  FACE_NOT_ENROLLED: {
    code: 'FACE_NOT_ENROLLED',
    message: 'Face not enrolled. Please register with face scan first.',
    recoveryAction: 'Go to registration and enroll your face'
  },
  CREDENTIALS_INVALID: {
    code: 'CREDENTIALS_INVALID',
    message: 'Email or password is incorrect.',
    recoveryAction: 'Check your credentials and try again'
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network error. Please check your connection.',
    recoveryAction: 'Check internet connection and retry'
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Server error. Please try again later.',
    recoveryAction: 'Contact support if problem persists'
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred.',
    recoveryAction: 'Try again or contact support'
  }
};

/**
 * Map camera error names to our error types
 */
export function getCameraErrorType(err) {
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return FaceAuthErrors.CAMERA_NOT_ALLOWED;
  }
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return FaceAuthErrors.CAMERA_NOT_FOUND;
  }
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return FaceAuthErrors.CAMERA_IN_USE;
  }
  if (err.name === 'OverconstrainedError') {
    return FaceAuthErrors.CAMERA_NOT_READABLE;
  }
  return FaceAuthErrors.UNKNOWN_ERROR;
}

/**
 * Map API error responses to our error types
 */
export function getApiErrorType(error) {
  if (!error) return FaceAuthErrors.UNKNOWN_ERROR;

  const errorMsg = error.error || error.message || '';
  const lowerMsg = errorMsg.toLowerCase();

  if (lowerMsg.includes('email') && lowerMsg.includes('not found')) {
    return FaceAuthErrors.USER_NOT_FOUND;
  }
  if (lowerMsg.includes('password') && lowerMsg.includes('invalid')) {
    return FaceAuthErrors.CREDENTIALS_INVALID;
  }
  if (lowerMsg.includes('face') && lowerMsg.includes('not enrolled')) {
    return FaceAuthErrors.FACE_NOT_ENROLLED;
  }
  if (lowerMsg.includes('face') && lowerMsg.includes('not match')) {
    return FaceAuthErrors.FACE_NOT_RECOGNIZED;
  }
  if (lowerMsg.includes('no face')) {
    return FaceAuthErrors.FACE_NOT_DETECTED;
  }
  if (lowerMsg.includes('multiple faces')) {
    return FaceAuthErrors.MULTIPLE_FACES;
  }
  if (error.status === 404) {
    return FaceAuthErrors.USER_NOT_FOUND;
  }
  if (error.status === 401) {
    return FaceAuthErrors.CREDENTIALS_INVALID;
  }
  if (error.status >= 500) {
    return FaceAuthErrors.SERVER_ERROR;
  }

  return FaceAuthErrors.UNKNOWN_ERROR;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, error: FaceAuthErrors.INVALID_PASSWORD.message };
  }
  return { valid: true, error: null };
}

/**
 * Format confidence percentage for display
 */
export function formatConfidence(confidence) {
  if (confidence === null || confidence === undefined) return 'N/A';
  return `${Math.round(confidence)}%`;
}

/**
 * Get matching status based on confidence
 */
export function getMatchStatus(confidence, threshold = 75) {
  if (confidence === null) return 'pending';
  if (confidence >= threshold) return 'matched';
  if (confidence >= threshold - 25) return 'partial';
  return 'not_matched';
}

/**
 * Log face authentication event
 */
export function logFaceAuthEvent(event, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...data
  };

  console.log(`[Face Auth] ${event}:`, logEntry);

  // Could send to analytics service
  // analytics.track('face_auth_event', logEntry);
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error, context = 'general') {
  if (typeof error === 'string') {
    return error;
  }

  if (error.code && FaceAuthErrors[error.code]) {
    return FaceAuthErrors[error.code].message;
  }

  if (error.error) {
    return error.error;
  }

  if (error.message) {
    return error.message;
  }

  return FaceAuthErrors.UNKNOWN_ERROR.message;
}

/**
 * Get recovery action for error
 */
export function getRecoveryAction(error) {
  if (error.code && FaceAuthErrors[error.code]) {
    return FaceAuthErrors[error.code].recoveryAction;
  }
  return 'Try again or contact support';
}
