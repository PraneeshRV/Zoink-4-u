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

const PLATFORMS = [
  { id: 'swiggy', name: 'Swiggy', icon: '🍊' },
  { id: 'zomato', name: 'Zomato', icon: '🔴' },
];

const TIERS = [
  {
    id: 'bronze', name: 'Bronze', emoji: '🥉', color: '#cd7f32',
    maxPayout: 800, triggers: 6, basePrice: 29,
    desc: 'Part-time riders (15–20 hrs/wk)',
    coverage: 'Environmental only',
    perks: ['Core weather protection', 'Basic WhatsApp alerts'],
  },
  {
    id: 'silver', name: 'Silver', emoji: '🥈', color: '#c0c0c0',
    maxPayout: 1500, triggers: 15, basePrice: 45,
    desc: 'Full-time riders (30–40 hrs/wk)',
    coverage: '+ Social/Civil disruptions',
    perks: ['Bandh & curfew coverage', 'Strike protection', 'Weekly summary reports'],
  },
  {
    id: 'gold', name: 'Gold', emoji: '🥇', color: '#ffd700',
    maxPayout: 2800, triggers: 25, basePrice: 69,
    desc: 'High-volume riders (50+ hrs/wk)',
    coverage: 'All 25+ triggers',
    perks: ['No-Claim Rewards (5 weeks = 1 free)', 'Platform crash coverage', 'Peak hour surge compensation'],
  },
  {
    id: 'platinum', name: 'Platinum', emoji: '💎', color: '#a78bfa',
    maxPayout: 4000, triggers: 25, basePrice: 99,
    desc: 'Elite riders (6+ months, 1K+ orders)',
    coverage: 'All 25+ triggers',
    perks: ['AI auto-approve in 1 hour', '₹200 Emergency Micro-Advance', 'Priority fraud clearance', 'Loyalty rate (flat 2%)'],
  },
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
  const [premiums, setPremiums] = useState<Record<string, any>>({});
  const [loadingPremiums, setLoadingPremiums] = useState(false);
  const [riderId, setRiderId] = useState('');

  // Step 4: Razorpay Mock
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);
  const [paymentDone, setPaymentDone] = useState(false);

  const handleSendOTP = () => {
    if (!name || !phone || !aadhaarLast4) {
      toast.error('Please fill all fields');
      return;
    }
    if (phone.length !== 10) { toast.error('Enter valid 10-digit phone'); return; }
    if (aadhaarLast4.length !== 4) { toast.error('Enter last 4 digits of Aadhaar'); return; }
    setOtpSent(true);
    toast.success('OTP sent to Aadhaar-linked mobile! Use 123456 for demo');
  };

  const handleVerifyOTP = async () => {
    if (!otp) { toast.error('Enter the OTP'); return; }
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
      toast.success(`Welcome, ${res.data.name}! Aadhaar verified ✅`);
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkProfile = () => {
    const selectedZone = ZONES.find(z => z.value === zone);
    if (city === '' && selectedZone) setCity(selectedZone.city);
    setStep(3);
    fetchPremiums();
  };

  const fetchPremiums = async () => {
    setLoadingPremiums(true);
    const results: Record<string, any> = {};
    for (const tier of TIERS) {
      try {
        const res = await policiesAPI.getQuote({ rider_id: riderId, tier: tier.id });
        results[tier.id] = {
          price: res.data.weekly_premium_rs,
          maxPayout: res.data.max_weekly_payout_rs,
          triggers: res.data.covered_triggers,
        };
      } catch {
        try {
          const mlRes = await mlEngineAPI.calculatePremium({
            zone_h3: zone, city: city || 'Chennai', tier: tier.id,
            work_hours_per_week: 40, platform, zoink_score: 50,
          });
          results[tier.id] = {
            price: mlRes.data.premium_rs,
            maxPayout: tier.maxPayout,
            triggers: tier.triggers,
            breakdown: mlRes.data.breakdown,
          };
        } catch {
          results[tier.id] = { price: tier.basePrice, maxPayout: tier.maxPayout, triggers: tier.triggers };
        }
      }
    }
    setPremiums(results);
    setLoadingPremiums(false);
  };

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
  };

  const handleProceedPayment = () => {
    if (!selectedTier) { toast.error('Please select a plan'); return; }
    setShowPayment(true);
    setPaymentStep(0);
    // Animate payment steps
    const steps = [1, 2, 3, 4, 5];
    steps.forEach((s, i) => {
      setTimeout(() => setPaymentStep(s), (i + 1) * 800);
    });
    setTimeout(() => {
      setPaymentDone(true);
    }, steps.length * 800 + 500);
  };

  const handleFinalActivate = async () => {
    setLoading(true);
    try {
      await policiesAPI.subscribe({ rider_id: riderId, tier: selectedTier });
      toast.success('Policy activated! Welcome to Zoink-4-u 🛡️');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedZoneObj = ZONES.find(z => z.value === zone);
  const selectedTierObj = TIERS.find(t => t.id === selectedTier);

  return (
    <div style={{ padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          <span className="gradient-text">Zoink-4-u</span>
        </h1>
        <p className="text-secondary text-sm">Income Protection for Food Delivery Partners</p>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {[1, 2, 3].map(s => (
          <div key={s} className={`step-dot ${s === step ? 'active' : s < step ? 'done' : ''}`}>
            <span style={{ fontSize: '0.55rem', position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', color: s <= step ? 'var(--primary-400)' : 'var(--text-hint)' }}>
              {s === 1 ? 'Aadhaar KYC' : s === 2 ? 'Work Profile' : 'Choose Plan'}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Identity Verification */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>🔐 Aadhaar Identity Verification</h2>
            <p className="text-secondary text-sm mb-20">Secure e-KYC via UIDAI — we never store your Aadhaar number</p>

            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input-field" placeholder="e.g. Deepak Kumar" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input className="input-field" placeholder="e.g. 9876543210" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} type="tel" />
            </div>
            <div className="input-group">
              <label className="input-label">Aadhaar Last 4 Digits</label>
              <input className="input-field" placeholder="e.g. 1234" value={aadhaarLast4} onChange={e => setAadhaarLast4(e.target.value)} maxLength={4} />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-hint)', marginTop: 4 }}>
                🔒 Only a one-way token is stored — compliant with Aadhaar Act 2016 & DPDP Act 2023
              </p>
            </div>

            {!otpSent ? (
              <button className="btn btn-primary" onClick={handleSendOTP}>📱 Send Aadhaar OTP</button>
            ) : (
              <>
                <div className="input-group">
                  <label className="input-label">Enter OTP</label>
                  <input className="input-field" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-hint)', marginTop: 4 }}>💡 Use <strong>123456</strong> for demo</p>
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
                  onClick={() => {
                    const p = prompt('Enter your phone number:');
                    if (p) {
                      authAPI.login({ phone: p, mock_otp: '123456' })
                        .then(r => { login(r.data.access_token, r.data.rider_id, r.data.name); navigate('/dashboard'); })
                        .catch(() => toast.error('Login failed'));
                    }
                  }}>Log In</button>
              </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button className="btn-ghost text-xs" style={{ color: 'var(--text-hint)' }} onClick={() => navigate('/admin')}>🔧 Admin Panel</button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Work Profile */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>🏍️ Work Profile</h2>
            <p className="text-secondary text-sm mb-20">Tell us about your food delivery work</p>

            <div className="input-group">
              <label className="input-label">Delivery Platform</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {PLATFORMS.map(p => (
                  <button key={p.id}
                    className={`platform-btn ${platform === p.id ? 'selected' : ''}`}
                    onClick={() => setPlatform(p.id)}
                    style={{
                      flex: 1, padding: '14px 16px', borderRadius: 12,
                      border: `2px solid ${platform === p.id ? 'var(--primary-400)' : 'var(--border-default)'}`,
                      background: platform === p.id ? 'rgba(20, 184, 166, 0.1)' : 'var(--surface-card)',
                      color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-hint)', marginTop: 6 }}>
                🍔 Zoink-4-u covers <strong>food delivery partners</strong> only — platform-agnostic, one policy covers all apps
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">Delivery Zone (H3 Hexagon)</label>
              <select className="input-field" value={zone} onChange={e => { setZone(e.target.value); const z = ZONES.find(z => z.value === e.target.value); if (z) setCity(z.city); }}>
                {ZONES.map(z => (<option key={z.value} value={z.value}>{z.label}</option>))}
              </select>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-hint)', marginTop: 4 }}>
                📍 Uses Uber H3 hexagonal grid (500m precision) for hyper-local trigger accuracy
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">City</label>
              <input className="input-field" value={city || ZONES.find(z => z.value === zone)?.city || ''} onChange={e => setCity(e.target.value)} placeholder="City" />
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Shift Start</label>
                <input className="input-field" type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Shift End</label>
                <input className="input-field" type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} />
              </div>
            </div>

            <button className="btn btn-primary mt-12" onClick={handleWorkProfile}>Continue to Plans →</button>
          </motion.div>
        )}

        {/* Step 3: Plan Selection */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>🛡️ Choose Your Shield</h2>
            <p className="text-secondary text-sm">Pricing powered by our <strong>Dynamic Gig-Risk Index (DGRI)</strong> AI model</p>

            {/* DGRI Explanation */}
            <div style={{
              margin: '12px 0 16px', padding: '10px 14px', borderRadius: 10,
              background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.2)',
              fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5,
            }}>
              <strong style={{ color: 'var(--primary-400)' }}>🧠 How DGRI Pricing Works:</strong><br />
              Your premium is calculated in real-time by our Gradient Boosting ML model using: <strong>zone risk score</strong> (historical disruptions in {selectedZoneObj?.label || 'your zone'}), <strong>seasonal factors</strong> (monsoon = higher), <strong>work hours exposure</strong>, and your <strong>Zoink Trust Score</strong>. Premium never exceeds 2% of estimated weekly earnings.
            </div>

            <div className="tier-grid">
              {TIERS.map(tier => {
                const tierData = premiums[tier.id];
                const price = tierData?.price || tier.basePrice;
                const isSelected = selectedTier === tier.id;
                return (
                  <div key={tier.id}
                    className={`tier-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectTier(tier.id)}
                    style={{
                      borderColor: isSelected ? tier.color : undefined,
                      position: 'relative',
                    }}>
                    {tier.id === 'gold' && (
                      <div style={{
                        position: 'absolute', top: -8, right: 12, background: 'var(--warning)',
                        color: '#000', fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px',
                        borderRadius: 8, letterSpacing: 0.5,
                      }}>POPULAR</div>
                    )}
                    <div className="tier-badge" style={{ background: tier.color + '30', color: tier.color }}>
                      {tier.emoji}
                    </div>
                    <div style={{ color: tier.color, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.9rem' }}>
                      {tier.name}
                    </div>
                    <div className="tier-premium" style={{ margin: '6px 0 2px' }}>
                      {loadingPremiums ? (
                        <div className="skeleton" style={{ width: 60, height: 28 }} />
                      ) : (
                        <>₹{Math.round(price)}<span style={{ fontSize: '0.75rem', opacity: 0.7 }}>/wk</span></>
                      )}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--primary-400)', opacity: 0.9, marginBottom: 6 }}>
                      DGRI calculated for your zone
                    </div>
                    <div className="text-xs text-secondary">
                      Max ₹{tier.maxPayout.toLocaleString()}/wk • {tier.triggers} triggers
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-hint)', marginTop: 4 }}>
                      {tier.desc}
                    </div>

                    {/* Perks */}
                    {isSelected && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: tier.color, marginBottom: 4 }}>INCLUDES:</div>
                        {tier.perks.map((p, i) => (
                          <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '2px 0' }}>✓ {p}</div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Coverage exclusion notice */}
            <div style={{ margin: '12px 0', padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: '0.7rem', color: 'var(--text-hint)' }}>
              ⚠️ <strong>Not covered:</strong> Health, life, accidents, vehicle repairs, platform bans, voluntary non-work, wars, pandemics. We only cover <strong>involuntary income loss</strong> from external disruptions.
            </div>

            <button className="btn btn-accent mt-8" onClick={handleProceedPayment} disabled={loading || !selectedTier}>
              {loading ? <span className="spinner" /> : `💳 Proceed to Payment — ₹${Math.round(premiums[selectedTier]?.price || 0)}/wk`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Razorpay Mock Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => { if (paymentDone) { setShowPayment(false); } }}>
          <motion.div className="modal-content" onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              background: '#fff', borderRadius: 16, maxWidth: 420, width: '90%',
              padding: 0, overflow: 'hidden', color: '#1a1a2e',
            }}>
            {/* Razorpay Header */}
            <div style={{
              background: 'linear-gradient(135deg, #2B63F6, #3772FF)',
              padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem', color: '#2B63F6' }}>R</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Razorpay</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>Test Mode — Sandbox</div>
                </div>
              </div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
                ₹{Math.round(premiums[selectedTier]?.price || 0)}
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Merchant info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 12px', background: '#f8f9fa', borderRadius: 8 }}>
                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #14b8a6, #0d9488)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.8rem' }}>Z4U</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Zoink-4-u Insurance Platform</div>
                  <div style={{ fontSize: '0.7rem', color: '#666' }}>{selectedTierObj?.name} Shield — Weekly Policy</div>
                </div>
              </div>

              {/* Payment steps animation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { step: 1, icon: '🏦', label: 'Connecting to UPI...', done: 'UPI ID verified' },
                  { step: 2, icon: '📋', label: 'Creating Razorpay order...', done: `Order #rzp_test_${Date.now().toString(36)} created` },
                  { step: 3, icon: '🔐', label: 'Processing payment...', done: 'Payment authorized' },
                  { step: 4, icon: '✅', label: 'Confirming transaction...', done: `TXN: pay_mock_${Math.random().toString(36).slice(2, 10)}` },
                  { step: 5, icon: '🛡️', label: 'Activating policy...', done: `${selectedTierObj?.name} Shield active for 90 days` },
                ].map(s => (
                  <motion.div key={s.step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: paymentStep >= s.step ? 1 : 0.3, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8,
                      background: paymentStep >= s.step ? '#f0fdf4' : '#f8f9fa',
                      border: `1px solid ${paymentStep >= s.step ? '#86efac' : '#e5e7eb'}`,
                    }}>
                    <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: paymentStep >= s.step ? '#16a34a' : '#9ca3af' }}>
                        {paymentStep >= s.step ? s.done : s.label}
                      </div>
                    </div>
                    {paymentStep >= s.step && <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>}
                  </motion.div>
                ))}
              </div>

              {/* Complete button */}
              {paymentDone && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>
                  <div style={{
                    textAlign: 'center', padding: '12px', background: '#f0fdf4',
                    borderRadius: 10, border: '1px solid #86efac', marginBottom: 12,
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>🎉</div>
                    <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '1rem' }}>Payment Successful!</div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 4 }}>
                      ₹{Math.round(premiums[selectedTier]?.price || 0)} debited via UPI • Coverage starts immediately
                    </div>
                  </div>
                  <button onClick={handleFinalActivate} disabled={loading}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 10,
                      background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                      color: '#fff', fontWeight: 800, fontSize: '1rem', border: 'none',
                      cursor: 'pointer',
                    }}>
                    {loading ? 'Activating...' : '🛡️ Go to Dashboard'}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
