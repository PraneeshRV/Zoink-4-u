import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ridersAPI, policiesAPI, mlEngineAPI } from '../lib/api';
import { useAuthStore } from '../store/useAuth';

const TIERS = [
  {
    id: 'bronze', name: 'Bronze', emoji: '🥉', color: '#cd7f32',
    maxPayout: 800, triggers: 6, basePrice: 29,
    desc: 'Part-time (15–20 hrs/wk)', coverage: 'Environmental only',
    perks: ['Core weather protection', 'Basic WhatsApp alerts', 'Weekly summary'],
  },
  {
    id: 'silver', name: 'Silver', emoji: '🥈', color: '#c0c0c0',
    maxPayout: 1500, triggers: 15, basePrice: 45,
    desc: 'Full-time (30–40 hrs/wk)', coverage: '+ Social/Civil disruptions',
    perks: ['Bandh & curfew coverage', 'Strike protection', 'Weekly reports', 'Vernacular WhatsApp alerts'],
  },
  {
    id: 'gold', name: 'Gold', emoji: '🥇', color: '#ffd700',
    maxPayout: 2800, triggers: 25, basePrice: 69,
    desc: 'High-volume (50+ hrs/wk)', coverage: 'All 25+ triggers',
    perks: ['No-Claim Rewards (5 wks = 1 free)', 'Platform crash coverage', 'Peak hour surge compensation', 'Community trust signals'],
  },
  {
    id: 'platinum', name: 'Platinum', emoji: '💎', color: '#a78bfa',
    maxPayout: 4000, triggers: 25, basePrice: 99,
    desc: 'Elite (6+ months, 1K+ orders)', coverage: 'All 25+ triggers',
    perks: ['AI auto-approve in 1 hour', '₹200 Emergency Micro-Advance', 'Priority fraud clearance', 'Loyalty rate (flat 2%)', 'Financial identity building'],
  },
];

const TRIGGER_CATEGORIES = [
  { name: '🌧️ Environmental (11 triggers)', triggers: [
    'T1 — Heavy Rainfall (>40mm/hr, ≥2hrs)', 'T2 — Flash Flood (>150mm/12hrs)',
    'T3 — Severe AQI (>350, ≥4hrs)', 'T4 — Extreme Heat (>45°C, ≥3hrs)',
    'T5 — Cyclone Warning (NDMA alert)', 'T6 — Hailstorm / Dust Storm',
    'T7 — Dense Fog (visibility <100m)', 'T8 — Lightning (DAMINI alert)',
    'T9 — Earthquake (≥4.0 magnitude)', 'T10 — Extreme Cold Wave (<4°C)',
    'T11 — Waterlogging (sustained flooding)',
  ]},
  { name: '🚨 Social & Civil (9 triggers)', triggers: [
    'T12 — Curfew / Section 144', 'T13 — Bandh / General Strike',
    'T14 — VIP Cordon / Road Block', 'T15 — Protests / Demonstration',
    'T16 — Religious Procession (road closure)', 'T17 — Political Rally',
    'T18 — Communal Tension Advisory', 'T19 — Market Zone Closure',
    'T20 — Gridlock Paralysis (>4x congestion)',
  ]},
  { name: '🔧 Infrastructure (6 triggers)', triggers: [
    'T21 — Road / Bridge Collapse', 'T22 — Power Grid Failure (zone-wide)',
    'T23 — Telecom Outage (network down)', 'T24 — Gas Leak Evacuation',
    'T25 — Platform Server Crash (app down >45min)', 'T26 — LPG Supply Crisis (restaurants can\'t cook)',
  ]},
  { name: '📜 Regulatory (3 triggers)', triggers: [
    'T27 — GRAP / Odd-Even Order', 'T28 — Quarantine Lockdown Zone',
    'T29 — Emergency Road Closure (govt ordered)',
  ]},
];

