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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Claims History</h1>
        <p className="page-subtitle">{total} total claims</p>
      </div>

      <div className="page-content">
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
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.trigger_type}</div>
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
                          <div className="font-mono font-bold">{c.srs_score?.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-hint">Payout %</div>
                          <div className="font-mono font-bold">{(c.payout_percentage * 100).toFixed(0)}%</div>
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
                        <div style={{ marginTop: 8 }}>
                          <div className="text-xs text-hint">Payment ID</div>
                          <div className="text-sm font-mono">{c.razorpay_payment_id}</div>
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
            <button className="btn btn-ghost btn-sm" disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="text-sm text-secondary">Page {page}</span>
            <button className="btn btn-ghost btn-sm" disabled={claims.length < 20}
              onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
