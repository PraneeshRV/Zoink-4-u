import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PayoutStep {
  step: number;
  name: string;
  label: string;
  icon: string;
  completed: boolean;
}

interface PayoutTrackerProps {
  steps: PayoutStep[];
  amount: number;
  txnId?: string;
  upiRef?: string;
  animate?: boolean;
}

export default function PayoutTracker({ steps, amount, txnId, upiRef, animate = true }: PayoutTrackerProps) {
  const [visibleSteps, setVisibleSteps] = useState<number>(animate ? 0 : steps.length);

  useEffect(() => {
    if (!animate) {
      setVisibleSteps(steps.length);
      return;
    }
    const interval = setInterval(() => {
      setVisibleSteps(prev => {
        if (prev >= steps.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [steps.length, animate]);

  const allDone = visibleSteps >= steps.length;

  return (
    <div className="payout-tracker">
      <div className="payout-tracker-header">
        <span className="payout-tracker-title">⚡ Instant Payout</span>
        <span className="payout-tracker-amount font-mono">₹{amount.toFixed(2)}</span>
      </div>

      <div className="payout-steps">
        <AnimatePresence>
          {steps.slice(0, visibleSteps).map((step, i) => (
            <motion.div
              key={step.step}
              className="payout-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`payout-step-icon ${i < visibleSteps - 1 || allDone ? 'done' : 'active'}`}>
                {i < visibleSteps - 1 || allDone ? step.icon : '⏳'}
              </div>
              <div className="payout-step-line" />
              <span className="payout-step-label">{step.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {allDone && (
        <motion.div
          className="payout-complete"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="payout-complete-badge">✅ Payment Confirmed</div>
          {txnId && (
            <div className="payout-detail">
              <span className="payout-detail-label">Razorpay ID</span>
              <span className="payout-detail-value font-mono">{txnId}</span>
            </div>
          )}
          {upiRef && (
            <div className="payout-detail">
              <span className="payout-detail-label">UPI Ref</span>
              <span className="payout-detail-value font-mono">{upiRef}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
