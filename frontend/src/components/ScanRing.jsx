import { Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ScanRing({ size = 'lg' }) {
  const dims = size === 'lg' ? 'w-80 h-80 lg:w-96 lg:h-96' : 'w-40 h-40';
  return (
    <div className={`relative ${dims} mx-auto`}>
      {/* Rotating rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 border-2 rounded-full"
          style={{
            borderColor: i === 0 ? 'rgb(59, 130, 246)' : i === 1 ? 'rgb(99, 102, 241)' : 'rgb(139, 92, 246)',
            opacity: 0.3 - i * 0.08,
          }}
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{
            rotate: { duration: 20 + i * 10, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }}
        />
      ))}
      {/* Center fingerprint */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-48 h-48 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center">
          <Fingerprint className="w-28 h-28 text-white" />
        </div>
      </motion.div>
      {/* Orbiting dots */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-500 rounded-full"
          style={{ top: '50%', left: '50%', marginLeft: '-4px', marginTop: '-4px' }}
          animate={{
            x: Math.cos((i * Math.PI * 2) / 8) * 140,
            y: Math.sin((i * Math.PI * 2) / 8) * 140,
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
