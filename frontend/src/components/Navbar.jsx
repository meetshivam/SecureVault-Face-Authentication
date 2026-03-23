import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const navLinks = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/features', label: 'Features' },
      ]
    : [
        { to: '/features', label: 'Features' },
        { to: '/pricing', label: 'Pricing' },
      ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-2xl py-3 shadow-lg border-b border-gray-200/50' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            SecureVault
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            >
              {l.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <button
              onClick={() => { logout(); window.location.href = '/'; }}
              className="px-5 py-2 border-2 border-gray-200 text-gray-700 rounded-full font-semibold text-sm hover:border-blue-300 hover:text-blue-600 transition-all"
            >
              Logout
            </button>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/register"
                className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium text-sm shadow-lg overflow-hidden inline-flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Launch App
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 mt-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
              >
                {l.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                onClick={() => { logout(); window.location.href = '/'; }}
                className="px-5 py-2 border-2 border-gray-200 text-gray-700 rounded-full font-semibold text-sm"
              >
                Logout
              </button>
            ) : (
              <Link to="/register" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium text-sm shadow-lg text-center">
                Launch App
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
