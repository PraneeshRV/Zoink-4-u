import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, Area, AreaChart,
} from 'recharts';
import { adminAPI, claimsAPI, analyticsAPI } from '../../lib/api';

const PIE_COLORS = ['#22c55e', '#fbbf24', '#ef4444', '#a855f7', '#3b82f6'];
const CHART_STYLE = { background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' };

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [fraudClaims, setFraudClaims] = useState<any[]>([]);
  const [lossRatioTrend, setLossRatioTrend] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [fraudStats, setFraudStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
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

      // Load analytics (don't block main dashboard)
      try {
        const [lrRes, predRes, fraudRes, revRes] = await Promise.all([
          analyticsAPI.getLossRatioTrend(8),
          analyticsAPI.getPredictions(),
          analyticsAPI.getFraudStats(),
          analyticsAPI.getRevenue(),
        ]);
        setLossRatioTrend(lrRes.data.trend || []);
        setPredictions(predRes.data);
        setFraudStats(fraudRes.data);
        setRevenue(revRes.data);
      } catch { /* analytics optional */ }
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

  const lossRatio = stats?.loss_ratio || 0;
  const lossColor = lossRatio < 40 ? 'var(--success)' : lossRatio < 60 ? 'var(--warning)' : 'var(--danger)';

  const pieData = [
    { name: 'Paid', value: 45 },
    { name: 'Pending', value: 15 },
    { name: 'Rejected', value: 8 },
    { name: 'Fraud Review', value: stats?.fraud_flags_pending || 3 },
    { name: 'Approved', value: 12 },
  ];

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

      {/* Loss Ratio Trend + Revenue */}
      <div className="charts-grid mt-24">
        <div className="chart-card">
          <h3>📉 Loss Ratio Trend (8 Weeks)</h3>
          {lossRatioTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={lossRatioTrend}>
                <defs>
                  <linearGradient id="lrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip contentStyle={CHART_STYLE} />
                <Area type="monotone" dataKey="loss_ratio" stroke="#14b8a6"
                  fill="url(#lrGrad)" strokeWidth={2} dot={{ r: 3, fill: '#14b8a6' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-secondary text-sm" style={{ padding: 40 }}>
              Processing trend data...
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3>💰 Revenue Summary</h3>
          {revenue ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary text-sm">Premium Collected</span>
                <span className="font-mono font-bold" style={{ color: 'var(--success)' }}>
                  ₹{revenue.total_premium_collected?.toFixed(2)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary text-sm">Total Payouts</span>
                <span className="font-mono font-bold" style={{ color: 'var(--danger)' }}>
                  ₹{revenue.total_payouts?.toFixed(2)}
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 12,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm font-bold">Net Position</span>
                <span className="font-mono font-bold" style={{
                  fontSize: '1.1rem',
                  color: revenue.net_position >= 0 ? 'var(--success)' : 'var(--danger)',
                }}>
                  {revenue.net_position >= 0 ? '+' : ''}₹{revenue.net_position?.toFixed(2)}
                </span>
              </div>
              <div className="risk-gauge-bar" style={{ marginTop: 4 }}>
                <div className="risk-gauge-fill" style={{
                  width: `${Math.min(100, revenue.overall_loss_ratio || 0)}%`,
                  background: lossColor,
                }} />
              </div>
              <div className="text-xs text-hint text-center">
                Loss Ratio: {revenue.overall_loss_ratio?.toFixed(1)}% •
                {revenue.profitability === 'profitable' ? ' ✅ Profitable' : ' ⚠️ Loss'}
              </div>
            </div>
          ) : (
            <div className="text-center text-secondary text-sm" style={{ padding: 40 }}>Loading...</div>
          )}
        </div>
      </div>

      {/* Predictive Analytics + Fraud Stats */}
      <div className="charts-grid mt-24">
        <div className="chart-card">
          <h3>🔮 Next Week Predictions</h3>
          {predictions?.zone_predictions ? (
            <div>
              <div className="text-center mb-12">
                <span className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                  {predictions.total_predicted_claims?.toFixed(0)}
                </span>
                <div className="text-xs text-hint">predicted claims next week</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {predictions.zone_predictions.map((z: any) => (
                  <div key={z.zone_h3} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', borderRadius: 8,
                    background: z.risk_level === 'high' ? 'rgba(239,68,68,0.08)' :
                      z.risk_level === 'medium' ? 'rgba(245,158,11,0.08)' : 'transparent',
                  }}>
                    <div>
                      <span className="text-sm font-bold">{z.zone_name}</span>
                      <span className={`badge badge-sm ml-8 ${
                        z.risk_level === 'high' ? 'badge-danger' :
                        z.risk_level === 'medium' ? 'badge-warning' : 'badge-success'
                      }`} style={{ fontSize: '0.6rem', marginLeft: 8 }}>{z.risk_level}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm">{z.predicted_claims_next_week?.toFixed(1)}</span>
                      <span className="text-xs text-hint ml-4" style={{ marginLeft: 4 }}>claims</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-hint text-center mt-8" style={{ opacity: 0.6 }}>
                Model: {predictions.prediction_model}
              </div>
            </div>
          ) : (
            <div className="text-center text-secondary text-sm" style={{ padding: 40 }}>Loading predictions...</div>
          )}
        </div>

        <div className="chart-card">
          <h3>🛡️ Fraud Detection</h3>
          {fraudStats ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="mini-stat">
                  <div className="text-xs text-hint">Detection Rate</div>
                  <div className="font-mono font-bold" style={{ color: 'var(--primary-400)' }}>
                    {fraudStats.detection_rate_percent}%
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="text-xs text-hint">False Positive Est.</div>
                  <div className="font-mono font-bold" style={{ color: 'var(--warning)' }}>
                    {fraudStats.false_positive_estimate_percent}%
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="text-xs text-hint">Flagged (30d)</div>
                  <div className="font-mono font-bold" style={{ color: 'var(--danger)' }}>
                    {fraudStats.fraud_flagged}
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="text-xs text-hint">Banned Riders</div>
                  <div className="font-mono font-bold">{fraudStats.banned_riders}</div>
                </div>
              </div>
              {fraudStats.flag_breakdown?.length > 0 && (
                <div>
                  <div className="text-xs text-hint mb-4" style={{ fontWeight: 600 }}>TOP FLAGS</div>
                  {fraudStats.flag_breakdown.slice(0, 5).map((f: any) => (
                    <div key={f.flag} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '4px 0', fontSize: '0.75rem',
                    }}>
                      <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>{f.flag}</span>
                      <span className="font-mono">{f.count}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-hint mt-8" style={{ opacity: 0.6 }}>
                Models: {fraudStats.models_active?.join(', ')}
              </div>
            </div>
          ) : (
            <div className="text-center text-secondary text-sm" style={{ padding: 40 }}>Loading fraud stats...</div>
          )}
        </div>
      </div>

      {/* Zone Heatmap + Fraud Review Queue */}
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
                      <td><div style={{ fontWeight: 600 }}>{z.zone_name}</div></td>
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
          <h3>⚠️ Fraud Review Queue</h3>
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
                          <span key={i} className="badge badge-danger" style={{ fontSize: '0.6rem' }}>{f}</span>
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
            <div className="text-center text-secondary text-sm" style={{ padding: 24 }}>No fraud flags ✅</div>
          )}
        </div>
      </div>

      {/* Claim Status Breakdown Chart */}
      <div className="charts-grid mt-24">
        <div className="chart-card">
          <h3>Claim Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Tooltip contentStyle={CHART_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>📊 Loss Ratio Gauge</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0' }}>
            <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: lossColor }}>
              {lossRatio.toFixed(1)}%
            </div>
            <div style={{ flex: 1 }}>
              <div className="risk-gauge-bar" style={{ height: 12 }}>
                <div className="risk-gauge-fill" style={{
                  width: `${Math.min(100, lossRatio)}%`,
                  background: lossColor,
                }} />
              </div>
              <div className="text-xs text-hint mt-4">
                {lossRatio < 40 ? '✅ Healthy' : lossRatio < 60 ? '⚠️ Moderate' : '🚨 Critical'}
              </div>
              <div className="text-xs text-hint mt-4">
                Target: &lt;50% | Industry avg: 60-70%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
