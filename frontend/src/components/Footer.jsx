import { Shield, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="relative py-16 bg-gray-900 text-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>SecureVault</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">Biometric security. Zero passwords. Total peace of mind.</p>
          </div>
          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200 text-sm">Product</h4>
            <ul className="space-y-2.5 text-gray-400 text-sm">
              <li><Link to="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-blue-400 transition-colors">Pricing</Link></li>
              <li><Link to="/demo" className="hover:text-blue-400 transition-colors">Demo</Link></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Roadmap</a></li>
            </ul>
          </div>
          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200 text-sm">Company</h4>
            <ul className="space-y-2.5 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Terms</a></li>
            </ul>
          </div>
          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-gray-200 text-sm">Resources</h4>
            <ul className="space-y-2.5 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Support</a></li>
              <li><a href="https://github.com/meetshivam" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>
        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-xs mb-4 md:mb-0">© {new Date().getFullYear()} SecureVault. All rights reserved.</p>
          <div className="flex gap-2.5">
            {[
              { Icon: Github, url: 'https://github.com/meetshivam' },
              { Icon: Twitter, url: '#' },
              { Icon: Linkedin, url: 'https://www.linkedin.com/in/shivvam20/?skipRedirect=true' }
            ].map((item, i) => (
              <motion.a
                key={i}
                href={item.url}
                target={item.url !== '#' ? '_blank' : undefined}
                rel={item.url !== '#' ? 'noopener noreferrer' : undefined}
                className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-all duration-300"
                whileHover={{ scale: 1.15, rotate: 5 }}
              >
                <item.Icon className="w-4 h-4" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
