import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { triggersAPI } from '../../lib/api';

const ZONES = [
  { label: 'T. Nagar, Chennai', value: '8829e24dfffffff', city: 'Chennai' },
  { label: 'Madhapur, Hyderabad', value: '8831a91dfffffff', city: 'Hyderabad' },
  { label: 'Koramangala, Bengaluru', value: '883148c7fffffff', city: 'Bengaluru' },
  { label: 'Andheri, Mumbai', value: '88292e3dfffffff', city: 'Mumbai' },
  { label: 'Ernakulam, Kochi', value: '88316899fffffff', city: 'Kochi' },
  { label: 'Connaught Place, Delhi', value: '88395cd7fffffff', city: 'Delhi' },
];

const EVENT_TYPES = [
  { value: 'T1_HEAVY_RAIN', label: 'Heavy Rainfall', icon: '🌧️' },
  { value: 'T3_SEVERE_AQI', label: 'Severe AQI', icon: '😷' },
  { value: 'T4_EXTREME_HEAT', label: 'Extreme Heat', icon: '🔥' },
  { value: 'T9_GRIDLOCK', label: 'Traffic Gridlock', icon: '🚗' },
  { value: 'T10_CURFEW', label: 'Curfew', icon: '🚨' },
  { value: 'T17_PLATFORM_CRASH', label: 'Platform Crash', icon: '📱' },
];

const PIPELINE_LABELS = [
  { icon: '🌍', text: 'Disruption event registered in zone' },
  { icon: '🔍', text: 'Scanning active policies in affected hexagons' },
  { icon: '⚙️', text: 'Running 5-layer fraud validation pipeline' },
  { icon: '📊', text: 'Calculating SRS score and payout percentages' },
  { icon: '💸', text: 'Initiating UPI payouts via Razorpay sandbox' },
];

