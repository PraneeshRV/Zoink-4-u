import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI, claimsAPI } from '../../lib/api';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  paid: { label: 'Paid', class: 'badge-success' },
  approved: { label: 'Approved', class: 'badge-info' },
  pending: { label: 'Pending', class: 'badge-warning' },
  rejected: { label: 'Rejected', class: 'badge-danger' },
  fraud_check: { label: 'Fraud Review', class: 'badge-purple' },
};

export default function AdminClaims() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { loadClaims(); }, [page, statusFilter]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getClaims(statusFilter, page);
      setClaims(res.data.claims || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load claims'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try { await claimsAPI.approve(id); toast.success('Approved'); loadClaims(); }
    catch { toast.error('Failed'); }
  };

  const handleReject = async (id: string) => {
    try { await claimsAPI.reject(id, 'Admin rejected'); toast.success('Rejected'); loadClaims(); }
    catch { toast.error('Failed'); }
  };

  const handleBulkApprove = async () => {
    for (const id of selected) {
      try { await claimsAPI.approve(id); } catch { /* skip */ }
    }
    toast.success(`Approved ${selected.size} claims`);
    setSelected(new Set());
    loadClaims();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const FILTERS = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'paid', label: 'Paid' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'fraud_check', label: 'Fraud Review' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="admin-page-title">All Claims</h1>
          <p className="admin-page-sub">{total} total claims</p>
        </div>
        {selected.size > 0 && (
          <button
            className="btn btn-primary"
            style={{ width: 'auto', flexShrink: 0 }}
            onClick={handleBulkApprove}
          >
            ✓ Approve {selected.size} Selected
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            style={{
              padding: '7px 14px',
              borderRadius: 100,
              border: '1px solid',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              ...(statusFilter === f.key
                ? { background: 'var(--accent-600)', borderColor: 'var(--accent-600)', color: '#fff' }
                : { background: 'transparent', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }
              ),
            }}
            onClick={() => { setStatusFilter(f.key); setPage(1); }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>☐</th>
                <th>Date</th>
                <th>Trigger</th>
                <th>Zone</th>
                <th>SRS</th>
                <th>Payout</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}>
                  <div className="loading-center" style={{ minHeight: 100 }}>
                    <div className="spinner" />
                  </div>
                </td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state" style={{ padding: 32 }}>
                    <div className="empty-icon">📋</div>
                    <div className="empty-text">No claims found</div>
                  </div>
                </td></tr>
              ) : claims.map(c => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        style={{ cursor: 'pointer', width: 15, height: 15 }}
                      />
                    </td>
                    <td className="text-sm text-secondary">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '--'}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      {c.trigger_type?.replace(/_/g, ' ')}
                    </td>
                    <td className="text-xs font-mono text-secondary">
                      {c.affected_zone_h3?.substring(0, 10)}…
                    </td>
                    <td className="font-mono text-sm">{c.srs_score?.toFixed(1)}</td>
                    <td className="font-mono font-bold">₹{c.calculated_payout_rs?.toFixed(0)}</td>
                    <td><span className={`badge ${cfg.class}`}>{cfg.label}</span></td>
                    <td>
                      {(c.status === 'pending' || c.status === 'fraud_check') && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            style={{
                              background: 'var(--success-soft)',
                              border: '1px solid rgba(81,207,102,0.3)',
                              color: 'var(--success)',
                              borderRadius: 6, padding: '4px 10px',
                              fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                            }}
                            onClick={() => handleApprove(c.id)}
                          >✓</button>
                          <button
                            style={{
                              background: 'var(--danger-soft)',
                              border: '1px solid rgba(255,107,107,0.3)',
                              color: 'var(--danger)',
                              borderRadius: 6, padding: '4px 10px',
                              fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                            }}
                            onClick={() => handleReject(c.id)}
                          >✕</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20 }}>
        <button className="btn btn-secondary btn-sm" disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span className="text-sm text-secondary">Page {page} · {total} claims</span>
        <button className="btn btn-secondary btn-sm" disabled={claims.length < 20}
          onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  );
}
