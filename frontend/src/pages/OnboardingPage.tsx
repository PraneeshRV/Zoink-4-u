import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI, policiesAPI, mlEngineAPI } from '../lib/api';
import { useAuthStore } from '../store/useAuth';

const ZONES = [
  { label: 'T. Nagar, Chennai', value: '8829e24dfffffff', city: 'Chennai' },
  { label: 'Madhapur, Hyderabad', value: '8831a91dfffffff', city: 'Hyderabad' },
  { label: 'Koramangala, Bengaluru', value: '883148c7fffffff', city: 'Bengaluru' },
  { label: 'Andheri, Mumbai', value: '88292e3dfffffff', city: 'Mumbai' },
  { label: 'Ernakulam, Kochi', value: '88316899fffffff', city: 'Kochi' },
  { label: 'Connaught Place, Delhi', value: '88395cd7fffffff', city: 'Delhi' },
];

const TIERS = [
  { id: 'bronze', name: 'Bronze', emoji: '🥉', color: '#cd7f32', maxPayout: 500, triggers: 6, desc: 'Part-time workers' },
  { id: 'silver', name: 'Silver', emoji: '🥈', color: '#c0c0c0', maxPayout: 1000, triggers: 12, desc: 'Full-time riders' },
  { id: 'gold', name: 'Gold', emoji: '🥇', color: '#ffd700', maxPayout: 2000, triggers: 20, desc: 'High-volume riders' },
  { id: 'platinum', name: 'Platinum', emoji: '💎', color: '#e2e8f0', maxPayout: 5000, triggers: 25, desc: 'Elite partners' },
];

