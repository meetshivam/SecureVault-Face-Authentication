import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Mail, Lock, ShieldCheck, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import FaceScanModal from './FaceScanModal';

/**
 * FaceScanLogin Component
 * 
 * Complete login flow with:
 * 1. Email + Password validation
 * 2. Face scan modal with webcam and face detection
 * 3. Face verification against stored face encoding
 * 4. JWT token-based session management
 * 5. Error handling and retry logic
 */

export default function FaceScanLogin() {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Flow state
  const [step, setStep] = useState('credentials'); // credentials | face | result
  const [faceScanStatus, setFaceScanStatus] = useState('idle'); // idle | loading | success | error

  // Error and feedback
  const [credentialsError, setCredentialsError] = useState('');
  const [faceError, setFaceError] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [confidence, setConfidence] = useState(null);

  // Modal state
  const [isFaceScanOpen, setIsFaceScanOpen] = useState(false);

  // Navigation and auth
  const navigate = useNavigate();
  const { login } = useAuth();

  /**
   * Validate email format
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle credentials form submission
   */
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setCredentialsError('');

    if (!email.trim()) { setCredentialsError('Email is required'); return; }
    if (!isValidEmail(email)) { setCredentialsError('Please enter a valid email address'); return; }
    if (!password) { setCredentialsError('Password is required'); return; }
    if (password.length < 6) { setCredentialsError('Password must be at least 6 characters'); return; }

    try {
      const response = await api.loginEmail({
        email: email.toLowerCase().trim(),
        password
      });

      if (response.success) {
        setStep('face');
        setFaceScanStatus('idle');
        setFaceError('');
        setConfidence(null);
        setTimeout(() => setIsFaceScanOpen(true), 300);
      }
    } catch (err) {
      console.error('[FaceScanLogin] Credentials error:', err);
      setCredentialsError(err.error || err.message || 'Login failed. Please check your email and password.');
    }
  };

  /**
   * Handle face capture from modal
   */
  const handleFaceCapture = async (base64Image) => {
    setFaceScanStatus('loading');
    setFaceError('');

    try {
      const response = await api.loginFace({
        email: email.toLowerCase().trim(),
        face_image: base64Image
      });

      if (response.success && response.token) {
        setConfidence(response.match_confidence);
        login(response.user_data, response.token);
        setFaceScanStatus('success');
        setResultMessage('Face verified! Redirecting to vault...');

        setTimeout(() => {
          setIsFaceScanOpen(false);
          setStep('result');
          setTimeout(() => { navigate('/dashboard'); }, 1500);
        }, 800);
      }
    } catch (err) {
      console.error('[FaceScanLogin] Face verification error:', err);
      setConfidence(err.match_confidence || null);
      setFaceScanStatus('error');
      setFaceError(err.error || err.message || 'Face verification failed. Please try again.');
      setTimeout(() => { setFaceScanStatus('idle'); setFaceError(''); }, 2000);
    }
  };

  const handleFaceScanTimeout = () => {
    setFaceScanStatus('error');
    setFaceError('Face scan timed out. Please try again.');
    setTimeout(() => { setFaceScanStatus('idle'); setFaceError(''); }, 2000);
  };

  const handleFaceScanClose = () => {
    setIsFaceScanOpen(false);
    setTimeout(() => { setStep('credentials'); setFaceScanStatus('idle'); setFaceError(''); }, 300);
  };

  const handleRetryFace = () => {
    setFaceError('');
    setFaceScanStatus('idle');
    setIsFaceScanOpen(true);
  };

  const handleRestart = () => {
    setStep('credentials');
    setEmail('');
    setPassword('');
    setCredentialsError('');
    setFaceError('');
    setResultMessage('');
    setConfidence(null);
    setFaceScanStatus('idle');
  };

  const inputClass = 'w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all';

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white flex items-center justify-center pt-20 pb-16 px-6">
        <motion.div
          className="max-w-md w-full bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Eye className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Welcome Back
          </h1>
          <p className="text-gray-500 text-center mb-8 text-sm">
            Secure login with email and face verification
          </p>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['Credentials', 'Face Scan', 'Complete'].map((label, idx) => {
              const steps = ['credentials', 'face', 'result'];
              const currentIdx = steps.indexOf(step);
              const isActive = idx <= currentIdx;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                    {idx + 1}
                  </div>
                  <span className={`text-xs hidden sm:inline transition-colors ${isActive ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{label}</span>
                  {idx < 2 && <div className={`w-8 h-0.5 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Credentials */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email" required placeholder="Email address" value={email}
                  onChange={(e) => { setEmail(e.target.value); setCredentialsError(''); }}
                  className={inputClass}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} required placeholder="Password" value={password}
                  onChange={(e) => { setPassword(e.target.value); setCredentialsError(''); }}
                  className={`${inputClass} pr-11`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Toggle password visibility">
                  {showPassword ? '👁' : '👁‍🗨'}
                </button>
              </div>
              {credentialsError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{credentialsError}</p>
                </div>
              )}
              <motion.button type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-lg flex items-center justify-center gap-2"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              >
                Proceed with Face Scan <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>
          )}

          {/* Step 2: Face Scan (Placeholder) */}
          {step === 'face' && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                  <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-900 font-semibold mb-2">Face Scan Verification</p>
                <p className="text-gray-500 text-sm mb-4">Click the button below to open the face scan modal</p>
                {faceError && (
                  <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /><p>{faceError}</p>
                  </div>
                )}
                {faceScanStatus === 'success' && confidence !== null && (
                  <div className="mb-4 flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 text-sm">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><p>Face verified with {confidence}% confidence</p>
                  </div>
                )}
              </div>
              <motion.button onClick={() => setIsFaceScanOpen(true)} disabled={faceScanStatus === 'loading'}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-lg disabled:opacity-50"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              >
                {faceScanStatus === 'loading' ? 'Verifying...' : 'Open Face Scan'}
              </motion.button>
              <button onClick={handleFaceScanClose}
                className="w-full py-3 bg-gray-50 text-gray-600 border border-gray-200 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                Cancel
              </button>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 'result' && (
            <div className="text-center py-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${faceScanStatus === 'success' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                {faceScanStatus === 'success' ? (
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                )}
              </div>
              <p className={`text-lg font-semibold mb-2 ${faceScanStatus === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {faceScanStatus === 'success' ? '✅ Authentication Successful!' : '❌ Authentication Failed'}
              </p>
              {resultMessage && <p className="text-gray-500 text-sm mb-4">{resultMessage}</p>}
              {confidence !== null && (
                <p className="text-gray-400 text-xs mb-4">
                  Match confidence: <span className={faceScanStatus === 'success' ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>{confidence}%</span>
                </p>
              )}
              {faceScanStatus !== 'success' && (
                <div className="flex gap-2">
                  <motion.button onClick={handleRetryFace}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold text-sm shadow-lg"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                  >Try Again</motion.button>
                  <button onClick={handleRestart}
                    className="flex-1 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors"
                  >Restart</button>
                </div>
              )}
            </div>
          )}

          {/* Footer Link */}
          <p className="text-gray-500 text-center mt-8 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">Sign Up</Link>
          </p>
        </motion.div>
      </div>

      {/* Face Scan Modal */}
      <FaceScanModal
        isOpen={isFaceScanOpen}
        onCapture={handleFaceCapture}
        onClose={handleFaceScanClose}
        email={email}
        status={faceScanStatus}
        error={faceError}
        timeout={30}
        onTimeout={handleFaceScanTimeout}
      />
    </>
  );
}
