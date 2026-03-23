import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Mail, Lock, User, Camera, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [step, setStep] = useState('signup'); // signup | face | done
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [capturing, setCapturing] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // Step 1: Create account form
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (!form.name || !form.email || !form.password) {
        setError('All fields are required');
        return;
      }
      setStep('face');
      setStatus('Look at the camera and click "Capture Face" to register.');
      setTimeout(() => startWebcam(), 100);
    } catch (err) {
      setError(err.error || 'Signup failed');
    }
  };

  // Step 2: Capture face and complete signup
  const handleCaptureFace = async () => {
    setError('');
    setCapturing(true);
    try {
      const base64Image = captureFrame();
      if (!base64Image) {
        setError('Failed to capture image from camera');
        setCapturing(false);
        return;
      }

      stopWebcam();

      await api.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        face_image: base64Image
      });

      setStep('done');
      setStatus('✅ Account created with face enrolled!');
    } catch (err) {
      setError(err.error || 'Registration failed');
      setTimeout(() => startWebcam(), 100);
    } finally {
      setCapturing(false);
    }
  };

  const inputClass = 'w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white flex items-center justify-center pt-20 pb-16 px-6">
      <motion.div
        className="max-w-md w-full bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Eye className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Create Account</h1>

        {/* Progress — 2 steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Sign Up', 'Face Scan'].map((s, i) => {
            const stepIdx = ['signup', 'face', 'done'].indexOf(step);
            const active = i <= (stepIdx === 0 ? 0 : 1);
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                  {i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${active ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s}</span>
                {i < 1 && <div className={`w-8 h-0.5 ${active ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Signup Form */}
        {step === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" required placeholder="Full name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" required placeholder="Email address" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="password" required placeholder="Password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <motion.button type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-lg flex items-center justify-center gap-2"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            >
              Continue to Face Scan <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>
        )}

        {/* Step 2: Face Capture */}
        {step === 'face' && (
          <div className="text-center">
            <div className="relative w-full max-w-xs mx-auto mb-4 border-4 border-blue-500 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 aspect-square">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-6 border-4 border-white/40 rounded-full pointer-events-none" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <p className="text-blue-600 font-semibold text-sm mb-4">{status}</p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <motion.button
              onClick={handleCaptureFace} disabled={capturing}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            >
              <Camera className="w-5 h-5" />
              {capturing ? 'Processing…' : '📸 Capture Face'}
            </motion.button>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <p className="text-lg font-semibold text-blue-600">{status}</p>
            <motion.button onClick={() => navigate('/login')}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold shadow-lg"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            >Go to Login</motion.button>
          </div>
        )}

        <p className="text-gray-500 text-center mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
