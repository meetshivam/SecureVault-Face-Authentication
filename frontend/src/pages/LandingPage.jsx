import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Zap, Eye, Lock, Key, ChevronDown, Brain, Database, Globe, FileCheck, Fingerprint, ArrowRight, CheckCircle2, Sparkles, Camera, Loader } from 'lucide-react';
import ParticleCanvas from '../components/ParticleCanvas';
import ScanRing from '../components/ScanRing';
import GlassCard from '../components/GlassCard';
import { useFaceDetection } from '../hooks/useFaceDetection';

export default function LandingPage() {
  const [counts, setCounts] = useState({ enc: 0, acc: 0, spd: 0 });
  const [scanningStep, setScanningStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroY = useTransform(scrollY, [0, 300], [0, 100]);
  
  const { isReady, error: faceError, isLoading, startWebcam, stopWebcam, captureFrame } = useFaceDetection(videoRef);

  /* Intersection-based counter */
  useEffect(() => {
    const el = document.getElementById('stats-bar');
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let s = 0;
        const t = setInterval(() => {
          s++;
          const p = s / 60;
          setCounts({ enc: Math.floor(256 * p), acc: Math.floor(9997 * p) / 100, spd: Math.floor(30 * p) / 100 });
          if (s >= 60) clearInterval(t);
        }, 33);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Scroll reveal */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0) scale(1)';
        }
      });
    }, { threshold: 0.15, rootMargin: '-80px' });
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(60px) scale(0.95)';
      el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Cleanup webcam on component unmount
  useEffect(() => {
    return () => {
      if (scanningStep > 0) {
        stopWebcam();
      }
    };
  }, [stopWebcam]);

  const startFaceScanDemo = async () => {
    if (isCapturing) return;
    setScanningStep(1);
    setDemoStatus('Initializing camera...');
    
    try {
      await startWebcam();
      setScanningStep(2);
      setDemoStatus('Detecting face...');
      
      // Simulate face detection with real frame capture
      setTimeout(async () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          if (isCapturing) return;
          setIsCapturing(true);
          setScanningStep(3);
          setDemoStatus('Analyzing biometrics...');
          
          // Capture frame
          const base64Image = captureFrame();
          if (!base64Image || base64Image.length < 1000) {
            setScanningStep(0);
            setDemoStatus('');
            setIsCapturing(false);
            stopWebcam();
            return;
          }
          
          // Simulate processing
          setTimeout(() => {
            setScanningStep(4);
            setDemoStatus('✓ Identity Verified');
            setIsCapturing(false);
            stopWebcam();
            
            // Reset after 2 seconds
            setTimeout(() => {
              setScanningStep(0);
              setDemoStatus('');
            }, 2000);
          }, 800);
        }
      }, 1500);
    } catch (err) {
      setScanningStep(0);
      setDemoStatus('Camera error. Please check permissions.');
      setIsCapturing(false);
    }
  };
  
  const resetDemo = () => {
    if (scanningStep > 0) {
      stopWebcam();
    }
    setScanningStep(0);
    setDemoStatus('');
    setIsCapturing(false);
  };

  const steps = [
    { icon: Eye, title: 'Register Your Face', desc: 'One-time biometric scan. Encrypted locally. Never leaves your device.', color: 'from-blue-500 to-indigo-500' },
    { icon: Lock, title: 'Instant Access', desc: 'Facial recognition unlocks your vault in under 0.3 seconds.', color: 'from-indigo-500 to-violet-500' },
    { icon: Key, title: 'Verify Every Time', desc: 'Zero-trust architecture re-authenticates each credential reveal.', color: 'from-violet-500 to-purple-500' },
  ];

  const features = [
    { icon: Brain, title: 'AI Liveness Detection', desc: 'Real-time deepfake detection rejects photos, videos, and spoofing attempts', gradient: 'from-blue-500 to-indigo-500' },
    { icon: Key, title: 'Zero Master Password', desc: 'Your biometric signature is the only key—nothing to remember or steal', gradient: 'from-indigo-500 to-violet-500' },
    { icon: Database, title: 'Zero-Knowledge Vault', desc: 'End-to-end encryption means we can never access your data', gradient: 'from-violet-500 to-purple-500' },
    { icon: Globe, title: 'Cross-Device Sync', desc: 'Access your vault across all devices with facial authentication', gradient: 'from-emerald-500 to-teal-500' },
    { icon: Shield, title: 'Breach Monitoring', desc: 'Real-time alerts when credentials appear in data breaches', gradient: 'from-orange-500 to-red-500' },
    { icon: FileCheck, title: 'Complete Audit Trail', desc: 'Every vault access logged with timestamp and device info', gradient: 'from-pink-500 to-rose-500' },
  ];

  const plans = [
    { name: 'Starter', price: '₹0', period: '/forever', features: ['10 passwords', '1 device', 'Basic security', 'Email support'], cta: 'Get Started', highlight: false },
    { name: 'Professional', price: '₹299', period: '/month', features: ['Unlimited passwords', '5 devices', 'Breach monitoring', 'Priority support', 'Audit logs'], cta: 'Start Free Trial', highlight: true },
    { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'Unlimited devices', 'Dedicated support', 'Custom integrations', 'SLA guarantee'], cta: 'Contact Sales', highlight: false },
  ];

  const testimonials = [
    { text: 'Finally ditched LastPass. SecureVault is genuinely the future of password management.', author: 'Riya Mehta', role: 'Senior DevOps Engineer' },
    { text: 'The face scan is insanely fast. My vault opens in under 0.2 seconds every single time.', author: 'Arjun Thakur', role: 'Startup Founder' },
    { text: 'Zero-knowledge encryption + facial authentication = I actually sleep better at night now.', author: 'Priya Sharma', role: 'Cybersecurity Analyst' },
  ];

  const securityItems = [
    { icon: Shield, text: 'AES-256 encrypted vault at rest' },
    { icon: Lock, text: 'Face embeddings never leave your device' },
    { icon: Database, text: 'End-to-end encrypted sync' },
    { icon: FileCheck, text: 'GDPR & SOC2 compliant' },
    { icon: Zap, text: 'Auto-lock on inactivity' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50" />
      <ParticleCanvas />

      {/* ─── HERO ─── */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center pt-24 pb-20 bg-gradient-to-b from-white via-blue-50/20 to-white"
        style={{ opacity: heroOpacity, y: heroY }}
      >
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-semibold mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Sparkles className="w-3 h-3" /> Next-Gen Biometric Security
            </motion.div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Your Face Is
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">Your Password</span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 mb-10 leading-relaxed max-w-xl">
              Military-grade facial recognition meets zero-knowledge encryption. Secure your passwords without remembering a single one.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(59, 130, 246, 0.4)' }} whileTap={{ scale: 0.96 }}>
                <Link to="/register" className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold text-base shadow-xl overflow-hidden button-magnetic ripple-effect inline-flex items-center justify-center gap-2">
                  <span className="relative z-10 flex items-center gap-2">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="relative h-[500px] lg:h-[600px] w-full flex items-center justify-center"
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-3xl blur-3xl" />
            <ScanRing />
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-7 h-7 text-gray-400" />
        </motion.div>
      </motion.section>

      {/* ─── STATS ─── */}
      <section id="stats-bar" className="relative py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            {[
              { icon: Shield, value: `${counts.enc}-bit`, label: 'AES Encryption' },
              { icon: Fingerprint, value: `${counts.acc}%`, label: 'Face Match Accuracy' },
              { icon: Zap, value: `<${counts.spd}s`, label: 'Authentication Speed' },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="animate-on-scroll"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
              >
                <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <s.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl md:text-6xl font-bold text-white mb-2">{s.value}</div>
                <div className="text-blue-100 font-medium text-sm">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative py-32 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-5 uppercase tracking-wide">Simple Process</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Three Steps to Security
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">Passwordless authentication in seconds</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="group relative bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-blue-300 hover:shadow-2xl transition-all duration-500 animate-on-scroll"
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-400`}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">Step {i + 1}</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{step.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Learn more <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-semibold mb-5 uppercase tracking-wide">Core Features</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Enterprise Security,
              <br />Consumer Simplicity
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">Advanced protection without complexity</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="group relative bg-white border border-gray-200 rounded-2xl p-7 hover:border-blue-200 hover:shadow-2xl transition-all duration-500 overflow-hidden animate-on-scroll"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className={`relative inline-flex w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl items-center justify-center mb-5 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-400`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="relative text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="relative text-gray-600 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE DEMO ─── */}
      <section className="relative py-32 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold mb-5 uppercase tracking-wide">Live Demo</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Try It Yourself
            </h2>
          </motion.div>

          <motion.div
            className="max-w-md mx-auto bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200 rounded-3xl p-8 shadow-2xl animate-on-scroll"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative w-64 h-64 mx-auto mb-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl overflow-hidden shadow-xl">
              {scanningStep === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600">
                  <Fingerprint className="w-32 h-32 text-white/90" />
                </div>
              )}
              
              {scanningStep > 0 && (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-6 border-4 border-white/40 rounded-full pointer-events-none" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                </>
              )}
              
              {isLoading && scanningStep > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-600/50">
                  <Loader className="w-12 h-12 text-white animate-spin" />
                </div>
              )}
              
              {scanningStep === 4 && (
                <motion.div
                  className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <CheckCircle2 className="w-20 h-20 text-white" />
                </motion.div>
              )}
            </div>

            <div className="text-center mb-6 h-7">
              <motion.p
                key={scanningStep}
                className="text-base font-semibold text-gray-900"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {faceError && <span className="text-red-600">{faceError}</span>}
                {!faceError && (
                  <>
                    {scanningStep === 0 && 'Ready to authenticate'}
                    {scanningStep === 1 && 'Initializing camera...'}
                    {scanningStep === 2 && 'Detecting face...'}
                    {scanningStep === 3 && 'Analyzing biometrics...'}
                    {scanningStep === 4 && '✓ Identity Verified'}
                  </>
                )}
              </motion.p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-8 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                initial={{ width: '0%' }}
                animate={{ width: `${(scanningStep / 4) * 100}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <motion.button
              onClick={() => scanningStep === 0 ? startFaceScanDemo() : resetDemo()}
              disabled={isCapturing || isLoading}
              className="group relative w-full px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-base shadow-xl overflow-hidden button-magnetic ripple-effect disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {scanningStep === 0 ? (
                  <>Start Demo Preview <Eye className="w-5 h-5" /></>
                ) : scanningStep === 4 ? (
                  <>Try Full Demo <ArrowRight className="w-5 h-5" /></>
                ) : (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {isCapturing ? 'Capturing...' : 'Scanning...'}
                  </>
                )}
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section className="relative py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-1.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold mb-5 uppercase tracking-wide">Security First</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Bank-Level Protection,
                <br />Zero Compromises
              </h2>
              <div className="space-y-4">
                {securityItems.map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3 animate-on-scroll"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-base text-gray-700 mt-1">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative w-full h-[500px] flex items-center justify-center animate-on-scroll"
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute border-2 rounded-2xl"
                    style={{
                      width: `${180 + i * 55}px`,
                      height: `${180 + i * 55}px`,
                      borderColor: i % 2 === 0 ? 'rgb(59, 130, 246)' : 'rgb(99, 102, 241)',
                      opacity: 0.2 - i * 0.03,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25 + i * 5, repeat: Infinity, ease: 'linear' }}
                  />
                ))}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl flex items-center justify-center">
                  <Shield className="w-20 h-20 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="relative py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-24"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold mb-5 uppercase tracking-wide">Pricing</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">Choose the plan that fits your needs</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                className={`relative bg-white border-2 rounded-2xl p-8 transition-all duration-500 animate-on-scroll ${plan.highlight ? 'border-blue-600 shadow-2xl scale-105' : 'border-gray-200 hover:border-blue-200 hover:shadow-xl'}`}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                whileHover={{ y: -8 }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-xs font-semibold shadow-lg pulse-glow">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-3 text-gray-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-base text-gray-500">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/register"
                    className={`group relative w-full px-6 py-3 rounded-xl font-semibold text-sm transition-all overflow-hidden shadow-lg button-magnetic block text-center ${plan.highlight ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold mb-5 uppercase tracking-wide">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Trusted by Professionals
            </h2>
          </motion.div>
          <div className="relative overflow-hidden">
            <div className="flex ticker">
              {[0, 1].map(setIndex => (
                <div key={setIndex} className="flex gap-5 px-2.5">
                  {testimonials.map((t, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-2xl p-7 min-w-[300px] md:min-w-[400px] shadow-md hover:shadow-xl transition-all duration-500">
                      <p className="text-base mb-5 text-gray-700 leading-relaxed">"{t.text}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base">
                          {t.author[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                          <p className="text-xs text-gray-500">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white tracking-tight leading-[1.1]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Ready to Go Passwordless?
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join 50,000+ users securing their digital lives with biometric authentication. Start free—no credit card required.
            </p>
            <motion.div
              whileHover={{ scale: 1.06, boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)' }}
              whileTap={{ scale: 0.96 }}
              className="inline-block"
            >
              <Link to="/register" className="group relative px-12 py-5 bg-white text-blue-600 rounded-2xl font-bold text-lg shadow-2xl overflow-hidden button-magnetic inline-flex items-center gap-3">
                <span className="relative z-10 flex items-center gap-3">
                  Start Free Trial
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </motion.span>
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
