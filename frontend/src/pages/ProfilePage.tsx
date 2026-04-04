import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ridersAPI } from '../lib/api';
import { useAuthStore } from '../store/useAuth';
import ZoinkScoreRing from '../components/ZoinkScoreRing';

const PLATFORM_ICONS: Record<string, string> = {
  swiggy: '🧡', zomato: '❤️', zepto: '💜', amazon: '📦', flipkart: '🛒',
};

const SCORE_TIERS: { min: number; label: string; color: string; desc: string }[] = [
  { min: 70, label: 'Trusted', color: 'var(--success)', desc: 'Auto-approve + 15% premium discount' },
  { min: 40, label: 'Standard', color: 'var(--warning)', desc: 'Normal ML pipeline processing' },
  { min: 0, label: 'Watch', color: 'var(--danger)', desc: 'Manual review + 25% surcharge' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);

  useEffect(() => {
    ridersAPI.getProfile()
      .then(res => setProfile(res.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/onboarding');
    toast.success('Logged out');
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!profile) return <div className="empty-state"><div className="empty-text">Profile not found</div></div>;

  const scoreTier = SCORE_TIERS.find(s => profile.zoink_score >= s.min) || SCORE_TIERS[2];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your identity · Zoink Score · account</p>
      </div>

      <div className="page-content">
        {/* Identity Card */}
        <div className="card-hero" style={{ textAlign: 'center', paddingTop: 28, paddingBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--bg-overlay)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', margin: '0 auto 12px',
            border: '2px solid var(--border-strong)',
          }}>
            {PLATFORM_ICONS[profile.platform] || '🚴'}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 2 }}>{profile.name}</h2>
          <p className="text-secondary text-sm">
            {profile.platform?.toUpperCase()} Delivery Partner
          </p>
          {profile.is_verified && (
            <span className="badge badge-success" style={{ marginTop: 8, display: 'inline-flex' }}>
              ✅ Aadhaar Verified
            </span>
          )}

          {/* Score Ring */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <ZoinkScoreRing score={profile.zoink_score} size={110} />
          </div>
          <div style={{
            marginTop: 8,
            fontSize: '0.82rem', fontWeight: 600,
            color: scoreTier.color,
          }}>
            {scoreTier.label} — {scoreTier.desc}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>Zoink Score Tiers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SCORE_TIERS.map(tier => (
              <div key={tier.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: tier.color, flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{tier.label}</div>
                  <div className="text-xs text-secondary">{tier.desc}</div>
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.78rem', color: tier.color, fontWeight: 700,
                  background: tier.color + '18', padding: '2px 8px', borderRadius: '100px',
                }}>
                  {tier.min === 0 ? '< 40' : tier.min === 40 ? '40–69' : '70–100'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Details */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>Account Details</div>
          {[
            { label: '📱 Phone', value: profile.phone },
            { label: '📍 City', value: profile.city },
            { label: '🗺️ Zone ID', value: profile.zone_h3 },
            { label: '⏰ Shift', value: `${profile.shift_start} — ${profile.shift_end}` },
            { label: '🚘 Platform', value: profile.platform?.toUpperCase() },
          ].map((item, i) => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 0',
              borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <span className="text-sm text-secondary">{item.label}</span>
              <span className="text-sm font-semibold">{item.value ?? '—'}</span>
            </div>
          ))}
        </div>

        {/* Active Policy */}
        {profile.active_policy && (
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>Active Policy</div>
            <div className="grid-2">
              <div className="stat-cell">
                <div className="stat-label">Tier</div>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '1rem' }}>
                  {profile.active_policy.tier}
                </div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Weekly Premium</div>
                <div className="font-mono font-bold">₹{profile.active_policy.weekly_premium_rs?.toFixed(0)}/wk</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Max Payout</div>
                <div className="font-mono font-bold">₹{profile.active_policy.max_weekly_payout_rs?.toFixed(0)}/wk</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Status</div>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button className="btn btn-danger" onClick={handleLogout}>
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}
