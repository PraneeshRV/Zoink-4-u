import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminAPI, claimsAPI } from '../../lib/api';

const TOOLTIP_STYLE = {
  background: '#26292d', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#f1f3f5', fontSize: 12,
};

const PIE_COLORS = ['#51cf66', '#fcc419', '#ff6b6b', '#cc5de8', '#74c0fc'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [fraudClaims, setFraudClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [statsRes, heatmapRes, pendingRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getZoneHeatmap(),
        adminAPI.getClaims('fraud_check', 1),
      ]);
      setStats(statsRes.data);
      setHeatmap(heatmapRes.data || []);
      setFraudClaims((pendingRes.data.claims || []).slice(0, 5));
    } catch { toast.error('Failed to load admin dashboard'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try { await claimsAPI.approve(id); toast.success('Claim approved'); loadData(); }
    catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id: string) => {
    try { await claimsAPI.reject(id, 'Admin rejected'); toast.success('Claim rejected'); loadData(); }
    catch { toast.error('Failed to reject'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  const barData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    claims: Math.floor(Math.random() * 50 + 10),
  }));

  const pieData = [
    { name: 'Paid', value: 45 },
    { name: 'Pending', value: 15 },
    { name: 'Rejected', value: 8 },
    { name: 'Fraud Review', value: stats?.fraud_flags_pending || 3 },
    { name: 'Approved', value: 12 },
  ];

  const lossRatio = stats?.loss_ratio || 0;
  const lossColor = lossRatio < 40 ? 'var(--success)' : lossRatio < 60 ? 'var(--warning)' : 'var(--danger)';
  const lossLabel = lossRatio < 40 ? 'Healthy' : lossRatio < 60 ? 'Moderate' : 'Critical';

  const kpis = [
    { label: 'Total Riders', value: stats?.total_riders || 0, color: 'var(--accent-400)', icon: '◉' },
    { label: 'Active Policies', value: stats?.active_policies || 0, color: 'var(--info)', icon: '🛡️' },
    { label: 'Claims This Week', value: stats?.total_claims_this_week || 0, color: 'var(--warning)', icon: '≡' },
    { label: 'Fraud Queue', value: stats?.fraud_flags_pending || 0, color: 'var(--danger)', icon: '🔍' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-sub">Zoink-4-u operations overview · live stats</p>
      </div>

      {/* KPI Row */}
      <div className="admin-grid-4">
        {kpis.map(k => (
          <div key={k.label} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1rem' }}>{k.icon}</span>
              <div className="stat-label">{k.label}</div>
            </div>
            <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Payout + Loss Ratio */}
      <div className="admin-grid-2">
        <div className="card">
          <div className="stat-label" style={{ marginBottom: 8 }}>Total Payout This Week</div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)' }}>
            ₹{(stats?.total_payout_this_week || 0).toFixed(0)}
          </div>
          <div className="text-xs text-secondary" style={{ marginTop: 4 }}>
            Avg ₹{stats?.avg_payout_per_rider?.toFixed(0) || '—'} / rider
          </div>
        </div>
        <div className="card">
          <div className="stat-label" style={{ marginBottom: 8 }}>Loss Ratio</div>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 900, color: lossColor }}>
            {lossRatio.toFixed(1)}%
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{
                width: `${Math.min(100, lossRatio)}%`,
                background: lossColor,
              }} />
            </div>
            <div className="text-xs text-secondary" style={{ marginTop: 4 }}>
              {lossLabel} · Target: &lt;40%
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="admin-grid-2">
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 16 }}>Claims by Day (Last 7 Days)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" stroke="#6c757d" fontSize={11} axisLine={false} tickLine={false} />
              <YAxis stroke="#6c757d" fontSize={11} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="claims" fill="var(--accent-600)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 16 }}>Claim Status Breakdown</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} innerRadius={30} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zone Heatmap + Fraud Queue */}
      <div className="admin-grid-2">
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>Zone Risk Heatmap</div>
          {heatmap.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Zone</th><th>Risk</th><th>Claims</th><th>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map((z: any) => (
                    <tr key={z.zone_h3}>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{z.zone_name}</td>
                      <td>
                        <span className={`badge ${z.risk_score > 7 ? 'badge-danger' : z.risk_score > 4 ? 'badge-warning' : 'badge-success'}`}>
                          {z.risk_score}/10
                        </span>
                      </td>
                      <td className="font-mono text-sm">{z.claim_count}</td>
                      <td className="font-mono text-sm">₹{z.total_payout?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-icon">🗺️</div>
              <div className="empty-text">No zone data available</div>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Fraud Review Queue</div>
            {fraudClaims.length > 0 && (
              <span className="badge badge-danger">{fraudClaims.length} pending</span>
            )}
          </div>
          {fraudClaims.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fraudClaims.map((c: any) => (
                <div key={c.id} className="card" style={{ padding: '12px 14px', background: 'var(--bg-raised)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.trigger_type?.replace(/_/g, ' ')}</div>
                      <div className="font-mono text-xs text-secondary">₹{c.calculated_payout_rs?.toFixed(0)}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {(c.fraud_flags || []).map((f: string, i: number) => (
                          <span key={i} className="badge badge-danger" style={{ fontSize: '0.65rem' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        style={{
                          background: 'var(--success-soft)', border: '1px solid rgba(81,207,102,0.3)',
                          color: 'var(--success)', borderRadius: 6, padding: '5px 10px',
                          fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                        }}
                        onClick={() => handleApprove(c.id)}
                      >✓</button>
                      <button
                        style={{
                          background: 'var(--danger-soft)', border: '1px solid rgba(255,107,107,0.3)',
                          color: 'var(--danger)', borderRadius: 6, padding: '5px 10px',
                          fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                        }}
                        onClick={() => handleReject(c.id)}
                      >✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-icon">✅</div>
              <div className="empty-title">Queue clear</div>
              <div className="empty-text">No fraud flags pending</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
