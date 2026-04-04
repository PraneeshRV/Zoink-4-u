import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ridersAPI } from '../lib/api';

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: string }> = {
  paid: { label: 'Paid', class: 'badge-success', icon: '✅' },
  approved: { label: 'Approved', class: 'badge-info', icon: '✔️' },
  pending: { label: 'Pending', class: 'badge-warning', icon: '⏳' },
  rejected: { label: 'Rejected', class: 'badge-danger', icon: '❌' },
  fraud_check: { label: 'Under Review', class: 'badge-purple', icon: '🔍' },
};

const TRIGGER_ICONS: Record<string, string> = {
  T1_HEAVY_RAIN: '🌧️', T2_FLASH_FLOOD: '🌊', T3_SEVERE_AQI: '😷',
  T4_EXTREME_HEAT: '🔥', T5_CYCLONE: '🌀', T6_HAILSTORM: '🌨️',
  T7_DENSE_FOG: '🌫️', T9_GRIDLOCK: '🚗', T13_CURFEW: '🚫',
  T14_BANDH: '📢', T17_PLATFORM_CRASH: '📱',
};

export default function ClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

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

  const filtered = filter === 'all' ? claims : claims.filter((c: any) => c.status === filter);

  const totalPaid = claims
    .filter((c: any) => c.status === 'paid')
    .reduce((sum: number, c: any) => sum + (c.calculated_payout_rs || 0), 0);

  if (loading && claims.length === 0) {
    return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Claims</h1>
        <p className="page-subtitle">{total} total · ₹{totalPaid.toFixed(0)} received</p>
      </div>

      <div className="page-content">
        {/* Summary Row */}
        {total > 0 && (
          <div className="grid-3" style={{ gap: 10 }}>
            <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div className="stat-label">Total</div>
              <div className="stat-value">{total}</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div className="stat-label">Paid</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {claims.filter((c: any) => c.status === 'paid').length}
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div className="stat-label">Received</div>
              <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--success)' }}>
                ₹{totalPaid.toFixed(0)}
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        {claims.length > 0 && (
          <div className="pill-tabs">
            {['all', 'paid', 'pending', 'fraud_check', 'rejected'].map(f => (
              <button
                key={f}
                className={`pill-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'fraud_check' ? 'Review' :
                  f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <div className="empty-title">No claims yet</div>
            <div className="empty-text">Your shield is active and standing by. Payouts auto-initiate when triggers fire.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((c: any) => {
              const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              const isExpanded = expandedId === c.id;
              const icon = TRIGGER_ICONS[c.trigger_type] || '⚡';

              return (
                <div
                  key={c.id}
                  className="card"
                  style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  {/* Main row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'var(--bg-overlay)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', flexShrink: 0,
                    }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.trigger_type?.replace(/_/g, ' ') || 'Unknown Trigger'}
                      </div>
                      <div className="text-xs text-hint" style={{ marginTop: 2 }}>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })
                          : '--'
                        }
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="font-mono font-bold">
                        ₹{c.calculated_payout_rs?.toFixed(0) ?? '--'}
                      </div>
                      <span className={`badge ${cfg.class}`}>{cfg.label}</span>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{
                      padding: '14px 16px',
                      borderTop: '1px solid var(--border-subtle)',
                      background: 'var(--bg-raised)',
                      display: 'flex', flexDirection: 'column', gap: 12,
                    }}>
                      <div className="grid-2" style={{ gap: 12 }}>
                        <div className="stat-cell">
                          <div className="stat-label">SRS Score</div>
                          <div className="font-mono font-bold">{c.srs_score?.toFixed(2) ?? '--'}</div>
                        </div>
                        <div className="stat-cell">
                          <div className="stat-label">Payout %</div>
                          <div className="font-mono font-bold">
                            {c.payout_percentage != null ? `${(c.payout_percentage * 100).toFixed(0)}%` : '--'}
                          </div>
                        </div>
                        <div className="stat-cell">
                          <div className="stat-label">Disruption Start</div>
                          <div className="text-sm">
                            {c.disruption_start ? new Date(c.disruption_start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                          </div>
                        </div>
                        <div className="stat-cell">
                          <div className="stat-label">Disruption End</div>
                          <div className="text-sm">
                            {c.disruption_end ? new Date(c.disruption_end).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Ongoing'}
                          </div>
                        </div>
                      </div>

                      {c.fraud_flags?.length > 0 && (
                        <div>
                          <div className="stat-label" style={{ marginBottom: 6 }}>Fraud Flags</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {c.fraud_flags.map((f: string, i: number) => (
                              <span key={i} className="badge badge-danger">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {c.razorpay_payment_id && (
                        <div className="stat-cell">
                          <div className="stat-label">UPI Payment ID</div>
                          <div className="text-sm font-mono">{c.razorpay_payment_id}</div>
                        </div>
                      )}

                      <div className="stat-cell">
                        <div className="stat-label">Zone</div>
                        <div className="text-sm font-mono">{c.affected_zone_h3}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="text-sm text-secondary">Page {page}</span>
            <button className="btn btn-secondary btn-sm" disabled={claims.length < 20}
              onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
