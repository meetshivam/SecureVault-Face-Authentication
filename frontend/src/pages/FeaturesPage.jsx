import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Key, Brain, Database, Globe, FileCheck, Zap } from 'lucide-react';

const features = [
  { icon: Eye, title: 'Facial Recognition', desc: 'Advanced LBPH face recognition with multi-angle enrollment for maximum accuracy.', gradient: 'from-blue-500 to-indigo-500' },
  { icon: Lock, title: 'Encrypted Vault', desc: 'AES-256 encryption protects every password stored in your vault.', gradient: 'from-blue-600 to-indigo-600' },
  { icon: Shield, title: 'Zero-Knowledge', desc: 'We never see your passwords. Decryption happens only when you authenticate.', gradient: 'from-indigo-500 to-violet-500' },
  { icon: Brain, title: 'AI-Powered', desc: 'Machine learning models adapt to changes in your appearance over time.', gradient: 'from-violet-500 to-purple-500' },
  { icon: FileCheck, title: 'PDF Vault', desc: 'Store and encrypt sensitive documents with face or password protection.', gradient: 'from-emerald-500 to-teal-500' },
  { icon: Database, title: 'Audit Trail', desc: 'Full activity log of every login, access, and modification.', gradient: 'from-orange-500 to-red-500' },
  { icon: Globe, title: 'Cross-Platform', desc: 'Access your vault from any device with a camera and browser.', gradient: 'from-pink-500 to-rose-500' },
  { icon: Key, title: 'Multi-Factor', desc: 'Combine face authentication with passwords for dual-factor security.', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Zap, title: 'Instant Access', desc: 'Authentication completes in under 0.3 seconds on average.', gradient: 'from-amber-500 to-orange-500' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white pt-28 pb-16">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-5 uppercase tracking-wide">Platform Features</span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Features</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Everything you need to secure your digital life with biometric authentication.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="group bg-white border border-gray-200 rounded-2xl p-7 hover:border-blue-200 hover:shadow-2xl transition-all duration-500 overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ y: -8 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-400`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="relative text-lg font-bold mb-2 text-gray-900">{f.title}</h3>
              <p className="relative text-gray-600 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
