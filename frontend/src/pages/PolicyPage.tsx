import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ridersAPI, policiesAPI, mlEngineAPI } from '../lib/api';
import { useAuthStore } from '../store/useAuth';

const TIERS = [
  { id: 'bronze', name: 'Bronze', emoji: '🥉', color: '#cd7f32', maxPayout: 500, triggers: 6, desc: 'Part-time (15–20 hrs/wk)' },
  { id: 'silver', name: 'Silver', emoji: '🥈', color: '#c0c0c0', maxPayout: 1000, triggers: 12, desc: 'Full-time (30–40 hrs/wk)' },
  { id: 'gold', name: 'Gold', emoji: '🥇', color: '#ffd700', maxPayout: 2000, triggers: 20, desc: 'High-volume (50+ hrs/wk)' },
  { id: 'platinum', name: 'Platinum', emoji: '💎', color: '#e2e8f0', maxPayout: 5000, triggers: 25, desc: 'Elite (6+ months, 1K+ orders)' },
];

const TRIGGER_CATEGORIES = [
  {
    name: 'Weather Events', triggers: [
      'T1 — Heavy Rainfall (>40mm/hr)', 'T2 — Flooding / Waterlogging',
      'T4 — Extreme Heat (>45°C)', 'T5 — Cyclone Warning',
      'T6 — Hailstorm / Dust Storm',
    ]
  },
  {
    name: 'Air Quality', triggers: [
      'T3 — Severe AQI (>350)', 'T7 — Toxic Gas Leak Advisory',
    ]
  },
  {
    name: 'Traffic & Transport', triggers: [
      'T9 — Complete Gridlock (>4x congestion)', 'T10 — Road Closure / Barricade',
      'T11 — Bridge/Flyover Collapse', 'T12 — Vehicle Breakdown Surge',
    ]
  },
  {
    name: 'Civil & Social', triggers: [
      'T13 — Curfew / Section 144', 'T14 — Bandh / Strike',
      'T15 — Riot / Civil Unrest', 'T16 — Election Duty Zone',
    ]
  },
  {
    name: 'Platform & Tech', triggers: [
      'T17 — Platform App Crash (>2hr)', 'T18 — Payment Gateway Down',
      'T19 — GPS/Maps Outage', 'T20 — Mass Order Cancellation',
    ]
  },
  {
    name: 'Health & Safety', triggers: [
      'T21 — Epidemic Zone Declaration', 'T22 — Food Safety Scare',
      'T23 — Rider Accident Surge Zone', 'T24 — Hospital Emergency Zone',
      'T25 — Containment Zone',
    ]
  },
];

const SRS_TABLE = [
  { range: 'SRS 1-4', level: 'Minor', payout: '60%', desc: 'Short, low-severity disruption' },
  { range: 'SRS 5-7', level: 'Standard', payout: '80%', desc: 'Moderate disruption affecting deliveries' },
  { range: 'SRS 8-10', level: 'Severe', payout: '100%', desc: 'Full disruption — no delivery possible' },
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

  useEffect(() => {
    loadProfile();
  }, []);

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
        results[tier.id] = { bronze: 29, silver: 45, gold: 69, platinum: 99 }[tier.id] || 29;
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🛡️ Your Policy</h1>
        <p className="page-subtitle">Coverage details and triggers</p>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Active Policy Card */}
        {policy ? (
          <div className="card-gradient">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div className="text-xs" style={{ opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Active Coverage
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', marginTop: 4 }}>
                  {policy.tier} Shield
                </div>
              </div>
              <span style={{ fontSize: '2rem' }}>
                {TIERS.find(t => t.id === policy.tier)?.emoji}
              </span>
            </div>
            <div className="grid-2 mt-16">
              <div>
                <div className="text-xs" style={{ opacity: 0.7 }}>Premium</div>
                <div className="font-mono font-bold">₹{policy.weekly_premium_rs?.toFixed(2)}/wk</div>
              </div>
              <div>
                <div className="text-xs" style={{ opacity: 0.7 }}>Max Payout</div>
                <div className="font-mono font-bold">₹{policy.max_weekly_payout_rs?.toFixed(0)}/wk</div>
              </div>
              <div>
                <div className="text-xs" style={{ opacity: 0.7 }}>Coverage Start</div>
                <div className="font-bold text-sm">{policy.coverage_start}</div>
              </div>
              <div>
                <div className="text-xs" style={{ opacity: 0.7 }}>Coverage End</div>
                <div className="font-bold text-sm">{policy.coverage_end}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center p-20">
            <p>No active policy</p>
          </div>
        )}

        {/* Change Plan */}
        <button className="btn btn-outline" onClick={handleChangePlan}>
          🔄 Change Plan
        </button>

        {showChangePlan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontWeight: 700 }}>Select New Plan</h3>
            <div className="tier-grid">
              {TIERS.map(tier => (
                <div key={tier.id}
                  className={`tier-card ${selectedTier === tier.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{ borderColor: selectedTier === tier.id ? tier.color : undefined }}>
                  <div style={{ color: tier.color, fontWeight: 800, textTransform: 'uppercase' }}>{tier.emoji} {tier.name}</div>
                  <div className="tier-premium font-mono">
                    {loadingPremiums ? <div className="skeleton" style={{ width: 60, height: 24 }} /> :
                      <>₹{(premiums[tier.id] || 0).toFixed(0)}<span className="text-secondary">/wk</span></>}
                  </div>
                  <div className="text-xs text-hint">Max ₹{tier.maxPayout}/wk</div>
                </div>
              ))}
            </div>
            <button className="btn btn-accent" onClick={handleSubscribe} disabled={subscribing || !selectedTier}>
              {subscribing ? <span className="spinner" /> : 'Confirm Plan Change'}
            </button>
          </div>
        )}

        {/* Covered Triggers */}
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🎯 Covered Triggers</h3>
          {TRIGGER_CATEGORIES.map(cat => (
            <div key={cat.name} style={{ marginBottom: 8 }}>
              <div className="accordion-header"
                onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}>
                <span>{cat.name}</span>
                <span>{expandedCategory === cat.name ? '▾' : '▸'}</span>
              </div>
              {expandedCategory === cat.name && (
                <div className="accordion-body">
                  {cat.triggers.map(t => (
                    <div key={t} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SRS Payout Table */}
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>📊 Payout Tiers (SRS)</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SRS Range</th><th>Level</th><th>Payout %</th><th>Description</th>
                </tr>
              </thead>
              <tbody>
                {SRS_TABLE.map(row => (
                  <tr key={row.range}>
                    <td className="font-mono font-bold">{row.range}</td>
                    <td>{row.level}</td>
                    <td className="font-mono" style={{ color: 'var(--success)' }}>{row.payout}</td>
                    <td className="text-secondary">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
