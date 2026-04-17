import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, ZAxis, Legend,
} from 'recharts';
import { analyticsAPI, mlEngineAPI } from '../../lib/api';

const CHART_STYLE = { background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' };

export default function AdminAnalytics() {
  const [fraudStats, setFraudStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [modelsStatus, setModelsStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [fraudRes, revRes] = await Promise.all([
        analyticsAPI.getFraudStats(),
        analyticsAPI.getRevenue(),
      ]);
      setFraudStats(fraudRes.data);
      setRevenue(revRes.data);

      try {
        const modelsRes = await mlEngineAPI.getModelsStatus();
        setModelsStatus(modelsRes.data);
      } catch { /* ML engine may not be running */ }
    } catch (err: any) {
      toast.error('Failed to load analytics');
    } finally { setLoading(false); }
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  const zoneScatterData = revenue?.zone_breakdown?.map((z: any) => ({
    name: z.zone_name,
    premium: z.premium_collected,
    payout: z.payouts,
    loss_ratio: z.loss_ratio,
  })) || [];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>🔬 Deep Analytics</h1>
      <p className="text-secondary mb-24">ML model performance, zone economics, and fraud intelligence</p>

      {/* ML Models Status */}
      <div className="chart-card mb-24">
        <h3>🧠 ML Models Status</h3>
        {modelsStatus ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span className={`badge ${modelsStatus.status === 'ready' ? 'badge-success' : 'badge-warning'}`}>
                {modelsStatus.status?.toUpperCase()}
              </span>
              <span className="text-sm text-secondary">
                Training time: {modelsStatus.training_time_seconds?.toFixed(2)}s
              </span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Key Metric</th>
                    <th>Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(modelsStatus.models || {}).map(([name, m]: [string, any]) => (
                    <tr key={name}>
                      <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {name.replace(/_/g, ' ')}
                      </td>
                      <td className="text-xs text-hint">{m.model_type || 'N/A'}</td>
                      <td>
                        <span className={`badge ${m.status === 'trained' ? 'badge-success' : 'badge-danger'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="font-mono">
                        {m.auc_roc ? `AUC: ${m.auc_roc}` :
                         m.accuracy ? `Acc: ${(m.accuracy * 100).toFixed(1)}%` :
                         m.r2_score ? `R²: ${m.r2_score}` :
                         m.avg_mae ? `MAE: ${m.avg_mae}` :
                         m.detection_accuracy ? `Det: ${(m.detection_accuracy * 100).toFixed(1)}%` :
                         'N/A'}
                      </td>
                      <td className="font-mono text-xs">
                        {m.training_samples || m.zones_trained || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Feature Importances for Fraud Model */}
            {modelsStatus.models?.fraud_detection?.feature_importances && (
              <div style={{ marginTop: 20 }}>
                <h4 className="text-sm font-bold text-secondary mb-8">
                  Fraud Model Feature Importances
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={Object.entries(modelsStatus.models.fraud_detection.feature_importances)
                      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), importance: value }))
                      .sort((a: any, b: any) => b.importance - a.importance)}
                    layout="vertical"
                    margin={{ left: 120 }}
                  >
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={110} />
                    <Tooltip contentStyle={CHART_STYLE} />
                    <Bar dataKey="importance" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-secondary text-sm" style={{ padding: 40 }}>
            ML Engine not connected
          </div>
        )}
      </div>

      {/* Zone Economics */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>📊 Premium vs Payout by Zone</h3>
          {zoneScatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={zoneScatterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-15} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={CHART_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="premium" name="Premium ₹" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payout" name="Payout ₹" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-secondary text-sm" style={{ padding: 40 }}>No data</div>
          )}
        </div>

        <div className="chart-card">
          <h3>📈 Zone Loss Ratios</h3>
          {zoneScatterData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {zoneScatterData.map((z: any) => {
                const lr = z.loss_ratio || 0;
                const color = lr < 40 ? 'var(--success)' : lr < 60 ? 'var(--warning)' : 'var(--danger)';
                return (
                  <div key={z.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                      <span className="font-bold">{z.name}</span>
                      <span className="font-mono" style={{ color }}>{lr.toFixed(1)}%</span>
                    </div>
                    <div className="risk-gauge-bar" style={{ height: 6 }}>
                      <div className="risk-gauge-fill" style={{
                        width: `${Math.min(100, lr)}%`,
                        background: color,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-secondary text-sm" style={{ padding: 40 }}>No data</div>
          )}
        </div>
      </div>

      {/* Fraud Intelligence */}
      {fraudStats && (
        <div className="chart-card mt-24">
          <h3>🕵️ Fraud Intelligence Summary</h3>
          <div className="kpi-grid" style={{ marginTop: 16 }}>
            <div className="stat-card">
              <div className="stat-label">Total Claims (30d)</div>
              <div className="stat-value">{fraudStats.total_claims}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Flagged</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{fraudStats.fraud_flagged}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Rejected</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{fraudStats.rejected}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Approved</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{fraudStats.approved}</div>
            </div>
          </div>
          <div className="mt-16">
            <div className="text-xs text-hint font-bold mb-8">ACTIVE DETECTION MODELS</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {fraudStats.models_active?.map((m: string) => (
                <span key={m} className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                  {m.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
