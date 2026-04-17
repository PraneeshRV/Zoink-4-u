import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { triggersAPI } from '../../lib/api';
import PayoutTracker from '../../components/PayoutTracker';

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
  const [gpsSpoofing, setGpsSpoofing] = useState(false);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [result, setResult] = useState<any>(null);
  const [payoutSteps, setPayoutSteps] = useState<any[]>([]);
  const navigate = useNavigate();

  const animateSteps = (pipelineResult: any) => {
    const claimsCreated = pipelineResult?.pipeline_result?.claims_created || 0;
    const totalPayout = pipelineResult?.pipeline_result?.total_payout || 0;
    const claimsApproved = pipelineResult?.pipeline_result?.claims_approved || 0;
    const fraudFlagged = pipelineResult?.pipeline_result?.claims_fraud_flagged || 0;

    const allSteps: PipelineStep[] = [
      { icon: '✅', text: 'Disruption event created', done: false },
      { icon: '✅', text: `${claimsCreated} active policies found in zone`, done: false },
      { icon: '📍', text: 'GPS validation completed', done: false },
      { icon: '🧠', text: 'Behavioral analysis completed', done: false },
      { icon: '🤖', text: 'ML fraud detection (GradientBoosting + IsolationForest)', done: false },
      { icon: '✅', text: `${claimsApproved} claims approved, ${fraudFlagged} flagged`, done: false },
      { icon: '💰', text: 'Instant payouts via Razorpay UPI', done: false },
    ];

    allSteps.forEach((step, i) => {
      setTimeout(() => {
        setSteps(prev => {
          const next = [...allSteps.slice(0, i + 1)];
          next.forEach(s => s.done = true);
          return next;
        });
      }, (i + 1) * 600);
    });

    setTimeout(() => {
      setResult({
        riders_paid: claimsApproved,
        total_payout: totalPayout,
        avg_payout: pipelineResult?.pipeline_result?.avg_payout || 0,
        claims_created: claimsCreated,
        fraud_flagged: fraudFlagged,
        payout_details: pipelineResult?.pipeline_result?.payout_details || [],
        pipeline_version: pipelineResult?.pipeline_result?.pipeline_version || '3.0.0',
      });

      // Create mock payout steps for PayoutTracker
      setPayoutSteps([
        { step: 1, name: 'claim_verified', label: 'Claim Verified by AI', icon: '✅', completed: true },
        { step: 2, name: 'fraud_cleared', label: 'Fraud Check Passed', icon: '🔒', completed: true },
        { step: 3, name: 'order_created', label: 'Razorpay Order Created', icon: '📋', completed: true },
        { step: 4, name: 'upi_initiated', label: 'UPI Transfer Initiated', icon: '📲', completed: true },
        { step: 5, name: 'payment_confirmed', label: 'Payment Confirmed', icon: '💰', completed: true },
      ]);
    }, allSteps.length * 600 + 300);
  };

  const handleTrigger = async () => {
    setRunning(true);
    setSteps([]);
    setResult(null);
    setPayoutSteps([]);

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

  const handleNasaPull = async () => {
    setRunning(true);
    setSteps([]);
    setResult(null);
    setPayoutSteps([]);
    const toastId = toast.loading('Connecting to NASA EONET...');
    try {
      const res = await triggersAPI.nasaPull();
      toast.success(res.data.nasa_message || 'NASA event simulated!', { id: toastId });
      animateSteps(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to pull from NASA', { id: toastId });
      setRunning(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>🎮 Disruption Simulator</h1>
      <p className="text-secondary mb-24">Trigger a disruption and watch the AI-powered claim pipeline in action</p>

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

          {/* GPS Spoofing Toggle */}
          <div className="input-group" style={{
            padding: 12, borderRadius: 12, border: `1px solid ${gpsSpoofing ? 'var(--danger)' : 'var(--border-default)'}`,
            background: gpsSpoofing ? 'var(--danger-soft)' : 'transparent',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label className="input-label" style={{ marginBottom: 0, color: gpsSpoofing ? 'var(--danger)' : undefined }}>
                  📍 Simulate GPS Spoofing
                </label>
                <div className="text-xs text-hint" style={{ marginTop: 2 }}>
                  {gpsSpoofing ? 'Riders will report fake GPS locations' : 'Normal GPS validation'}
                </div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={gpsSpoofing}
                  onChange={e => setGpsSpoofing(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <button
              className="trigger-btn"
              onClick={handleTrigger}
              disabled={running}
            >
              {running ? (
                <><span className="spinner" style={{ borderTopColor: 'white' }} /> Pipeline Running...</>
              ) : (
                <>🌧️ TRIGGER DISRUPTION</>
              )}
            </button>
            <button
              className="btn btn-outline"
              onClick={handleNasaPull}
              disabled={running}
              style={{ fontWeight: 700 }}
            >
              🛰️ FETCH LIVE NASA EVENT
            </button>
          </div>
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
                <span style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: 8, fontWeight: 400 }}>
                  v{result.pipeline_version}
                </span>
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
              {gpsSpoofing && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.2)', borderRadius: 8 }}>
                  <span className="text-sm">📍 GPS spoofing was active — check fraud flags</span>
                </div>
              )}

              {/* Payout details */}
              {result.payout_details?.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12 }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, marginBottom: 8 }}>
                    Payout Recipients
                  </div>
                  {result.payout_details.map((p: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <span>{p.rider_name}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span className="font-mono" style={{ fontWeight: 700 }}>₹{p.amount?.toFixed(2)}</span>
                        {p.upi_ref && (
                          <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>{p.upi_ref}</div>
                        )}
                      </div>
                    </div>
                  ))}
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

          {/* Payout Tracker Animation */}
          {payoutSteps.length > 0 && result && result.total_payout > 0 && (
            <div className="mt-16">
              <PayoutTracker
                steps={payoutSteps}
                amount={result.total_payout}
                txnId={result.payout_details?.[0]?.txn_id}
                upiRef={result.payout_details?.[0]?.upi_ref}
                animate={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
