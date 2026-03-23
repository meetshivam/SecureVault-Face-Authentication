export default function GlassCard({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-6 ${hover ? 'hover:border-blue-300 hover:shadow-xl transition-all duration-300' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
