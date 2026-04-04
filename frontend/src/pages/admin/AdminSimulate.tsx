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
  { value: 'T1_HEAVY_RAIN', label: '🌧️ Heavy Rain', icon: '🌧️' },
  { value: 'T3_SEVERE_AQI', label: '😷 Severe AQI', icon: '😷' },
  { value: 'T4_EXTREME_HEAT', label: '🌡️ Extreme Heat', icon: '🌡️' },
  { value: 'T9_GRIDLOCK', label: '🚗 Gridlock', icon: '🚗' },
  { value: 'T10_CURFEW', label: '🚨 Curfew', icon: '🚨' },
  { value: 'T17_PLATFORM_CRASH', label: '💥 Platform Crash', icon: '💥' },
];

interface PipelineStep {
  icon: string;
  text: string;
  done: boolean;
}

export default function AdminSimulate() {
  const [eventType, setEventType] = useState('T1_HEAVY_RAIN');
  const [city, setCity] = useState('Chennai');
  const [zone, setZone] = useState(ZONES[0].value);
  const [severity, setSeverity] = useState(7);
  const [duration, setDuration] = useState(4);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const animateSteps = (pipelineResult: any) => {
    const claimsCreated = pipelineResult?.pipeline_result?.claims_created || 0;
    const totalPayout = pipelineResult?.pipeline_result?.total_payout || 0;
    const claimsApproved = pipelineResult?.pipeline_result?.claims_approved || 0;

    const allSteps: PipelineStep[] = [
      { icon: '✅', text: 'Disruption event created', done: false },
      { icon: '✅', text: `${claimsCreated} active policies found in zone`, done: false },
      { icon: '⏳', text: 'Running 5-layer fraud validation...', done: false },
      { icon: '✅', text: 'Fraud validation complete', done: false },
      { icon: '✅', text: 'Payouts initiated via Razorpay sandbox', done: false },
    ];

    allSteps.forEach((step, i) => {
      setTimeout(() => {
        setSteps(prev => {
          const next = [...allSteps.slice(0, i + 1)];
          next.forEach(s => s.done = true);
          if (i === 2) next[i].icon = '⏳';
          else next[i].icon = '✅';
          return next;
        });
      }, (i + 1) * 800);
    });

    setTimeout(() => {
      setResult({
        riders_paid: claimsApproved,
        total_payout: totalPayout,
        avg_payout: pipelineResult?.pipeline_result?.avg_payout || 0,
        claims_created: claimsCreated,
        fraud_flagged: pipelineResult?.pipeline_result?.claims_fraud_flagged || 0,
      });
    }, allSteps.length * 800 + 500);
  };

  const handleTrigger = async () => {
    setRunning(true);
    setSteps([]);
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
      animateSteps(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Simulation failed');
      setRunning(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>🎮 Disruption Simulator</h1>
      <p className="text-secondary mb-24">Trigger a disruption event and watch the auto-claim pipeline in action</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Form */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Configure Event</h3>

          <div className="input-group">
            <label className="input-label">Event Type</label>
            <select className="input-field" value={eventType}
              onChange={e => setEventType(e.target.value)}>
              {EVENT_TYPES.map(et => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Zone</label>
            <select className="input-field" value={zone}
              onChange={e => {
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
            <label className="input-label">City</label>
            <input className="input-field" value={city} onChange={e => setCity(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Severity: {severity}/10</label>
            <input type="range" className="range-slider" min={1} max={10} value={severity}
              onChange={e => setSeverity(Number(e.target.value))} />
            <div className="flex justify-between text-xs text-hint mt-4">
              <span>Minor</span><span>Severe</span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Duration: {duration} hours</label>
            <input type="range" className="range-slider" min={1} max={12} value={duration}
              onChange={e => setDuration(Number(e.target.value))} />
            <div className="flex justify-between text-xs text-hint mt-4">
              <span>1 hr</span><span>12 hrs</span>
            </div>
          </div>

          <button
            className="trigger-btn mt-16"
            onClick={handleTrigger}
            disabled={running}
          >
            {running ? (
              <><span className="spinner" style={{ borderTopColor: 'white' }} /> Pipeline Running...</>
            ) : (
              <>🌧️ TRIGGER DISRUPTION</>
            )}
          </button>
        </div>

        {/* Right: Pipeline Status */}
        <div>
          {steps.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Pipeline Status</h3>
              <div className="sim-steps">
                <AnimatePresence>
                  {steps.map((step, i) => (
                    <motion.div
                      key={i}
                      className="sim-step"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0, duration: 0.3 }}
                      style={{ animationDelay: '0s', opacity: 1 }}
                    >
                      <span className="step-icon">{step.icon}</span>
                      <span>{step.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Results Card */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="card-gradient mt-16"
              style={{ padding: 24 }}
            >
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 16 }}>
                🎉 Pipeline Complete
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>Claims Created</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
                    {result.claims_created}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>Riders Paid</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
                    {result.riders_paid}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>Total Payout</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
                    ₹{result.total_payout.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>Avg per Rider</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
                    ₹{result.avg_payout.toFixed(2)}
                  </div>
                </div>
              </div>
              {result.fraud_flagged > 0 && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                  <span className="text-sm">⚠️ {result.fraud_flagged} claims flagged for fraud review</span>
                </div>
              )}
              <button
                className="btn btn-outline mt-16"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                onClick={() => {
                  setRunning(false);
                  navigate('/admin/claims');
                }}
              >
                View Claims →
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
