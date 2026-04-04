import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ImpactWidgetProps {
  totalPaid: number;
  totalReceived: number;
}

export default function ImpactWidget({ totalPaid, totalReceived }: ImpactWidgetProps) {
  const multiplier = totalPaid > 0 ? (totalReceived / totalPaid).toFixed(1) : '0.0';
  const ratio = totalPaid > 0 ? Math.min((totalReceived / totalPaid) * 100, 100) : 0;
  const isPositive = totalReceived >= totalPaid;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        {isPositive ? (
          <TrendingUp size={18} className="text-success" />
        ) : (
          <TrendingDown size={18} className="text-accent-400" />
        )}
        <h3 className="font-bold text-sm text-text-primary">Protection Impact</h3>
      </div>

      <div className="flex justify-between items-end mb-4">
        <div>
          <p className="text-[10px] font-bold text-text-hint uppercase tracking-widest mb-1">Return Ratio</p>
          <motion.p
            className={`text-3xl font-bold font-mono ${isPositive ? 'text-success' : 'text-accent-400'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {multiplier}x
          </motion.p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-xs text-text-secondary">
            Paid: <span className="font-mono text-text-primary">₹{totalPaid.toFixed(0)}</span>
          </p>
          <p className="text-xs text-text-secondary">
            Received: <span className="font-mono text-success">₹{totalReceived.toFixed(0)}</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isPositive
              ? 'linear-gradient(90deg, #14b8a6, #22c55e)'
              : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${ratio}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[11px] text-text-hint mt-2">
        {isPositive
          ? 'Your protection is paying off!'
          : 'Your safety net is building up.'}
      </p>
    </div>
  );
}
