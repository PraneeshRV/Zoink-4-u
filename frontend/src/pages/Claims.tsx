import { useState } from 'react';
import { CloudRain, Loader2, ShieldAlert, Zap, AlertTriangle, TrafficCone, Radio, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { coreApi } from '../lib/api';
import { useAuthStore } from '../store/useAuth';
import { useAppStore } from '../store/useApp';
import BottomNav from '../components/BottomNav';

const TRIGGERS = [
  { id: 'HEAVY_RAIN', label: 'Heavy Rainfall', icon: CloudRain, color: '#3b82f6' },
  { id: 'FLASH_FLOOD', label: 'Flash Flood', icon: CloudRain, color: '#6366f1' },
  { id: 'AQI_EMERGENCY', label: 'Air Quality Crisis', icon: Wind, color: '#f59e0b' },
  { id: 'CURFEW', label: 'Curfew / Section 144', icon: ShieldAlert, color: '#ef4444' },
  { id: 'APP_OUTAGE', label: 'Platform Outage', icon: Radio, color: '#a855f7' },
  { id: 'ROAD_COLLAPSE', label: 'Road Collapse', icon: TrafficCone, color: '#f97316' },
];

export default function Claims() {
  const { user } = useAuthStore();
  const { setWalletBalance, walletBalance } = useAppStore();
  const [selectedTrigger, setSelectedTrigger] = useState(TRIGGERS[0].id);
  const [severity, setSeverity] = useState(7);
  const [triggering, setTriggering] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const simulate = async () => {
    if (!user) return;
    setTriggering(true);
    setResults(null);
    try {
      const { data } = await coreApi.post('/claims/trigger', {
        zone_id: user.zone_id,
        trigger_type: selectedTrigger,
        severity
      });
      setResults(data);

      if (data.length === 0) {
        toast('No active policies found in your zone.', { icon: 'ℹ️' });
      } else {
        const paid = data.filter((c: any) => c.status.includes('PAID'));
        if (paid.length > 0) {
          const total = paid.reduce((s: number, c: any) => s + c.payout_amount, 0);
          setWalletBalance(walletBalance + total);
          toast.success(`₹${total.toFixed(0)} paid out across ${paid.length} claim(s)!`);
        } else {
          toast('Event was blocked by exclusion rules.', { icon: '🚫' });
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Trigger failed');
    } finally { setTriggering(false); }
  };

  const severityColor = severity <= 3 ? '#22c55e' : severity <= 6 ? '#f59e0b' : '#ef4444';
  const severityLabel = severity <= 3 ? 'Minor' : severity <= 6 ? 'Standard' : 'Severe';

  return (
    <div className="flex flex-col min-h-screen">
      <header className="pt-12 pb-4 px-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-danger-soft">
            <Zap className="text-danger" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">Claims Simulator</h1>
            <p className="text-xs text-text-secondary">Test the parametric trigger pipeline</p>
          </div>
        </div>
      </header>

      <main className="px-5 flex-1 flex flex-col gap-4 pb-24">
        {/* Trigger Type Selection */}
        <div className="glass-card p-4">
          <p className="label mb-3">Event Type</p>
          <div className="grid grid-cols-2 gap-2">
            {TRIGGERS.map(t => {
              const selected = selectedTrigger === t.id;
              return (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTrigger(t.id)}
                  className={`p-3 rounded-xl flex items-center gap-2.5 border text-left transition-all ${
                    selected
                      ? 'border-primary-500/40 bg-surface-elevated shadow-sm'
                      : 'bg-surface-card/40 border-border-default/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="p-1.5 rounded-lg" style={{ background: `${t.color}20` }}>
                    <t.icon size={16} style={{ color: t.color }} />
                  </div>
                  <span className="text-xs font-bold text-text-primary">{t.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Severity Slider */}
        <div className="glass-card p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="label mb-0">Severity</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: severityColor }}>{severityLabel}</span>
              <span className="font-bold font-mono text-sm" style={{ color: severityColor }}>{severity}/10</span>
            </div>
          </div>
          {/* Custom severity bar */}
          <div className="relative h-2 bg-surface-elevated rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)` }}
              animate={{ width: `${severity * 10}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={severity}
            onChange={e => setSeverity(Number(e.target.value))}
            className="w-full mt-2 accent-primary-500 h-0 opacity-0 cursor-pointer"
            style={{ height: '20px', opacity: 1, marginTop: '-14px', position: 'relative', zIndex: 10, cursor: 'pointer', WebkitAppearance: 'none', background: 'transparent' }}
          />
        </div>

        {/* Trigger Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={simulate}
          disabled={triggering}
          className="btn-danger flex justify-center items-center gap-2"
        >
          {triggering ? (
            <><Loader2 size={18} className="animate-spin" /> Processing...</>
          ) : (
            <><Zap size={18} /> Trigger Disruption Event</>
          )}
        </motion.button>

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-4"
            >
              <p className="label mb-3">Evaluation Results</p>
              {results.length === 0 ? (
                <p className="text-sm text-text-hint">No policies in {user?.zone_id} were affected by this event.</p>
              ) : (
                <div className="space-y-2">
                  {results.map((c, i) => {
                    const isPaid = c.status.includes('PAID');
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-3.5 rounded-xl border text-sm ${
                          isPaid
                            ? 'bg-success-soft border-success/20'
                            : 'bg-surface-elevated border-border-default'
                        }`}
                      >
                        <div className="flex justify-between font-bold">
                          <span className={isPaid ? 'text-success' : 'text-text-hint'}>
                            {c.status.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono text-text-primary">₹{c.payout_amount}</span>
                        </div>
                        <p className="text-xs text-text-hint mt-1">
                          Policy #{c.policy_id} — {c.trigger_reason?.replace(/_/g, ' ')}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}