const STEP_LABELS = ['Identity', 'Work Profile', 'Choose Plan'];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  // Step 1
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Step 2
  const [platform, setPlatform] = useState('swiggy');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState(ZONES[0].value);
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('21:00');

  // Step 3
  const [selectedTier, setSelectedTier] = useState('');
  const [premiums, setPremiums] = useState<Record<string, number>>({});
  const [loadingPremiums, setLoadingPremiums] = useState(false);
  const [riderId, setRiderId] = useState('');

  const handleSendOTP = () => {
    if (!name || !phone || !aadhaarLast4) {
      toast.error('Please fill all fields');
      return;
    }
    setOtpSent(true);
    toast.success('OTP sent! Use 123456 for demo');
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      const selectedZone = ZONES.find(z => z.value === zone);
      const res = await authAPI.register({
        name, phone, platform,
        zone_h3: zone,
        city: city || selectedZone?.city || 'Chennai',
        shift_start: shiftStart,
        shift_end: shiftEnd,
        aadhaar_last4: aadhaarLast4,
        mock_otp: otp,
      });
      login(res.data.access_token, res.data.rider_id, res.data.name);
      setRiderId(res.data.rider_id);
      toast.success(`Welcome, ${res.data.name}!`);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkProfile = () => {
    const selectedZone = ZONES.find(z => z.value === zone);
    if (!city && selectedZone) setCity(selectedZone.city);
    setStep(3);
    fetchPremiums();
  };

  const fetchPremiums = async () => {
    setLoadingPremiums(true);
    const results: Record<string, number> = {};
    for (const tier of TIERS) {
      try {
        const res = await policiesAPI.getQuote({ rider_id: riderId, tier: tier.id });
        results[tier.id] = res.data.weekly_premium_rs;
      } catch {
        try {
          const mlRes = await mlEngineAPI.calculatePremium({
            zone_h3: zone, city: city || 'Chennai', tier: tier.id,
            work_hours_per_week: 40, platform, zoink_score: 50,
          });
          results[tier.id] = mlRes.data.premium_rs;
        } catch {
          results[tier.id] = ({ bronze: 29, silver: 45, gold: 69, platinum: 99 } as any)[tier.id] || 29;
        }
      }
    }
    setPremiums(results);
    setLoadingPremiums(false);
  };

  const handleSubscribe = async () => {
    if (!selectedTier) { toast.error('Please select a plan'); return; }
    setLoading(true);
    try {
      await policiesAPI.subscribe({ rider_id: riderId, tier: selectedTier });
      toast.success('Policy activated! 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '28px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo-mark">
          <div className="logo-shield">🛡️</div>
          Zoink-4-u
        </div>
        <button
          className="btn-ghost text-sm"
          style={{ padding: '6px 10px' }}
          onClick={() => navigate('/admin')}
        >
          Admin
        </button>
      </div>

      {/* Stepper */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 8 }}>
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            const isActive = s === step;
            const isDone = s < step;
            return (
              <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {i > 0 && (
                    <div style={{
                      flex: 1, height: 2,
                      background: isDone ? 'var(--accent-600)' : 'var(--border-default)',
                      transition: 'background 0.3s ease',
                    }} />
                  )}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700,
                    background: isDone ? 'var(--accent-600)' : isActive ? 'var(--bg-overlay)' : 'var(--bg-raised)',
                    border: isActive ? '2px solid var(--accent-600)' : isDone ? '2px solid var(--accent-600)' : '2px solid var(--border-default)',
                    color: isDone ? '#fff' : isActive ? 'var(--accent-400)' : 'var(--text-hint)',
                    boxShadow: isActive ? '0 0 0 3px rgba(92,124,250,0.2)' : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    {isDone ? '✓' : s}
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div style={{
                      flex: 1, height: 2,
                      background: isDone ? 'var(--accent-600)' : 'var(--border-default)',
                      transition: 'background 0.3s ease',
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: '0.68rem', fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-hint)',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="onboarding-wrap"
            style={{ paddingTop: 28 }}
          >
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                Identity Verification
              </h2>
              <p className="text-secondary text-sm">
                Aadhaar-backed identity — one rider, one policy.
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input-field" placeholder="e.g. Deepak Kumar" value={name}
                onChange={e => setName(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input className="input-field" placeholder="10-digit mobile number" value={phone}
                onChange={e => setPhone(e.target.value)} maxLength={10} inputMode="numeric" />
            </div>
            <div className="input-group">
              <label className="input-label">Aadhaar Last 4 Digits</label>
              <input className="input-field" placeholder="e.g. 3782" value={aadhaarLast4}
                onChange={e => setAadhaarLast4(e.target.value)} maxLength={4} inputMode="numeric" />
            </div>

            {!otpSent ? (
              <button className="btn btn-primary" onClick={handleSendOTP} style={{ marginTop: 8 }}>
                Send OTP →
              </button>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">Enter OTP</label>
                  <input className="input-field" placeholder="6-digit OTP" value={otp}
                    onChange={e => setOtp(e.target.value)} maxLength={6} inputMode="numeric" />
                  <div className="info-box" style={{ marginTop: 6 }}>
                    <span>💡</span>
                    <span>Use <strong>123456</strong> for the demo environment</span>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleVerifyOTP} disabled={loading} style={{ marginTop: 4 }}>
                  {loading ? <span className="spinner" /> : 'Verify & Continue →'}
                </button>
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <span className="text-sm text-secondary">Already registered? </span>
              <button
                className="btn-ghost"
                style={{ color: 'var(--accent-400)', fontWeight: 600, fontSize: '0.9rem', padding: '4px 8px' }}
                onClick={() => {
                  const p = prompt('Enter your registered phone number:');
                  if (p) {
                    authAPI.login({ phone: p, mock_otp: '123456' })
                      .then(r => {
                        login(r.data.access_token, r.data.rider_id, r.data.name);
                        navigate('/dashboard');
                      })
                      .catch(() => toast.error('Login failed'));
                  }
                }}
              >
                Log In
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="onboarding-wrap"
            style={{ paddingTop: 28 }}
          >
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                Work Profile
              </h2>
              <p className="text-secondary text-sm">
                Help us tailor your premium to your actual risk exposure.
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">Primary Platform</label>
              <select className="input-field" value={platform} onChange={e => setPlatform(e.target.value)}>
                <option value="swiggy">Swiggy</option>
                <option value="zomato">Zomato</option>
                <option value="zepto">Zepto</option>
                <option value="amazon">Amazon Flex</option>
                <option value="flipkart">Flipkart Quick</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Delivery Zone</label>
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
              <label className="input-label">City</label>
              <input className="input-field" value={city || ZONES.find(z => z.value === zone)?.city || ''}
                onChange={e => setCity(e.target.value)} placeholder="City" />
            </div>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Shift Start</label>
                <input className="input-field" type="time" value={shiftStart}
                  onChange={e => setShiftStart(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Shift End</label>
                <input className="input-field" type="time" value={shiftEnd}
                  onChange={e => setShiftEnd(e.target.value)} />
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleWorkProfile} style={{ marginTop: 8 }}>
              View Plans →
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="onboarding-wrap"
            style={{ paddingTop: 28 }}
          >
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                Choose Your Shield
              </h2>
              <p className="text-secondary text-sm">
                Dynamic pricing personalised to your zone and risk profile.
              </p>
            </div>

            <div className="tier-grid" style={{ marginBottom: 16 }}>
              {TIERS.map(tier => (
                <div
                  key={tier.id}
                  className={`tier-card ${selectedTier === tier.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{ borderColor: selectedTier === tier.id ? tier.color : undefined }}
                >
                  <div className="tier-badge" style={{ background: tier.color + '22', color: tier.color }}>
                    {tier.emoji}
                  </div>
                  <div className="tier-name" style={{ color: tier.color }}>{tier.name}</div>
                  <div className="tier-premium">
                    {loadingPremiums ? (
                      <div className="skeleton" style={{ width: 52, height: 22, margin: '0 auto' }} />
                    ) : (
                      <>₹{(premiums[tier.id] || 0).toFixed(0)}<span>/wk</span></>
                    )}
                  </div>
                  <div className="text-xs text-secondary" style={{ marginTop: 4 }}>
                    Max ₹{tier.maxPayout.toLocaleString()}
                  </div>
                  <div className="text-xs text-hint" style={{ marginTop: 2 }}>
                    {tier.triggers} triggers
                  </div>
                </div>
              ))}
            </div>

            {selectedTier && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="info-box accent"
                style={{ marginBottom: 12 }}
              >
                <span>🛡️</span>
                <span>
                  <strong>{TIERS.find(t => t.id === selectedTier)?.name} Shield</strong> —&nbsp;
                  {TIERS.find(t => t.id === selectedTier)?.desc}.&nbsp;
                  {TIERS.find(t => t.id === selectedTier)?.triggers} disruption triggers covered.
                </span>
              </motion.div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleSubscribe}
              disabled={loading || !selectedTier}
            >
              {loading ? <span className="spinner" /> : '🛡️  Activate Protection'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
