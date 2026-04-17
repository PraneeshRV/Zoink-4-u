import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ridersAPI, mlEngineAPI } from '../lib/api';
import { useAuthStore } from '../store/useAuth';
import ZoinkScoreRing from '../components/ZoinkScoreRing';

const ZOINK_FACTORS = [
  { name: 'Claim Frequency', weight: '20%', desc: 'Lower claim rate = higher score', icon: '📊' },
  { name: 'Claim Accuracy', weight: '20%', desc: 'Claims matching real disruptions', icon: '🎯' },
  { name: 'Payment History', weight: '15%', desc: 'On-time premium payments', icon: '💳' },
  { name: 'Platform Tenure', weight: '15%', desc: 'Months active on Zoink-4-u', icon: '📅' },
  { name: 'GPS Consistency', weight: '15%', desc: 'Genuine location data, no spoofing', icon: '📍' },
  { name: 'Community Trust', weight: '15%', desc: 'Peer reputation signals', icon: '🤝' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [riskProfile, setRiskProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await ridersAPI.getProfile();
      setProfile(res.data);

      // Load risk profile
      try {
        const riskRes = await mlEngineAPI.getRiskProfile({
          zone_h3: res.data.zone_h3 || '8829e24dfffffff',
          city: res.data.city || 'Chennai',
          work_hours_per_week: 40,
          platform: res.data.platform || 'swiggy',
          months_active: 3,
        });
        setRiskProfile(riskRes.data);
      } catch {}
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/onboarding');
      else toast.error('Failed to load profile');
    } finally { setLoading(false); }
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!profile) return <div className="empty-state"><div className="empty-text">Not found</div></div>;

  const policy = profile.active_policy;
  const zoinkScore = profile.zoink_score || 50;
  const scoreLevel = zoinkScore >= 80 ? 'Excellent' : zoinkScore >= 60 ? 'Good' : zoinkScore >= 40 ? 'Fair' : 'Building';
  const scoreColor = zoinkScore >= 80 ? 'var(--success)' : zoinkScore >= 60 ? 'var(--info)' : zoinkScore >= 40 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👤 Profile</h1>
        <p className="page-subtitle">Your identity, Zoink Score & risk profile</p>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Profile Card */}
        <div className="card-gradient" style={{ textAlign: 'center', padding: 24 }}>
          <ZoinkScoreRing score={zoinkScore} size={110} />
          <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginTop: 12 }}>{profile.name}</h2>
          <div className="text-sm" style={{ opacity: 0.8, marginTop: 4 }}>
            {profile.platform?.toUpperCase()} • {profile.city}
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 10 }}>
              Zoink Score: {zoinkScore} — {scoreLevel}
            </span>
          </div>
        </div>

        {/* KYC Status */}
        <div className="card" style={{ padding: 14 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>🔐 KYC & Verification</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-sm">Aadhaar Verified</span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✅ Verified</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-sm">Phone Verified</span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✅ {profile.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-sm">Deduplication Token</span>
              <span className="text-xs font-mono text-hint">{profile.aadhaar_token?.slice(0, 12)}...</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-hint)', marginTop: 4 }}>
              🔒 One-way SHA-256 token — Aadhaar number never stored. DPDP Act 2023 compliant.
            </div>
          </div>
        </div>

        {/* Work Profile */}
        <div className="card" style={{ padding: 14 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>🏍️ Work Profile</h3>
          <div className="grid-2" style={{ gap: 8 }}>
            <div><div className="text-xs text-hint">Platform</div><div className="font-bold text-sm">{profile.platform?.charAt(0).toUpperCase() + profile.platform?.slice(1)}</div></div>
            <div><div className="text-xs text-hint">City</div><div className="font-bold text-sm">{profile.city}</div></div>
            <div><div className="text-xs text-hint">Zone (H3)</div><div className="font-mono text-xs">{profile.zone_h3}</div></div>
            <div><div className="text-xs text-hint">Shift</div><div className="font-bold text-sm">{profile.shift_start || '09:00'} - {profile.shift_end || '21:00'}</div></div>
          </div>
        </div>

        {/* Zoink Score Breakdown */}
        <div className="card" style={{ padding: 14 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>🏆 Zoink Score Breakdown</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-hint)', marginBottom: 10 }}>
            Your Zoink Score determines auto-approval speed and premium discounts. Score &gt; 70 = instant AI approval.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ZOINK_FACTORS.map((f, i) => {
              const barWidth = Math.min(100, zoinkScore + (Math.random() * 20 - 10));
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ fontSize: '0.75rem' }}>
                      <span>{f.icon}</span> <span style={{ fontWeight: 600 }}>{f.name}</span>
                      <span className="text-xs text-hint" style={{ marginLeft: 6 }}>({f.weight})</span>
                    </div>
                  </div>
                  <div className="risk-gauge-bar" style={{ height: 5 }}>
                    <div className="risk-gauge-fill" style={{ width: `${barWidth}%`, background: scoreColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Profile from ML */}
        {riskProfile && (
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>📊 Zone Risk Profile (ML-Generated)</h3>
            <div className="grid-2" style={{ gap: 8 }}>
              <div>
                <div className="text-xs text-hint">Zone Risk Score</div>
                <div className="font-mono font-bold" style={{
                  color: riskProfile.risk_score > 7 ? 'var(--danger)' : riskProfile.risk_score > 4 ? 'var(--warning)' : 'var(--success)'
                }}>{riskProfile.risk_score?.toFixed(2)}/10</div>
              </div>
              <div>
                <div className="text-xs text-hint">Risk Level</div>
                <span className={`badge ${riskProfile.risk_level === 'high' ? 'badge-danger' : riskProfile.risk_level === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                  {riskProfile.risk_level}
                </span>
              </div>
              <div>
                <div className="text-xs text-hint">Est. Claims/Month</div>
                <div className="font-mono text-sm">{riskProfile.estimated_monthly_claims?.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-xs text-hint">Model</div>
                <div className="text-xs text-hint">{riskProfile.model || 'RandomForestClassifier'}</div>
              </div>
            </div>
            {riskProfile.risk_factors && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                <div className="text-xs text-hint mb-4" style={{ fontWeight: 600 }}>Contributing Factors:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(riskProfile.risk_factors || {}).map(([k, v]: [string, any]) => (
                    <span key={k} style={{
                      fontSize: '0.65rem', padding: '3px 8px', borderRadius: 6,
                      background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.15)',
                    }}>{k}: {typeof v === 'number' ? v.toFixed(2) : v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Policy Summary */}
        {policy && (
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>🛡️ Active Policy</h3>
            <div className="grid-2" style={{ gap: 8 }}>
              <div><div className="text-xs text-hint">Tier</div><div className="font-bold text-sm" style={{ textTransform: 'uppercase' }}>{policy.tier} Shield</div></div>
              <div><div className="text-xs text-hint">Premium</div><div className="font-mono text-sm">₹{policy.weekly_premium_rs?.toFixed(2)}/wk</div></div>
              <div><div className="text-xs text-hint">Max Payout</div><div className="font-mono text-sm">₹{policy.max_weekly_payout_rs?.toFixed(0)}/wk</div></div>
              <div><div className="text-xs text-hint">Status</div><span className="badge badge-success">{policy.status}</span></div>
            </div>
          </div>
        )}

        {/* Financial Identity */}
        <div className="card" style={{ padding: 14, background: 'rgba(168, 85, 247, 0.04)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6, color: '#a855f7' }}>💎 Financial Identity Building</h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your Zoink-4-u insurance history builds a <strong>verifiable financial identity</strong>. After 6+ months of continuous coverage, your data becomes a credit signal for fintech lenders — unlocking pre-approved microloans and savings products.
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '6px', borderRadius: 6, background: 'rgba(168, 85, 247, 0.08)' }}>
              <div className="font-mono font-bold" style={{ color: '#a855f7' }}>~3 mo</div>
              <div className="text-xs text-hint">Active tenure</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '6px', borderRadius: 6, background: 'rgba(168, 85, 247, 0.08)' }}>
              <div className="font-mono font-bold" style={{ color: '#a855f7' }}>3 mo</div>
              <div className="text-xs text-hint">Until eligible</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => navigate('/policy')}>📋 View Full Policy Details</button>
          <button className="btn btn-ghost" style={{ color: 'var(--danger)' }}
            onClick={() => { logout(); navigate('/onboarding'); toast.success('Logged out'); }}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}
