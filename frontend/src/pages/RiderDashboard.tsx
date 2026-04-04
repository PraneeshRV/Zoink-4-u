import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ridersAPI, triggersAPI } from '../lib/api';
import ZoinkScoreRing from '../components/ZoinkScoreRing';
import Icon from '../components/Icon';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  paid: { label: 'Paid', class: 'badge-success' },
  approved: { label: 'Approved', class: 'badge-info' },
  pending: { label: 'Pending', class: 'badge-warning' },
  rejected: { label: 'Rejected', class: 'badge-danger' },
  fraud_check: { label: 'Under Review', class: 'badge-purple' },
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

      if (profileRes.data.zone_h3) {
        try {
          const condRes = await triggersAPI.getCurrentConditions(
            profileRes.data.zone_h3, profileRes.data.city || ''
          );
          setConditions(condRes.data);
        } catch { /* mock fallback */ }
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
        <div className="empty-title">Profile not found</div>
        <div className="empty-text">Please register to continue</div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }}
          onClick={() => navigate('/onboarding')}>
          Register
        </button>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const policy = profile.active_policy;
  const totalProtected = claims
    .filter((c: any) => c.status === 'paid')
    .reduce((sum: number, c: any) => sum + (c.calculated_payout_rs || 0), 0);

  const overallRisk = conditions?.overall_risk_score ?? 0;
  const riskColor = overallRisk > 6 ? 'var(--danger)' : overallRisk > 3 ? 'var(--warning)' : 'var(--success)';
  const riskLabel = overallRisk > 6 ? 'High Risk' : overallRisk > 3 ? 'Moderate' : 'Low Risk';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <p className="text-secondary text-sm">{greeting},</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <h1 className="page-title">{profile.name}</h1>
          <button className="btn btn-icon btn-secondary" onClick={loadData} title="Refresh">
            <Icon name="refresh" size={16} />
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Active Policy Hero */}
        {policy ? (
          <div className="card-hero">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: 'var(--text-hint)', marginBottom: 4,
                }}>
                  Active Coverage
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                  {policy.tier} Shield
                </div>
                <div style={{ marginTop: 4 }}>
                  <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="dot-live" size={7} style={{ color: 'var(--success)' }} /> Protected</span>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
                  <div className="stat-cell">
                    <div className="stat-label">Weekly Premium</div>
                    <div className="font-mono font-bold text-sm">₹{policy.weekly_premium_rs?.toFixed(0)}</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-label">Max Payout</div>
                    <div className="font-mono font-bold text-sm">₹{policy.max_weekly_payout_rs?.toFixed(0)}</div>
                  </div>
                </div>
              </div>
              <ZoinkScoreRing score={profile.zoink_score} size={88} />
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-hint)' }}>
                <Icon name="calendar" size={13} style={{ color: 'var(--text-hint)' }} />
                <span>{policy.coverage_start} → {policy.coverage_end}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--text-secondary)' }}><Icon name="shield" size={36} /></div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>No Active Coverage</div>
            <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>
              Get protected from income disruptions today
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/policy')}>
              Get Coverage
            </button>
          </div>
        )}

        {/* Stats Row */}
        {totalProtected > 0 && (
          <div className="card-accent">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: 'var(--accent-400)' }}><Icon name="coin" size={26} /></div>
              <div>
                <div className="stat-label">Total Earnings Protected</div>
                <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  ₹{totalProtected.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Risk Monitor */}
        <div>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="dot-live" style={{ width: 7, height: 7 }} />
              <span className="section-title">Live Risk Monitor</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                fontSize: '0.78rem', fontWeight: 700, color: riskColor,
                background: riskColor + '20', padding: '3px 10px', borderRadius: '100px',
              }}>
                {riskLabel}
              </div>
            </div>
          </div>

          {conditions ? (
            <>
              <div className="risk-grid">
                <div className="risk-card">
                  <div className="risk-icon" style={{ color: (conditions.weather?.rainfall_mm_hr || 0) > 20 ? 'var(--info)' : 'var(--warning)' }}>
                    <Icon name={(conditions.weather?.rainfall_mm_hr || 0) > 20 ? 'rain' : 'sun'} size={24} />
                  </div>
                  <div>
                    <div className="risk-label">Weather</div>
                    <div className="risk-value">{conditions.weather?.temp_c}°C</div>
                    <div className="text-xs text-hint">{conditions.weather?.rainfall_mm_hr}mm/hr</div>
                  </div>
                </div>
                <div className="risk-card">
                  <div className="risk-icon" style={{ color: (conditions.aqi?.aqi || 0) > 200 ? 'var(--danger)' : 'var(--success)' }}>
                    <Icon name="aqi" size={24} />
                  </div>
                  <div>
                    <div className="risk-label">Air Quality</div>
                    <div className="risk-value">{conditions.aqi?.aqi}</div>
                    <div className="text-xs text-hint">{conditions.aqi?.category}</div>
                  </div>
                </div>
                <div className="risk-card">
                  <div className="risk-icon" style={{ color: (conditions.traffic?.congestion_ratio || 0) > 3 ? 'var(--warning)' : 'var(--success)' }}>
                    <Icon name="traffic" size={24} />
                  </div>
                  <div>
                    <div className="risk-label">Traffic</div>
                    <div className="risk-value">{conditions.traffic?.current_speed} km/h</div>
                    <div className="text-xs text-hint">{conditions.traffic?.congestion_ratio}× congestion</div>
                  </div>
                </div>
                <div className="risk-card">
                  <div className="risk-icon" style={{ color: riskColor }}><Icon name="alert" size={24} /></div>
                  <div>
                    <div className="risk-label">Risk Score</div>
                    <div className="risk-value" style={{ color: riskColor }}>
                      {conditions.overall_risk_score}/10
                    </div>
                  </div>
                </div>
              </div>

              {conditions.active_triggers?.length > 0 && (
                <div className="trigger-banner" style={{ marginTop: 10 }}>
                  <Icon name="zap" size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 6 }}>
                      Active Triggers — Payout may auto-initiate
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {conditions.active_triggers.map((t: string) => (
                        <span key={t} className="badge badge-danger">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p className="text-secondary text-sm" style={{ marginTop: 8 }}>Loading conditions...</p>
            </div>
          )}
        </div>

        {/* Recent Claims */}
        <div>
          <div className="section-header">
            <span className="section-title">Recent Claims</span>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/claims')}>
              View all →
            </button>
          </div>

          {claims.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {claims.map((c: any) => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                return (
                  <div key={c.id} className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--bg-overlay)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: 'var(--info)',
                    }}>
                      <Icon name="rain" size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.trigger_type?.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-hint">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '--'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="font-mono font-bold text-sm">₹{c.calculated_payout_rs?.toFixed(0)}</div>
                      <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 32 }}>
              <div style={{ color: 'var(--text-hint)', marginBottom: 4 }}><Icon name="activity" size={32} /></div>
              <div className="empty-title">No claims yet</div>
              <div className="empty-text">Your shield is active and standing by</div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid-2">
          <button className="card card-hover" style={{ textAlign: 'center', padding: 16, border: '1px solid var(--border-default)' }}
            onClick={() => navigate('/policy')}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: 'var(--accent-400)' }}><Icon name="policy" size={28} /></div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>My Policy</div>
            <div className="text-xs text-hint" style={{ marginTop: 2 }}>Triggers & coverage</div>
          </button>
          <button className="card card-hover" style={{ textAlign: 'center', padding: 16, border: '1px solid var(--border-default)' }}
            onClick={() => navigate('/profile')}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: 'var(--text-secondary)' }}><Icon name="profile" size={28} /></div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Profile</div>
            <div className="text-xs text-hint" style={{ marginTop: 2 }}>Zoink Score & details</div>
          </button>
        </div>
      </div>
    </div>
  );
}
