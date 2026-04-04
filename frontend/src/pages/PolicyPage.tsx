import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ridersAPI, policiesAPI } from '../lib/api';
import { useAuthStore } from '../store/useAuth';

const TIERS = [
  { id: 'bronze', name: 'Bronze', emoji: '🥉', color: '#cd7f32', maxPayout: 500, triggers: 6, desc: 'Part-time (15–20 hrs/wk)' },
  { id: 'silver', name: 'Silver', emoji: '🥈', color: '#c0c0c0', maxPayout: 1000, triggers: 12, desc: 'Full-time (30–40 hrs/wk)' },
  { id: 'gold', name: 'Gold', emoji: '🥇', color: '#ffd700', maxPayout: 2000, triggers: 20, desc: 'High-volume (50+ hrs/wk)' },
  { id: 'platinum', name: 'Platinum', emoji: '💎', color: '#e2e8f0', maxPayout: 5000, triggers: 25, desc: 'Elite (6+ months, 1K+ orders)' },
];

const TRIGGER_CATEGORIES = [
  {
    icon: '🌧️', name: 'Weather Events', triggers: [
      'T1 — Heavy Rainfall (>40mm/hr)',
      'T2 — Flash Flood / Waterlogging',
      'T4 — Extreme Heat (>45°C)',
      'T5 — Cyclone / Storm Warning',
      'T6 — Hailstorm / Dust Storm',
      'T7 — Dense Fog (visibility <100m)',
    ]
  },
  {
    icon: '💨', name: 'Air Quality', triggers: [
      'T3 — Severe AQI (>350 for 4+ hrs)',
      'T8 — Toxic Gas Leak Advisory',
    ]
  },
  {
    icon: '🚦', name: 'Traffic & Transport', triggers: [
      'T9 — Complete Gridlock (>4× congestion)',
      'T10 — Road Closure / Barricade',
      'T11 — Bridge / Flyover Collapse',
      'T12 — Vehicle Breakdown Surge',
    ]
  },
  {
    icon: '📢', name: 'Civil & Social', triggers: [
      'T13 — Curfew / Section 144',
      'T14 — Bandh / General Strike',
      'T15 — Riot / Civil Unrest',
      'T16 — VIP Cordon / Election Duty',
    ]
  },
  {
    icon: '📱', name: 'Platform & Tech', triggers: [
      'T17 — Platform App Crash (>45 min)',
      'T18 — Payment Gateway Down',
      'T19 — GPS / Maps Outage',
      'T20 — Mass Order Cancellation',
    ]
  },
  {
    icon: '⚕️', name: 'Health & Safety Zones', triggers: [
      'T21 — Epidemic Zone Declaration',
      'T22 — Food Safety Emergency',
      'T23 — Containment Zone',
    ]
  },
];

const SRS_TABLE = [
  { range: '1 – 4', level: 'Minor', payout: '60%', color: 'var(--info)', desc: 'Partial disruption — some delivery possible' },
  { range: '5 – 7', level: 'Standard', payout: '80%', color: 'var(--warning)', desc: 'Moderate disruption affecting deliveries' },
  { range: '8 – 10', level: 'Severe', payout: '100%', color: 'var(--danger)', desc: 'Full stop — no delivery safely possible' },
];

