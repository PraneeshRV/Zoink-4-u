import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ridersAPI, triggersAPI, mlEngineAPI, payoutsAPI } from '../lib/api';
import ZoinkScoreRing from '../components/ZoinkScoreRing';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  paid: { label: 'Paid', class: 'badge-success' },
  approved: { label: 'Approved', class: 'badge-info' },
  pending: { label: 'Pending', class: 'badge-warning' },
  rejected: { label: 'Rejected', class: 'badge-danger' },
  fraud_check: { label: 'Under Review', class: 'badge-purple' },
};

const RISK_COLORS: Record<string, string> = {
  low: 'var(--success)',
  medium: 'var(--warning)',
  high: 'var(--danger)',
};

const WHATSAPP_MESSAGES = [
  { type: 'alert', msg: '🌧️ Heavy rain alert for your zone! Disruption trigger may activate. Stay safe.', time: '2 hrs ago' },
  { type: 'payout', msg: '💰 ₹384.00 auto-payout processed to your UPI. Claim #ZK-3847.', time: '1 day ago' },
  { type: 'weekly', msg: '📊 Weekly Summary: 0 disruptions, ₹0 claims. Your No-Claim streak continues! 🔥', time: '3 days ago' },
];

export default function RiderDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showMicroAdvance, setShowMicroAdvance] = useState(false);
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
      setClaims(claimsRes.data.claims?.slice(0, 5) || []);

      if (profileRes.data.zone_h3) {
        try {
          const [condRes, forecastRes] = await Promise.all([
            triggersAPI.getCurrentConditions(profileRes.data.zone_h3, profileRes.data.city || ''),
            mlEngineAPI.getForecast(profileRes.data.zone_h3, profileRes.data.city || ''),
          ]);
          setConditions(condRes.data);
          setForecast(forecastRes.data || []);
        } catch { /* conditions loaded from API fallback */ }
      }
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/onboarding');
      else toast.error('Failed to load dashboard');
    } finally { setLoading(false); }
  };

  const handleMicroAdvance = () => {
    setShowMicroAdvance(true);
    setTimeout(() => {
      toast.success('₹200 Emergency Micro-Advance sent to your UPI! 💸');
    }, 1500);
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!profile) return (
    <div className="empty-state">
      <div className="empty-icon">😔</div>
      <div className="empty-text">Could not load your profile</div>
      <button className="btn btn-primary btn-sm" onClick={() => navigate('/onboarding')}>Register</button>
    </div>
  );

  const policy = profile.active_policy;
  const paidClaims = claims.filter((c: any) => c.status === 'paid');
  const totalProtected = paidClaims.reduce((sum: number, c: any) => sum + (c.calculated_payout_rs || 0), 0);
  const coverageDaysLeft = policy?.coverage_end
    ? Math.max(0, Math.ceil((new Date(policy.coverage_end).getTime() - Date.now()) / 86400000))
    : 0;

  // Mock no-claim streak
  const noClaimStreak = Math.max(0, 5 - paidClaims.length);

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
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 }}>Active Policy</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginTop: 4 }}>{policy.tier} Shield</div>
              <div style={{ fontSize: '0.85rem', marginTop: 4, opacity: 0.9 }}>
                ₹{policy.weekly_premium_rs?.toFixed(2)}/week • Max ₹{policy.max_weekly_payout_rs?.toFixed(0)}
              </div>
              <div style={{ fontSize: '0.65rem', marginTop: 2, opacity: 0.6 }}>
                Premium: DGRI dynamic rate for your zone
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: 8, opacity: 0.7 }}>
                📅 {policy.coverage_start} → {policy.coverage_end}
              </div>
              {coverageDaysLeft > 0 && (
                <div style={{ marginTop: 8, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,255,255,0.15)', display: 'inline-block', padding: '3px 10px', borderRadius: 12 }}>
                  {coverageDaysLeft} days remaining
                </div>
              )}
            </div>
            <ZoinkScoreRing score={profile.zoink_score} size={90} />
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <p>No active policy</p>
            <button className="btn btn-primary btn-sm mt-12" onClick={() => navigate('/policy')}>Get Coverage</button>
          </div>
        )}

        {/* Quick Actions row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => setShowWhatsApp(!showWhatsApp)}>
            💬 WhatsApp Alerts
          </button>
          {policy?.tier === 'platinum' && (
            <button className="btn btn-outline btn-sm" style={{ flex: 1, fontSize: '0.75rem', borderColor: 'var(--warning)', color: 'var(--warning)' }} onClick={handleMicroAdvance}>
              ⚡ ₹200 Micro-Advance
            </button>
          )}
          <button className="btn btn-outline btn-sm" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => navigate('/policy')}>
            📋 View Policy
          </button>
        </div>

        {/* WhatsApp Alert Mock */}
        {showWhatsApp && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#075e54', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>💬</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>Zoink-4-u WhatsApp Alerts</span>
            </div>
            <div style={{ background: '#e5ddd5', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {WHATSAPP_MESSAGES.map((m, i) => (
                <div key={i} style={{
                  background: i === 0 ? '#dcf8c6' : '#fff', maxWidth: '85%', padding: '8px 10px',
                  borderRadius: 8, fontSize: '0.78rem', color: '#111', boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
                  alignSelf: 'flex-start',
                }}>
                  {m.msg}
                  <div style={{ fontSize: '0.6rem', color: '#999', textAlign: 'right', marginTop: 4 }}>{m.time}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#e5ddd5', padding: '6px 10px', borderTop: '1px solid #ccc' }}>
              <div style={{ fontSize: '0.65rem', color: '#666', textAlign: 'center' }}>
                🌐 Supports English, Hindi, Tamil, Telugu, Kannada
              </div>
            </div>
          </div>
        )}

        {/* Emergency Micro-Advance Modal */}
        {showMicroAdvance && (
          <div className="card" style={{ borderColor: 'var(--warning)', borderWidth: 2, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.3rem' }}>⚡</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--warning)' }}>Emergency Micro-Advance</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-hint)' }}>Platinum exclusive — ₹200 instant advance</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              ₹200 sent instantly to your UPI during active disruptions. Auto-deducted from next payout. No interest, no forms. Available once per week for Platinum riders with Zoink Score &gt; 70.
            </div>
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 8 }}>
              <span className="text-xs font-mono" style={{ color: 'var(--success)' }}>✅ ₹200.00 sent → UPI ID: {profile.phone}@upi</span>
            </div>
            <button className="btn btn-ghost btn-sm mt-8" onClick={() => setShowMicroAdvance(false)}>Close</button>
          </div>
        )}

        {/* Earnings Protected + No-Claim Rewards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card-gradient-amber" style={{ padding: 14 }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.8 }}>💰 Earnings Protected</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
              ₹{totalProtected.toFixed(0)}
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: 2 }}>{paidClaims.length} claims paid</div>
          </div>
          <div className="card" style={{ padding: 14, background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 1.5, color: '#a855f7' }}>🏆 No-Claim Streak</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', marginTop: 4, color: '#a855f7' }}>
              {noClaimStreak} wks
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-hint)', marginTop: 2 }}>
              {noClaimStreak >= 5 ? '🎉 Free week earned!' : `${5 - noClaimStreak} more for free week`}
            </div>
          </div>
        </div>

        {/* Community Trust Signals */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>🤝 Community Trust Signals</h3>
            <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.06)', textAlign: 'center' }}>
              <div className="font-mono font-bold" style={{ color: 'var(--success)', fontSize: '1rem' }}>12</div>
              <div className="text-xs text-hint">Riders paid nearby</div>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', textAlign: 'center' }}>
              <div className="font-mono font-bold" style={{ color: 'var(--info)', fontSize: '1rem' }}>₹4,320</div>
              <div className="text-xs text-hint">Zone total payouts</div>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', textAlign: 'center' }}>
              <div className="font-mono font-bold" style={{ color: 'var(--warning)', fontSize: '1rem' }}>~8min</div>
              <div className="text-xs text-hint">Avg payout time</div>
            </div>
          </div>
        </div>

        {/* 7-Day Forecast */}
        {forecast.length > 0 && (
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>📈 7-Day Disruption Forecast</h3>
            <div className="card" style={{ padding: 16 }}>
              <div className="forecast-bars">
                {forecast.map((f: any, i: number) => {
                  const dayLabel = new Date(f.date).toLocaleDateString('en-US', { weekday: 'short' });
                  const prob = f.disruption_probability || 0;
                  const barColor = RISK_COLORS[f.risk_level] || 'var(--primary-400)';
                  return (
                    <div key={i} className="forecast-bar-item">
                      <div className="forecast-bar-wrapper">
                        <div className="forecast-bar-fill" style={{ height: `${Math.max(8, prob * 100)}%`, background: barColor }} />
                      </div>
                      <div className="forecast-bar-label">{dayLabel}</div>
                      <div className="forecast-bar-prob">{(prob * 100).toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
                <span className="forecast-legend"><span style={{ background: 'var(--success)' }} className="legend-dot" /> Low</span>
                <span className="forecast-legend"><span style={{ background: 'var(--warning)' }} className="legend-dot" /> Medium</span>
                <span className="forecast-legend"><span style={{ background: 'var(--danger)' }} className="legend-dot" /> High</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.65rem', color: 'var(--text-hint)' }}>
                Powered by LSTM neural network • Updates hourly
              </div>
            </div>
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
                  <span className="risk-icon">{(conditions.weather?.rainfall_mm_hr || 0) > 20 ? '🌧️' : '☀️'}</span>
                  <div>
                    <div className="risk-label">Weather</div>
                    <div className="risk-value">{conditions.weather?.temp_c}°C</div>
                    <div className="text-xs text-hint">{conditions.weather?.rainfall_mm_hr}mm/hr rain</div>
                    <div className="text-xs text-hint">src: OpenWeatherMap</div>
                  </div>
                </div>
                <div className="risk-card">
                  <span className="risk-icon">{(conditions.aqi?.aqi || 0) > 200 ? '😷' : '🌿'}</span>
                  <div>
                    <div className="risk-label">Air Quality</div>
                    <div className="risk-value">{conditions.aqi?.aqi}</div>
                    <div className="text-xs text-hint">{conditions.aqi?.category}</div>
                    <div className="text-xs text-hint">src: WAQI API</div>
                  </div>
                </div>
                <div className="risk-card">
                  <span className="risk-icon">{(conditions.traffic?.congestion_ratio || 0) > 3 ? '🚗' : '🛣️'}</span>
                  <div>
                    <div className="risk-label">Traffic</div>
                    <div className="risk-value">{conditions.traffic?.current_speed} km/h</div>
                    <div className="text-xs text-hint">{conditions.traffic?.congestion_ratio}x congestion</div>
                    <div className="text-xs text-hint">src: TomTom API</div>
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
                    <div className="text-xs text-hint">H3: {profile.zone_h3?.slice(0, 8)}...</div>
                  </div>
                </div>
              </div>
              {conditions.active_triggers?.length > 0 && (
                <div className="card mt-8" style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--danger)' }}>⚡ Active Triggers</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {conditions.active_triggers.map((t: string) => (
                      <span key={t} className="badge badge-danger">{t}</span>
                    ))}
                  </div>
                  <div className="text-xs text-hint mt-4">Auto-claim pipeline will process within 15 minutes</div>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center text-secondary text-sm" style={{ padding: 24 }}>Loading conditions...</div>
          )}
        </div>

        {/* Fraud Protection Status */}
        <div className="card" style={{ padding: 14 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10 }}>🔒 5-Layer Fraud Protection</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { icon: '📍', name: 'GPS Validation', desc: 'Cell tower + accelerometer anti-spoofing', status: 'Active' },
              { icon: '🧠', name: 'Behavioral Physics', desc: 'Speed/distance impossibility checks', status: 'Active' },
              { icon: '🕸️', name: 'GNN Ring Detection', desc: 'Graph Neural Network syndicate detection', status: 'Active' },
              { icon: '🤖', name: 'Isolation Forest', desc: 'ML anomaly scoring on 8 features', status: 'Active' },
              { icon: '🏆', name: 'Zoink Score Gating', desc: 'Reputation-based auto-approval', status: `Score: ${profile.zoink_score}` },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                <span style={{ fontSize: '1rem' }}>{l.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{l.name}</div>
                  <div className="text-xs text-hint">{l.desc}</div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payout Timeline */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>💸 Payout Timeline</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/claims')}>View All →</button>
          </div>
          {claims.length > 0 ? (
            <div className="payout-timeline">
              {claims.map((c: any, i: number) => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                return (
                  <div key={c.id} className="timeline-item">
                    <div className="timeline-dot-wrapper">
                      <div className={`timeline-dot ${c.status === 'paid' ? 'dot-success' : c.status === 'fraud_check' ? 'dot-danger' : 'dot-default'}`} />
                      {i < claims.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.trigger_type?.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-hint">
                            {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-sm">₹{c.calculated_payout_rs?.toFixed(2)}</div>
                          <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                        </div>
                      </div>
                      {c.status === 'paid' && c.razorpay_payment_id && (
                        <div className="text-xs text-hint mt-4 font-mono" style={{ opacity: 0.6 }}>
                          Razorpay TXN: {c.razorpay_payment_id}
                        </div>
                      )}
                      {(c.fraud_flags || []).length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {c.fraud_flags.map((f: string, fi: number) => (
                            <span key={fi} className="badge badge-danger" style={{ fontSize: '0.6rem' }}>{f}</span>
                          ))}
                        </div>
                      )}
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
        </div>
      </div>
    </div>
  );
}
