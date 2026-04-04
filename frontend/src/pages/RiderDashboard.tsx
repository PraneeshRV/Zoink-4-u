import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ridersAPI, triggersAPI } from '../lib/api';
import ZoinkScoreRing from '../components/ZoinkScoreRing';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  paid: { label: 'Paid', class: 'badge-success' },
  approved: { label: 'Approved', class: 'badge-info' },
  pending: { label: 'Pending', class: 'badge-warning' },
  rejected: { label: 'Rejected', class: 'badge-danger' },
  fraud_check: { label: 'Under Review', class: 'badge-purple' },
};

const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#e5e4e2',
};

export default function RiderDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, claimsRes] = await Promise.all([
        ridersAPI.getProfile(),
        ridersAPI.getClaims(1),
      ]);
      setProfile(profileRes.data);
      setClaims(claimsRes.data.claims?.slice(0, 3) || []);

      // Load risk conditions
      if (profileRes.data.zone_h3) {
        try {
          const condRes = await triggersAPI.getCurrentConditions(
            profileRes.data.zone_h3, profileRes.data.city || ''
          );
          setConditions(condRes.data);
        } catch { /* mock conditions loaded from API fallback */ }
      }
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/onboarding');
      else toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="empty-state">
        <div className="empty-icon">😔</div>
        <div className="empty-text">Could not load your profile</div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/onboarding')}>
          Register
        </button>
      </div>
    );
  }

  const policy = profile.active_policy;
  const totalProtected = claims
    .filter((c: any) => c.status === 'paid')
    .reduce((sum: number, c: any) => sum + (c.calculated_payout_rs || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <p className="text-secondary text-sm">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
        <h1 className="page-title">{profile.name} 👋</h1>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Your Shield Section */}
        {policy ? (
          <div className="card-gradient" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 }}>
                Active Policy
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginTop: 4 }}>
                {policy.tier} Shield
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: 4, opacity: 0.9 }}>
                ₹{policy.weekly_premium_rs?.toFixed(2)}/week • Max ₹{policy.max_weekly_payout_rs?.toFixed(0)}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: 8, opacity: 0.7 }}>
                📅 {policy.coverage_start} → {policy.coverage_end}
              </div>
            </div>
            <ZoinkScoreRing score={profile.zoink_score} size={90} />
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <p>No active policy</p>
            <button className="btn btn-primary btn-sm mt-12" onClick={() => navigate('/policy')}>
              Get Coverage
            </button>
          </div>
        )}

        {/* Live Risk Monitor */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>🔴 Live Risk Monitor</h3>
            <button className="btn btn-ghost btn-sm" onClick={loadData}>↻ Refresh</button>
          </div>

          {conditions ? (
            <>
              <div className="grid-2">
                <div className="risk-card">
                  <span className="risk-icon">
                    {(conditions.weather?.rainfall_mm_hr || 0) > 20 ? '🌧️' : '☀️'}
                  </span>
                  <div>
                    <div className="risk-label">Weather</div>
                    <div className="risk-value">{conditions.weather?.temp_c}°C</div>
                    <div className="text-xs text-hint">{conditions.weather?.rainfall_mm_hr}mm/hr rain</div>
                  </div>
                </div>
                <div className="risk-card">
                  <span className="risk-icon">
                    {(conditions.aqi?.aqi || 0) > 200 ? '😷' : '🌿'}
                  </span>
                  <div>
                    <div className="risk-label">Air Quality</div>
                    <div className="risk-value">{conditions.aqi?.aqi}</div>
                    <div className="text-xs text-hint">{conditions.aqi?.category}</div>
                  </div>
                </div>
                <div className="risk-card">
                  <span className="risk-icon">
                    {(conditions.traffic?.congestion_ratio || 0) > 3 ? '🚗' : '🛣️'}
                  </span>
                  <div>
                    <div className="risk-label">Traffic</div>
                    <div className="risk-value">{conditions.traffic?.current_speed} km/h</div>
                    <div className="text-xs text-hint">
                      {conditions.traffic?.congestion_ratio}x congestion
                    </div>
                  </div>
                </div>
                <div className="risk-card">
                  <span className="risk-icon">⚠️</span>
                  <div>
                    <div className="risk-label">Overall Risk</div>
                    <div className="risk-value" style={{
                      color: (conditions.overall_risk_score || 0) > 6 ? 'var(--danger)' :
                        (conditions.overall_risk_score || 0) > 3 ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {conditions.overall_risk_score}/10
                    </div>
                  </div>
                </div>
              </div>
              {conditions.active_triggers?.length > 0 && (
                <div className="card mt-8" style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--danger)' }}>
                    ⚡ Active Triggers
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {conditions.active_triggers.map((t: string) => (
                      <span key={t} className="badge badge-danger">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center text-secondary text-sm" style={{ padding: 24 }}>
              Loading conditions...
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>📋 Recent Claims</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/claims')}>
              View All →
            </button>
          </div>

          {claims.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {claims.map((c: any) => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                return (
                  <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.trigger_type}</div>
                      <div className="text-xs text-hint">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '--'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm">
                        ₹{c.calculated_payout_rs?.toFixed(2)}
                      </div>
                      <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-icon">🎯</div>
              <div className="empty-text">No claims yet — you're covered!</div>
            </div>
          )}

          {/* Earnings protected */}
          {totalProtected > 0 && (
            <div className="card-gradient-amber mt-12" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 }}>
                Total Earnings Protected
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                ₹{totalProtected.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