export default function PolicyPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [premiums, setPremiums] = useState<Record<string, number>>({});
  const [loadingPremiums, setLoadingPremiums] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const riderId = useAuthStore(s => s.riderId);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await ridersAPI.getProfile();
      setProfile(res.data);
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const loadPremiums = async () => {
    setLoadingPremiums(true);
    const results: Record<string, number> = {};
    for (const tier of TIERS) {
      try {
        const res = await policiesAPI.getQuote({ rider_id: riderId || '', tier: tier.id });
        results[tier.id] = res.data.weekly_premium_rs;
      } catch {
        results[tier.id] = ({ bronze: 29, silver: 45, gold: 69, platinum: 99 } as any)[tier.id] || 29;
      }
    }
    setPremiums(results);
    setLoadingPremiums(false);
  };

  const handleChangePlan = () => {
    setShowChangePlan(true);
    loadPremiums();
  };

  const handleSubscribe = async () => {
    if (!selectedTier) return;
    setSubscribing(true);
    try {
      await policiesAPI.subscribe({ rider_id: riderId || '', tier: selectedTier });
      toast.success('Plan updated! 🎉');
      setShowChangePlan(false);
      loadProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update plan');
    } finally { setSubscribing(false); }
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  const policy = profile?.active_policy;
  const activeTier = TIERS.find(t => t.id === policy?.tier);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Policy</h1>
        <p className="page-subtitle">Coverage details · triggers · payout model</p>
      </div>

      <div className="page-content">
        {/* Active Policy Card */}
        {policy ? (
          <div className="card-hero">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-hint)', marginBottom: 4 }}>
                  Active Coverage
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                  {policy.tier} Shield
                </div>
                <span className="badge badge-success" style={{ marginTop: 6, display: 'inline-flex' }}>● Active</span>
              </div>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: (activeTier?.color || '#fff') + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
                border: `2px solid ${activeTier?.color || 'transparent'}44`,
              }}>
                {activeTier?.emoji}
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 20, gap: 16 }}>
              <div className="stat-cell">
                <div className="stat-label">Weekly Premium</div>
                <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  ₹{policy.weekly_premium_rs?.toFixed(0)}
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Max Weekly Payout</div>
                <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  ₹{policy.max_weekly_payout_rs?.toFixed(0)}
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Coverage Start</div>
                <div className="text-sm font-semibold">{policy.coverage_start}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Coverage End</div>
                <div className="text-sm font-semibold">{policy.coverage_end}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛡️</div>
            <div style={{ fontWeight: 700 }}>No Active Policy</div>
            <p className="text-secondary text-sm" style={{ marginTop: 4 }}>Subscribe to get started</p>
          </div>
        )}

        {/* Change Plan */}
        {!showChangePlan ? (
          <button className="btn btn-secondary" onClick={handleChangePlan}>
            ⇄ Change Plan
          </button>
        ) : (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 16 }}>Select New Plan</div>
            <div className="tier-grid" style={{ marginBottom: 16 }}>
              {TIERS.map(tier => (
                <div key={tier.id}
                  className={`tier-card ${selectedTier === tier.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{ borderColor: selectedTier === tier.id ? tier.color : undefined }}>
                  <div className="tier-badge" style={{ background: tier.color + '22', color: tier.color }}>
                    {tier.emoji}
                  </div>
                  <div className="tier-name" style={{ color: tier.color }}>{tier.name}</div>
                  <div className="tier-premium">
                    {loadingPremiums ? (
                      <div className="skeleton" style={{ width: 52, height: 20, margin: '0 auto' }} />
                    ) : (
                      <>₹{(premiums[tier.id] || 0).toFixed(0)}<span>/wk</span></>
                    )}
                  </div>
                  <div className="text-xs text-hint" style={{ marginTop: 4 }}>Max ₹{tier.maxPayout.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                onClick={() => { setShowChangePlan(false); setSelectedTier(''); }}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }}
                onClick={handleSubscribe} disabled={subscribing || !selectedTier}>
                {subscribing ? <span className="spinner" /> : 'Confirm Change'}
              </button>
            </div>
          </div>
        )}

        {/* SRS Payout Model */}
        <div>
          <div className="section-header">
            <span className="section-title">Payout Model (SRS)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SRS_TABLE.map(row => (
              <div key={row.range} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: row.color + '18',
                  border: `2px solid ${row.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '0.9rem',
                  color: row.color, flexShrink: 0,
                }}>
                  {row.payout}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    SRS {row.range} — {row.level}
                  </div>
                  <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{row.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="info-box" style={{ marginTop: 10 }}>
            <span>💡</span>
            <span className="text-xs">Dinner rush disruptions (7–10 PM) get an additional <strong>+20% surge bonus</strong> on top of the SRS payout.</span>
          </div>
        </div>

        {/* Covered Triggers */}
        <div>
          <div className="section-header" style={{ marginBottom: 12 }}>
            <span className="section-title">Covered Triggers</span>
            <span className="badge badge-accent">25+ triggers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TRIGGER_CATEGORIES.map(cat => (
              <div key={cat.name}>
                <div
                  className="accordion-header"
                  onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{cat.icon}</span> {cat.name}
                  </span>
                  <span style={{ color: 'var(--text-hint)', fontSize: '0.8rem' }}>
                    {expandedCategory === cat.name ? '▾' : '▸'}
                  </span>
                </div>
                {expandedCategory === cat.name && (
                  <div className="accordion-body">
                    {cat.triggers.map(t => (
                      <div key={t} className="trigger-item">{t}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* No-Claim Rewards */}
        <div>
          <div className="section-header" style={{ marginBottom: 12 }}>
            <span className="section-title">No-Claim Rewards</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { milestone: '5 clean weeks', reward: '1 free week (~17% discount)', icon: '🎁' },
              { milestone: '15 clean weeks', reward: 'Tier upgrade for 2 weeks', icon: '⬆️' },
              { milestone: 'Refer a rider', reward: 'Both get 1 free week', icon: '🤝' },
            ].map(r => (
              <div key={r.milestone} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
                <span style={{ fontSize: '1.3rem' }}>{r.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{r.milestone}</div>
                  <div className="text-xs text-secondary">{r.reward}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
