import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminAPI, claimsAPI } from '../../lib/api';

const PIE_COLORS = ['#22c55e', '#fbbf24', '#ef4444', '#a855f7', '#3b82f6'];

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
    } catch (err: any) {
      toast.error('Failed to load admin dashboard');
    } finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try {
      await claimsAPI.approve(id);
      toast.success('Claim approved');
      loadData();
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id: string) => {
    try {
      await claimsAPI.reject(id, 'Admin rejected');
      toast.success('Claim rejected');
      loadData();
    } catch { toast.error('Failed to reject'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  // Mock chart data
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

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>📊 Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="stat-card">
          <div className="stat-label">Total Riders</div>
          <div className="stat-value" style={{ color: 'var(--primary-400)' }}>
            {stats?.total_riders || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Policies</div>
          <div className="stat-value" style={{ color: 'var(--info)' }}>
            {stats?.active_policies || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Claims This Week</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {stats?.total_claims_this_week || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Payout (₹) This Week</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            ₹{(stats?.total_payout_this_week || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid mt-24">
        <div className="chart-card">
          <h3>Claims by Day (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
              <Bar dataKey="claims" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Claim Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zone Heatmap + Fraud Flags */}
      <div className="charts-grid mt-24">
        <div className="chart-card">
          <h3>Zone Risk Heatmap</h3>
          {heatmap.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Zone</th><th>Risk</th><th>Claims</th><th>Payout</th></tr>
                </thead>
                <tbody>
                  {heatmap.map((z: any) => (
                    <tr key={z.zone_h3} style={{
                      background: z.risk_score > 7 ? 'rgba(239,68,68,0.1)' :
                        z.risk_score > 4 ? 'rgba(245,158,11,0.1)' : 'transparent'
                    }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{z.zone_name}</div>
                      </td>
                      <td>
                        <span className={`badge ${z.risk_score > 7 ? 'badge-danger' : z.risk_score > 4 ? 'badge-warning' : 'badge-success'}`}>
                          {z.risk_score}
                        </span>
                      </td>
                      <td className="font-mono">{z.claim_count}</td>
                      <td className="font-mono">₹{z.total_payout?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-secondary text-sm" style={{ padding: 24 }}>No zone data</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Recent Fraud Flags</h3>
          {fraudClaims.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fraudClaims.map((c: any) => (
                <div key={c.id} className="card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div className="text-sm font-bold">{c.trigger_type}</div>
                      <div className="text-xs text-hint">₹{c.calculated_payout_rs?.toFixed(2)}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                        {(c.fraud_flags || []).map((f: string, i: number) => (
                          <span key={i} className="badge badge-danger" style={{ fontSize: '0.65rem' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--success)' }}
                        onClick={() => handleApprove(c.id)}>✓</button>
                      <button className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleReject(c.id)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-secondary text-sm" style={{ padding: 24 }}>No fraud flags</div>
          )}
        </div>
      </div>

      {/* Loss Ratio */}
      <div className="card mt-24" style={{ maxWidth: 400 }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
          LOSS RATIO
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: lossColor }}>
            {lossRatio.toFixed(1)}%
          </div>
          <div style={{ flex: 1 }}>
            <div className="risk-gauge-bar">
              <div className="risk-gauge-fill" style={{
                width: `${Math.min(100, lossRatio)}%`,
                background: lossColor,
              }} />
            </div>
            <div className="text-xs text-hint mt-4">
              {lossRatio < 40 ? 'Healthy' : lossRatio < 60 ? 'Moderate' : 'Critical'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