const SRS_TABLE = [
  { range: 'SRS 1-4', level: 'Minor', payout: '60%', color: '#fbbf24', desc: 'Short, low-severity — encourages riding if safe' },
  { range: 'SRS 5-7', level: 'Standard', payout: '80%', color: '#3b82f6', desc: 'Moderate disruption — covers rent & food' },
  { range: 'SRS 8-10', level: 'Severe', payout: '100%', color: '#ef4444', desc: 'Full disruption — you should NOT be on the road' },
];

const NO_CLAIM_REWARDS = [
  { milestone: '5 clean weeks', reward: '1 week free (premium refunded) — ~17% discount' },
  { milestone: '15 clean weeks', reward: 'Tier upgrade for 2 weeks (higher coverage, same price)' },
  { milestone: 'Referral', reward: 'Both referrer and referee get 1 free week' },
  { milestone: 'Streak badges', reward: 'Shareable on WhatsApp for bragging rights' },
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
  const [activeTab, setActiveTab] = useState<'coverage' | 'triggers' | 'payouts' | 'rewards'>('coverage');
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
        results[tier.id] = tier.basePrice;
      }
    }
    setPremiums(results);
    setLoadingPremiums(false);
  };

  const handleChangePlan = () => { setShowChangePlan(true); loadPremiums(); };

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
  const currentTierObj = TIERS.find(t => t.id === policy?.tier);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🛡️ Your Policy</h1>
        <p className="page-subtitle">Coverage details, triggers & rewards</p>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Active Policy Card */}
        {policy ? (
          <div className="card-gradient">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div className="text-xs" style={{ opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Active Coverage</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', marginTop: 4 }}>
                  {policy.tier} Shield {currentTierObj?.emoji}
                </div>
              </div>
            </div>
            <div className="grid-2 mt-16">
              <div>
                <div className="text-xs" style={{ opacity: 0.7 }}>Weekly Premium</div>
                <div className="font-mono font-bold">₹{policy.weekly_premium_rs?.toFixed(2)}/wk</div>
                <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>DGRI dynamic rate</div>
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
            {currentTierObj && (
              <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 10 }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: 4 }}>TIER PERKS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {currentTierObj.perks.map((p, i) => (
                    <span key={i} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: 6 }}>✓ {p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card text-center p-20"><p>No active policy</p></div>
        )}

        <button className="btn btn-outline" onClick={handleChangePlan}>🔄 Change Plan</button>

        {showChangePlan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ fontWeight: 700 }}>Select New Plan</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)', marginBottom: 4 }}>
              🧠 Premiums calculated by DGRI AI model based on your zone risk, season & Zoink Score
            </div>
            <div className="tier-grid">
              {TIERS.map(tier => (
                <div key={tier.id} className={`tier-card ${selectedTier === tier.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{ borderColor: selectedTier === tier.id ? tier.color : undefined }}>
                  <div style={{ color: tier.color, fontWeight: 800, textTransform: 'uppercase' }}>{tier.emoji} {tier.name}</div>
                  <div className="tier-premium font-mono">
                    {loadingPremiums ? <div className="skeleton" style={{ width: 60, height: 24 }} /> :
                      <>₹{(premiums[tier.id] || tier.basePrice).toFixed(0)}<span className="text-secondary">/wk</span></>}
                  </div>
                  <div className="text-xs text-hint">Max ₹{tier.maxPayout.toLocaleString()}/wk • {tier.triggers} triggers</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-hint)', marginTop: 2 }}>{tier.desc}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-accent" onClick={handleSubscribe} disabled={subscribing || !selectedTier}>
              {subscribing ? <span className="spinner" /> : 'Confirm Plan Change'}
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-default)', paddingBottom: 0 }}>
          {([
            { key: 'coverage', label: '📋 Coverage' },
            { key: 'triggers', label: '🎯 Triggers' },
            { key: 'payouts', label: '📊 Payouts' },
            { key: 'rewards', label: '🏆 Rewards' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600,
                background: 'none', border: 'none', color: activeTab === tab.key ? 'var(--primary-400)' : 'var(--text-hint)',
                borderBottom: activeTab === tab.key ? '2px solid var(--primary-400)' : '2px solid transparent',
                cursor: 'pointer',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Coverage Tab */}
        {activeTab === 'coverage' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>📋 All Tiers Comparison</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Tier</th><th>Premium</th><th>Max Payout</th><th>Triggers</th><th>Coverage</th></tr>
                </thead>
                <tbody>
                  {TIERS.map(t => (
                    <tr key={t.id} style={{ background: policy?.tier === t.id ? 'rgba(20, 184, 166, 0.08)' : undefined }}>
                      <td><span style={{ color: t.color, fontWeight: 700 }}>{t.emoji} {t.name}</span></td>
                      <td className="font-mono">~₹{t.basePrice}/wk</td>
                      <td className="font-mono">₹{t.maxPayout.toLocaleString()}</td>
                      <td>{t.triggers}</td>
                      <td className="text-xs">{t.coverage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Exclusions */}
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>⛔ Coverage Exclusions</h4>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-hint)', lineHeight: 1.8 }}>
                {['War & Insurrection', 'Terrorism & Sabotage', 'Pandemics / Epidemics', 'Nuclear / Biological Events',
                  'Platform Account Actions (bans)', 'Voluntary Non-Work', 'Pre-Existing Events'].map((e, i) => (
                  <span key={i} style={{ display: 'inline-block', background: 'rgba(239,68,68,0.08)', padding: '2px 8px', borderRadius: 6, marginRight: 6, marginBottom: 4 }}>✕ {e}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Triggers Tab */}
        {activeTab === 'triggers' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>🎯 25+ Parametric Triggers (4 Categories)</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-hint)', marginBottom: 12 }}>
              Each trigger has: precise threshold, exact API source, known fraud vector, and anti-fraud check. Monitored every 15 minutes via live APIs.
            </p>
            {TRIGGER_CATEGORIES.map(cat => (
              <div key={cat.name} style={{ marginBottom: 8 }}>
                <div className="accordion-header" onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}>
                  <span>{cat.name}</span>
                  <span>{expandedCategory === cat.name ? '▾' : '▸'}</span>
                </div>
                {expandedCategory === cat.name && (
                  <div className="accordion-body">
                    {cat.triggers.map(t => (
                      <div key={t} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>{t}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>📊 Payout Model — SRS Sliding Scale</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-hint)', marginBottom: 12 }}>
              Payouts are calculated using a 13-parameter Scenario Risk Score (SRS). This prevents moral hazard — riders don't prefer disruption days.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SRS_TABLE.map(row => (
                <div key={row.range} className="card" style={{ padding: 14, borderLeft: `4px solid ${row.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="font-mono font-bold" style={{ fontSize: '0.9rem' }}>{row.range} — {row.level}</div>
                      <div className="text-xs text-hint" style={{ marginTop: 2 }}>{row.desc}</div>
                    </div>
                    <div className="font-mono font-bold" style={{ fontSize: '1.2rem', color: row.color }}>{row.payout}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card" style={{ marginTop: 12, padding: 12, background: 'rgba(20, 184, 166, 0.06)', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary-400)', marginBottom: 4 }}>⏰ Peak Hour Surge Compensation</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Disruptions during dinner rush (7-10 PM) get a <strong>20% payout boost</strong> to compensate for lost surge/incentive pricing.
                Example: 3 lost peak hours × ₹80/hr × 1.2 = ₹288
              </div>
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>🏆 No-Claim Rewards</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-hint)', marginBottom: 12 }}>
              Rewards for honest behavior — reduces loss ratio AND increases your savings.
            </p>
            {NO_CLAIM_REWARDS.map((r, i) => (
              <div key={i} className="card" style={{ padding: 12, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-400)' }}>{r.milestone}</div>
                <div className="text-xs text-secondary" style={{ marginTop: 2 }}>{r.reward}</div>
              </div>
            ))}
            <div className="card" style={{ marginTop: 8, padding: 12, background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#a855f7', marginBottom: 4 }}>💎 Financial Identity Building</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                6+ months on Zoink-4-u builds your financial identity. Insurance history becomes a credit signal for fintech lenders — opens doors to pre-approved microloans.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