export default function AdminSimulate() {
  const [eventType, setEventType] = useState('T1_HEAVY_RAIN');
  const [city, setCity] = useState('Chennai');
  const [zone, setZone] = useState(ZONES[0].value);
  const [severity, setSeverity] = useState(7);
  const [duration, setDuration] = useState(4);
  const [running, setRunning] = useState(false);
  const [completedStep, setCompletedStep] = useState(-1);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleTrigger = async () => {
    setRunning(true);
    setCompletedStep(-1);
    setResult(null);

    try {
      const selectedZone = ZONES.find(z => z.value === zone);
      const res = await triggersAPI.simulate({
        event_type: eventType,
        zone_h3: zone,
        city: selectedZone?.city || city,
        severity,
        duration_hours: duration,
      });
      toast.success('Disruption triggered!');

      // Animate steps
      for (let i = 0; i < PIPELINE_LABELS.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 650));
        setCompletedStep(i);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      const pr = res.data?.pipeline_result || {};
      setResult({
        riders_paid: pr.claims_approved || 0,
        total_payout: pr.total_payout || 0,
        avg_payout: pr.avg_payout || 0,
        claims_created: pr.claims_created || 0,
        fraud_flagged: pr.claims_fraud_flagged || 0,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Simulation failed');
      setRunning(false);
      setCompletedStep(-1);
    }
  };

  const selectedEvent = EVENT_TYPES.find(e => e.value === eventType);
  const srsLevel = severity >= 8 ? 'Severe → 100% payout' : severity >= 5 ? 'Standard → 80% payout' : 'Minor → 60% payout';
  const srsColor = severity >= 8 ? 'var(--danger)' : severity >= 5 ? 'var(--warning)' : 'var(--info)';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">Disruption Simulator</h1>
        <p className="admin-page-sub">Trigger a disruption and observe the full auto-claim pipeline in real time</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left: Config */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 20 }}>Configure Event</div>

          {/* Event type picker */}
          <div className="input-group">
            <label className="input-label">Event Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {EVENT_TYPES.map(et => (
                <button
                  key={et.value}
                  onClick={() => setEventType(et.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    border: '1px solid',
                    transition: 'all 0.15s ease',
                    ...(eventType === et.value
                      ? { background: 'var(--accent-soft)', borderColor: 'var(--accent-500)', color: 'var(--accent-400)' }
                      : { background: 'var(--bg-raised)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }
                    ),
                    fontSize: '0.82rem', fontWeight: 600,
                  }}
                >
                  <span>{et.icon}</span> {et.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Zone</label>
            <select className="input-field" value={zone} onChange={e => {
              setZone(e.target.value);
              const z = ZONES.find(z => z.value === e.target.value);
              if (z) setCity(z.city);
            }}>
              {ZONES.map(z => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Severity: {severity}/10 — <span style={{ color: srsColor }}>{srsLevel}</span></label>
            <input
              type="range" min={1} max={10} value={severity}
              onChange={e => setSeverity(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-600)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-xs text-hint">
              <span>1 — Minor</span><span>10 — Catastrophic</span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Duration: {duration} hour{duration > 1 ? 's' : ''}</label>
            <input
              type="range" min={1} max={12} value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-600)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-xs text-hint">
              <span>1 hr</span><span>12 hrs</span>
            </div>
          </div>

          {/* Preview */}
          <div className="card-accent" style={{ marginBottom: 16 }}>
            <div className="text-xs text-secondary" style={{ marginBottom: 4 }}>Simulation Preview</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {selectedEvent?.icon} {selectedEvent?.label}
            </div>
            <div className="text-sm text-secondary" style={{ marginTop: 2 }}>
              {city} · Severity {severity}/10 · {duration}h duration
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleTrigger}
            disabled={running}
            style={{ fontSize: '0.95rem', fontWeight: 700 }}
          >
            {running ? (
              <><span className="spinner" /> Running Pipeline…</>
            ) : (
              `${selectedEvent?.icon} Fire Disruption`
            )}
          </button>
        </div>

        {/* Right: Pipeline + Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pipeline steps */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 20 }}>
              Auto-Claim Pipeline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {PIPELINE_LABELS.map((step, i) => {
                const isDone = completedStep >= i;
                const isActive = running && completedStep === i - 1;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: i < PIPELINE_LABELS.length - 1 ? 20 : 0, position: 'relative' }}>
                    {/* Line */}
                    {i < PIPELINE_LABELS.length - 1 && (
                      <div style={{
                        position: 'absolute', left: 14, top: 28, bottom: 0, width: 2,
                        background: isDone ? 'var(--accent-600)' : 'var(--border-default)',
                        transition: 'background 0.3s ease',
                      }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', zIndex: 1,
                      background: isDone ? 'var(--accent-600)' : isActive ? 'var(--bg-overlay)' : 'var(--bg-raised)',
                      border: isDone ? '2px solid var(--accent-600)' : '2px solid var(--border-default)',
                      transition: 'all 0.3s ease',
                    }}>
                      {isDone ? '✓' : isActive ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: 'var(--accent-400)' }} /> : step.icon}
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{
                        fontSize: '0.9rem', fontWeight: isDone ? 600 : 400,
                        color: isDone ? 'var(--text-primary)' : 'var(--text-secondary)',
                        transition: 'color 0.3s ease',
                      }}>
                        {step.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Result card */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="card"
                style={{ padding: 24, border: '1px solid rgba(81,207,102,0.3)', background: 'rgba(81,207,102,0.05)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: '1.3rem' }}>🎉</span>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Pipeline Complete</div>
                </div>

                <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
                  <div className="stat-cell">
                    <div className="stat-label">Claims Created</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      {result.claims_created}
                    </div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-label">Riders Paid</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                      {result.riders_paid}
                    </div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-label">Total Payout</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
                      ₹{result.total_payout.toFixed(0)}
                    </div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-label">Avg per Rider</div>
                    <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      ₹{result.avg_payout.toFixed(0)}
                    </div>
                  </div>
                </div>

                {result.fraud_flagged > 0 && (
                  <div className="trigger-banner" style={{ marginBottom: 16 }}>
                    <span>⚠️</span>
                    <span className="text-sm">
                      <strong>{result.fraud_flagged}</strong> claim{result.fraud_flagged > 1 ? 's' : ''} flagged for fraud review
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setRunning(false); setCompletedStep(-1); setResult(null); }}
                    style={{ flex: 1 }}
                  >
                    Reset
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/admin/claims')}
                    style={{ flex: 2 }}
                  >
                    View Claims →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
