import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ridersAPI } from '../lib/api';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  paid: { label: 'Paid', class: 'badge-success' },
  approved: { label: 'Approved', class: 'badge-info' },
  pending: { label: 'Pending', class: 'badge-warning' },
  rejected: { label: 'Rejected', class: 'badge-danger' },
  fraud_check: { label: 'Fraud Review', class: 'badge-purple' },
};

const FRAUD_LAYERS = [
  { name: 'GPS Validation', desc: 'Cell tower triangulation + accelerometer cross-check', icon: '📍' },
  { name: 'Behavioral Physics', desc: 'Speed/distance impossibility detection', icon: '🧠' },
  { name: 'GNN Ring Detection', desc: 'Graph neural network for syndicate patterns', icon: '🕸️' },
  { name: 'Isolation Forest', desc: '8-feature ML anomaly scoring', icon: '🤖' },
  { name: 'Zoink Score Gate', desc: 'Reputation-based approval routing', icon: '🏆' },
];

export default function ClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadClaims(); }, [page]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const res = await ridersAPI.getClaims(page);
      setClaims(res.data.claims || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load claims'); }
    finally { setLoading(false); }
  };

  if (loading && claims.length === 0) {
    return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  }

  const paidCount = claims.filter(c => c.status === 'paid').length;
  const flaggedCount = claims.filter(c => c.status === 'fraud_check' || (c.fraud_flags && c.fraud_flags.length > 0)).length;
  const totalPayout = claims.filter(c => c.status === 'paid').reduce((s, c) => s + (c.calculated_payout_rs || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Claims History</h1>
        <p className="page-subtitle">{total} total claims • Auto-processed by AI pipeline</p>
      </div>

      <div className="page-content">
        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <div className="card" style={{ padding: 10, textAlign: 'center' }}>
            <div className="font-mono font-bold" style={{ color: 'var(--success)', fontSize: '1.1rem' }}>{paidCount}</div>
            <div className="text-xs text-hint">Paid</div>
          </div>
          <div className="card" style={{ padding: 10, textAlign: 'center' }}>
            <div className="font-mono font-bold" style={{ color: 'var(--danger)', fontSize: '1.1rem' }}>{flaggedCount}</div>
            <div className="text-xs text-hint">Flagged</div>
          </div>
          <div className="card" style={{ padding: 10, textAlign: 'center' }}>
            <div className="font-mono font-bold" style={{ color: 'var(--primary-400)', fontSize: '1.1rem' }}>₹{totalPayout.toFixed(0)}</div>
            <div className="text-xs text-hint">Total Earned</div>
          </div>
        </div>

        {/* 5-Layer Fraud Pipeline */}
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 10 }}>🔒 5-Layer Fraud Pipeline (every claim passes through)</h3>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {FRAUD_LAYERS.map((l, i) => (
              <div key={i} style={{
                flex: '0 0 auto', padding: '8px 10px', borderRadius: 8, textAlign: 'center', minWidth: 90,
                background: 'rgba(20, 184, 166, 0.06)', border: '1px solid rgba(20, 184, 166, 0.15)',
                position: 'relative',
              }}>
                <div style={{ fontSize: '1.2rem' }}>{l.icon}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: 4 }}>{l.name}</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-hint)', marginTop: 2 }}>{l.desc}</div>
                {i < FRAUD_LAYERS.length - 1 && (
                  <div style={{
                    position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.8rem', color: 'var(--primary-400)', zIndex: 1,
                  }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Razorpay Payout Flow Explanation */}
        <div className="card" style={{ padding: 14, marginBottom: 16, background: 'rgba(43, 99, 246, 0.04)', border: '1px solid rgba(43, 99, 246, 0.15)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8, color: '#3772FF' }}>💳 Razorpay Instant Payout Flow</h3>
          <div style={{ display: 'flex', gap: 12, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>1️⃣</div>
              <div style={{ fontWeight: 600 }}>Claim Verified</div>
              <div className="text-xs text-hint">AI pipeline approves</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>2️⃣</div>
              <div style={{ fontWeight: 600 }}>Order Created</div>
              <div className="text-xs text-hint">Razorpay order_id</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>3️⃣</div>
              <div style={{ fontWeight: 600 }}>UPI Transfer</div>
              <div className="text-xs text-hint">Instant to rider</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>4️⃣</div>
              <div style={{ fontWeight: 600 }}>Webhook</div>
              <div className="text-xs text-hint">Status confirmed</div>
            </div>
          </div>
        </div>

        {/* Claims List */}
        {claims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <div className="empty-text">No claims yet — your shield is standing by</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {claims.map((c: any) => {
              const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              const isExpanded = expandedId === c.id;

              return (
                <div key={c.id} className="card card-hover cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.trigger_type?.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-hint">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : '--'}
                      </div>
                      <div className="text-xs text-hint">Zone: {c.affected_zone_h3?.substring(0, 8)}...</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold">₹{c.calculated_payout_rs?.toFixed(2)}</div>
                      <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-default)' }}>
                      <div className="grid-2" style={{ gap: 8 }}>
                        <div>
                          <div className="text-xs text-hint">SRS Score</div>
                          <div className="font-mono font-bold" style={{
                            color: (c.srs_score || 0) > 7 ? 'var(--danger)' : (c.srs_score || 0) > 4 ? 'var(--warning)' : 'var(--success)'
                          }}>{c.srs_score?.toFixed(2)} / 10</div>
                        </div>
                        <div>
                          <div className="text-xs text-hint">Payout %</div>
                          <div className="font-mono font-bold">{((c.payout_percentage || 0) * 100).toFixed(0)}%</div>
                          <div className="text-xs text-hint">SRS sliding scale</div>
                        </div>
                        <div>
                          <div className="text-xs text-hint">Disruption Start</div>
                          <div className="text-sm">{c.disruption_start ? new Date(c.disruption_start).toLocaleString() : '--'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-hint">Disruption End</div>
                          <div className="text-sm">{c.disruption_end ? new Date(c.disruption_end).toLocaleString() : 'Ongoing'}</div>
                        </div>
                      </div>

                      {/* Fraud Pipeline Status */}
                      <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: c.status === 'fraud_check' ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: c.status === 'fraud_check' ? 'var(--danger)' : 'var(--success)', marginBottom: 4 }}>
                          {c.status === 'fraud_check' ? '⚠️ Flagged at fraud layer' : '✅ Passed all 5 fraud layers'}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {FRAUD_LAYERS.map((l, i) => {
                            const hasFraud = c.status === 'fraud_check' && i >= 3;
                            return (
                              <span key={i} style={{
                                fontSize: '0.8rem', opacity: hasFraud ? 0.5 : 1,
                              }}>{l.icon}{!hasFraud ? '✓' : '?'}</span>
                            );
                          })}
                        </div>
                      </div>

                      {c.fraud_flags && c.fraud_flags.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div className="text-xs text-hint mb-4">Fraud Flags</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {c.fraud_flags.map((f: string, i: number) => (
                              <span key={i} className="badge badge-danger">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {c.razorpay_payment_id && (
                        <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(43, 99, 246, 0.06)' }}>
                          <div className="text-xs text-hint">Razorpay Payment</div>
                          <div className="text-sm font-mono">{c.razorpay_payment_id}</div>
                          <div className="text-xs text-hint" style={{ marginTop: 2 }}>UPI Instant Transfer • Settlement: T+0</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-12 mt-20">
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="text-sm text-secondary">Page {page}</span>
            <button className="btn btn-ghost btn-sm" disabled={claims.length < 20} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
