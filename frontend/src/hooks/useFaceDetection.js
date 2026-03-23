import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing face detection webcam stream and frame capture.
 * Handles:
 * - Requesting and managing camera permissions
 * - Starting/stopping webcam stream
 * - Capturing video frames as base64 images
 * - Proper cleanup on unmount
 * 
 * Usage:
 * const { 
 *   isReady, 
 *   error, 
 *   startWebcam, 
 *   stopWebcam, 
 *   captureFrame 
 * } = useFaceDetection(videoRef);
 */

export function useFaceDetection(videoRef) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef(null);

  /**
   * Initialize and start webcam stream
   */
  const startWebcam = useCallback(async (constraints = {}) => {
    try {
      setIsLoading(true);
      setError('');

      const defaultConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false,
        ...constraints
      };

      const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
      streamRef.current = stream;

      if (videoRef?.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const checkReady = () => {
            if (videoRef.current?.readyState === 4) {
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
          setTimeout(() => reject(new Error('Video timeout')), 5000);
        });
      }

      setIsReady(true);
      return stream;
    } catch (err) {
      let errorMsg = 'Failed to access camera';

      if (err.name === 'NotAllowedError') {
        errorMsg = 'Camera access denied. Please allow camera permissions in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera device found on this computer.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = 'Your device camera does not support the required resolution.';
      } else if (err.message === 'Video timeout') {
        errorMsg = 'Camera failed to initialize. Please try again.';
      }

      setError(errorMsg);
      setIsReady(false);
      console.error('[useFaceDetection] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [videoRef]);

  /**
   * Stop webcam stream and cleanup
   */
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef?.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
    setError('');
  }, [videoRef]);

  /**
   * Capture current video frame as base64 image
   * Returns base64 string or null if capture fails
   */
  const captureFrame = useCallback(() => {
    const video = videoRef?.current;
    if (!video || !isReady) {
      setError('Camera not ready for capture');
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (canvas.width === 0 || canvas.height === 0) {
        setError('Failed to capture frame - invalid video dimensions');
        return null;
      }

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Return base64 encoded image
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      return base64;
    } catch (err) {
      setError('Failed to capture frame: ' + err.message);
      console.error('[useFaceDetection] Capture error:', err);
      return null;
    }
  }, [videoRef, isReady]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return {
    isReady,
    error,
    isLoading,
    startWebcam,
    stopWebcam,
    captureFrame,
    videoRef
  };
}
