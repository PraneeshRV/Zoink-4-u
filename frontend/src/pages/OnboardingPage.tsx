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
  { id: 'bronze', name: 'Bronze', emoji: '🥉', color: '#cd7f32', maxPayout: 500, triggers: 6 },
  { id: 'silver', name: 'Silver', emoji: '🥈', color: '#c0c0c0', maxPayout: 1000, triggers: 12 },
  { id: 'gold', name: 'Gold', emoji: '🥇', color: '#ffd700', maxPayout: 2000, triggers: 20 },
  { id: 'platinum', name: 'Platinum', emoji: '💎', color: '#e5e4e2', maxPayout: 5000, triggers: 25 },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  // Step 1 fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Step 2 fields
  const [platform, setPlatform] = useState('swiggy');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState(ZONES[0].value);
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('21:00');

  // Step 3 fields
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
    if (city === '' && selectedZone) {
      setCity(selectedZone.city);
    }
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
        // Fallback to ML engine directly
        try {
          const mlRes = await mlEngineAPI.calculatePremium({
            zone_h3: zone, city: city || 'Chennai', tier: tier.id,
            work_hours_per_week: 40, platform, zoink_score: 50,
          });
          results[tier.id] = mlRes.data.premium_rs;
        } catch {
          results[tier.id] = { bronze: 29, silver: 45, gold: 69, platinum: 99 }[tier.id] || 29;
        }
      }
    }
    setPremiums(results);
    setLoadingPremiums(false);
  };

  const handleSubscribe = async () => {
    if (!selectedTier) {
      toast.error('Please select a plan');
      return;
    }
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
    <div style={{ padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          <span className="gradient-text">Zoink-4-u</span>
        </h1>
        <p className="text-secondary text-sm">Income Protection for Gig Workers</p>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {[1, 2, 3].map(s => (
          <div key={s} className={`step-dot ${s === step ? 'active' : s < step ? 'done' : ''}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Identity */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            style={{ flex: 1 }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>Identity Verification</h2>
            <p className="text-secondary text-sm mb-20">Let's verify your identity to get started</p>

            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input-field" placeholder="e.g. Deepak Kumar" value={name}
                onChange={e => setName(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input className="input-field" placeholder="e.g. 9876543210" value={phone}
                onChange={e => setPhone(e.target.value)} maxLength={10} />
            </div>
            <div className="input-group">
              <label className="input-label">Aadhaar Last 4 Digits</label>
              <input className="input-field" placeholder="e.g. 1234" value={aadhaarLast4}
                onChange={e => setAadhaarLast4(e.target.value)} maxLength={4} />
            </div>

            {!otpSent ? (
              <button className="btn btn-primary" onClick={handleSendOTP}>
                📱 Send OTP
              </button>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">Enter OTP</label>
                  <input className="input-field" placeholder="123456" value={otp}
                    onChange={e => setOtp(e.target.value)} maxLength={6} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-hint)', marginTop: 4 }}>
                    💡 Use <strong>123456</strong> for demo
                  </p>
                </div>
                <button className="btn btn-primary" onClick={handleVerifyOTP} disabled={loading}>
                  {loading ? <span className="spinner" /> : '✅ Verify & Continue'}
                </button>
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <p className="text-sm text-secondary">
                Already registered?{' '}
                <button className="btn-ghost" style={{ color: 'var(--primary-400)', fontWeight: 600 }}
                  onClick={() => navigate('/login')}>
                  Log In
                </button>
              </p>
            </div>

            {/* Admin link */}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button className="btn-ghost text-xs" style={{ color: 'var(--text-hint)' }}
                onClick={() => navigate('/admin')}>
                🔧 Admin Panel
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Work Profile */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            style={{ flex: 1 }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>Work Profile</h2>
            <p className="text-secondary text-sm mb-20">Tell us about your delivery work</p>

            <div className="input-group">
              <label className="input-label">Platform</label>
              <select className="input-field" value={platform} onChange={e => setPlatform(e.target.value)}>
                <option value="swiggy">Swiggy</option>
                <option value="zomato">Zomato</option>
                <option value="zepto">Zepto</option>
                <option value="amazon">Amazon</option>
                <option value="flipkart">Flipkart</option>
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

            <button className="btn btn-primary mt-12" onClick={handleWorkProfile}>
              Continue to Plans →
            </button>
          </motion.div>
        )}

        {/* Step 3: Plan Selection */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            style={{ flex: 1 }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>Choose Your Shield</h2>
            <p className="text-secondary text-sm mb-20">Select the coverage that fits your needs</p>

            <div className="tier-grid">
              {TIERS.map(tier => (
                <div
                  key={tier.id}
                  className={`tier-card ${selectedTier === tier.id ? 'selected' : ''} border-${tier.id}`}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{ borderColor: selectedTier === tier.id ? tier.color : undefined }}
                >
                  <div className="tier-badge" style={{ background: tier.color + '30', color: tier.color }}>
                    {tier.emoji}
                  </div>
                  <div className={`tier-name text-${tier.id}`}>{tier.name}</div>
                  <div className="tier-premium">
                    {loadingPremiums ? (
                      <div className="skeleton" style={{ width: 60, height: 28 }} />
                    ) : (
                      <>₹{(premiums[tier.id] || 0).toFixed(0)}<span>/wk</span></>
                    )}
                  </div>
                  <div className="text-xs text-secondary">
                    Max ₹{tier.maxPayout.toLocaleString()}/wk
                  </div>
                  <div className="text-xs text-hint mt-4">
                    {tier.triggers} triggers covered
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-accent mt-20" onClick={handleSubscribe} disabled={loading || !selectedTier}>
              {loading ? <span className="spinner" /> : '🛡️ Activate Protection'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
