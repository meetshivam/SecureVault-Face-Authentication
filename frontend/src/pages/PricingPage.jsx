import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  { name: 'Starter', price: '₹0', period: '/forever', features: ['10 passwords', '1 device', 'Basic security', 'Email support'], cta: 'Get Started', highlight: false },
  { name: 'Professional', price: '₹299', period: '/month', features: ['Unlimited passwords', '5 devices', 'Breach monitoring', 'Priority support', 'Audit logs'], cta: 'Start Free Trial', highlight: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'Unlimited devices', 'Dedicated support', 'Custom integrations', 'SLA guarantee'], cta: 'Contact Sales', highlight: false },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white pt-28 pb-16">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold mb-5 uppercase tracking-wide">Pricing</span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Simple, Transparent Pricing</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Choose a plan that fits your security needs. Upgrade or downgrade anytime.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              className={`relative bg-white border-2 rounded-2xl p-8 transition-all duration-500 ${plan.highlight ? 'border-blue-600 shadow-2xl md:scale-105' : 'border-gray-200 hover:border-blue-200 hover:shadow-xl'}`}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/register"
                  className={`group block text-center w-full px-6 py-3 rounded-xl font-semibold text-sm transition-all overflow-hidden shadow-lg ${plan.highlight ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
