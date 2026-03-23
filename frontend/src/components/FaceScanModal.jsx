import { useState, useRef, useEffect } from 'react';
import { Camera, AlertTriangle, Loader, CheckCircle, XCircle } from 'lucide-react';
import { useFaceDetection } from '../hooks/useFaceDetection';
import './FaceScanModal.css';

/**
 * FaceScanModal Component
 * 
 * Displays:
 * - Real-time webcam video feed with face detection visualization
 * - Status messages and error messages
 * - Capture button with loading state
 * - Timeout countdown and retry logic
 * - Feedback animations
 * 
 * Props:
 * - isOpen: boolean - whether modal is visible
 * - onCapture: function(base64Image) - callback when face is captured
 * - onClose: function() - callback when modal closes
 * - email: string - user email for logging
 * - status: string - current status ('idle' | 'loading' | 'success' | 'error')
 * - error: string - error message to display
 * - timeout: number - timeout in seconds (default: 30)
 * - onTimeout: function() - callback when timeout is reached
 */

export default function FaceScanModal({
  isOpen,
  onCapture,
  onClose,
  email = '',
  status = 'idle',
  error: externalError = '',
  timeout = 30,
  onTimeout
}) {
  const videoRef = useRef(null);
  const [localError, setLocalError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(timeout);
  const [isCapturing, setIsCapturing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const {
    isReady,
    error: hookError,
    isLoading: hookLoading,
    startWebcam,
    stopWebcam,
    captureFrame
  } = useFaceDetection(videoRef);

  // Show external errors
  const displayError = externalError || hookError || localError;

  /**
   * Initialize webcam when modal opens
   */
  useEffect(() => {
    if (isOpen && !isReady) {
      setFeedbackMessage('Initializing camera...');
      setLocalError('');
      setTimeRemaining(timeout);
      startWebcam();
    }

    return () => {
      if (!isOpen) {
        stopWebcam();
      }
    };
  }, [isOpen, isReady, startWebcam, stopWebcam, timeout]);

  /**
   * Countdown timer for timeout
   */
  useEffect(() => {
    if (!isOpen || !isReady || status === 'success' || status === 'error') return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          stopWebcam();
          setLocalError('Face scan timeout. Please try again.');
          onTimeout?.();
          return timeout;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isReady, status, timeout, stopWebcam, onTimeout]);

  /**
   * Handle face capture and send to backend
   */
  const handleCapture = async () => {
    if (isCapturing || !isReady) return;

    setIsCapturing(true);
    setFeedbackMessage('Capturing face...');
    setLocalError('');

    try {
      const base64Image = captureFrame();

      if (!base64Image) {
        throw new Error('Failed to capture image from camera');
      }

      // Validate image size (shouldn't be empty)
      if (base64Image.length < 1000) {
        throw new Error('Captured image is invalid. Please try again.');
      }

      setFeedbackMessage('Processing face data...');
      await onCapture(base64Image);
      setFeedbackMessage('Face captured successfully!');
    } catch (err) {
      setLocalError(err.message || 'Failed to capture face. Please try again.');
      console.error('[FaceScanModal] Capture error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    stopWebcam();
    setLocalError('');
    setFeedbackMessage('');
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="face-scan-modal-overlay">
      <div className="face-scan-modal-container">
        {/* Header */}
        <div className="face-scan-modal-header">
          <h2>Face Scan Verification</h2>
          <button
            onClick={handleClose}
            className="face-scan-modal-close"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="face-scan-modal-content">
          {/* Webcam Feed Container */}
          <div className="face-scan-video-container">
            {hookLoading && (
              <div className="face-scan-loading-overlay">
                <Loader className="face-scan-spinner" />
                <p>Initializing camera...</p>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="face-scan-video"
            />

            {/* Face Detection Frame */}
            {isReady && !hookLoading && (
              <>
                <div className="face-scan-frame-border" />
                <div className="face-scan-frame-guide">
                  <div className="face-scan-corner face-scan-corner-tl" />
                  <div className="face-scan-corner face-scan-corner-tr" />
                  <div className="face-scan-corner face-scan-corner-bl" />
                  <div className="face-scan-corner face-scan-corner-br" />
                </div>
              </>
            )}

            {/* Status Overlay */}
            {status === 'loading' && (
              <div className="face-scan-status-overlay loading">
                <Loader className="face-scan-status-icon" />
                <p>Verifying face...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="face-scan-status-overlay success">
                <CheckCircle className="face-scan-status-icon" />
                <p>Face verified!</p>
              </div>
            )}

            {status === 'error' && (
              <div className="face-scan-status-overlay error">
                <XCircle className="face-scan-status-icon" />
                <p>Face verification failed</p>
              </div>
            )}
          </div>

          {/* Status Messages */}
          <div className="face-scan-status-section">
            {/* Feedback Message */}
            {feedbackMessage && !displayError && (
              <div className="face-scan-message info">
                <p>{feedbackMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {displayError && (
              <div className="face-scan-message error">
                <AlertTriangle className="face-scan-message-icon" />
                <div>
                  <p className="face-scan-error-title">Error</p>
                  <p className="face-scan-error-text">{displayError}</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!displayError && isReady && status === 'idle' && (
              <div className="face-scan-message instruction">
                <p>Position your face within the frame and click "Capture & Verify"</p>
              </div>
            )}

            {/* Timer */}
            {isReady && status === 'idle' && !displayError && (
              <div className="face-scan-timer">
                <div
                  className="face-scan-timer-bar"
                  style={{ width: `${(timeRemaining / timeout) * 100}%` }}
                />
                <p>Time remaining: <span>{timeRemaining}s</span></p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="face-scan-actions">
            {status === 'idle' && (
              <>
                <button
                  onClick={handleCapture}
                  disabled={!isReady || isCapturing || hookLoading}
                  className="face-scan-button primary"
                >
                  <Camera className="w-5 h-5" />
                  {isCapturing ? 'Capturing...' : 'Capture & Verify'}
                </button>
                <button
                  onClick={handleClose}
                  className="face-scan-button secondary"
                >
                  Cancel
                </button>
              </>
            )}

            {status === 'loading' && (
              <div className="face-scan-loading-text">Please wait...</div>
            )}

            {status === 'success' && (
              <button
                onClick={handleClose}
                className="face-scan-button primary"
              >
                Continue
              </button>
            )}

            {status === 'error' && (
              <>
                <button
                  onClick={() => setLocalError('')}
                  className="face-scan-button primary"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="face-scan-button secondary"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Debug Info (Remove in production) */}
        {process.env.NODE_ENV === 'development' && email && (
          <div className="face-scan-debug-info">
            Email: {email} | Status: {status} | Time: {timeRemaining}s
          </div>
        )}
      </div>
    </div>
  );
}
