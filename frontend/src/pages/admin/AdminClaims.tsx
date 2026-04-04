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
    try {
      await claimsAPI.approve(id);
      toast.success('Approved');
      loadClaims();
    } catch { toast.error('Failed'); }
  };

  const handleReject = async (id: string) => {
    try {
      await claimsAPI.reject(id, 'Admin rejected');
      toast.success('Rejected');
      loadClaims();
    } catch { toast.error('Failed'); }
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

  return (
    <div>
      <div className="flex items-center justify-between mb-20">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📋 All Claims</h1>
        {selected.size > 0 && (
          <button className="btn btn-primary btn-sm" style={{ width: 'auto' }} onClick={handleBulkApprove}>
            ✓ Approve {selected.size} Selected
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
        {['', 'pending', 'approved', 'paid', 'rejected', 'fraud_check'].map(s => (
          <button key={s}
            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            style={{ width: 'auto' }}
            onClick={() => { setStatusFilter(s); setPage(1); }}>
            {s ? (STATUS_CONFIG[s]?.label || s) : 'All'} {s === '' ? `(${total})` : ''}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>☐</th>
              <th>Date</th><th>Type</th><th>Zone</th><th>SRS</th>
              <th>Payout</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-center"><div className="spinner" /></div></td></tr>
            ) : claims.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-secondary" style={{ padding: 24 }}>No claims</td></tr>
            ) : claims.map(c => {
              const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              return (
                <tr key={c.id}>
                  <td>
                    <input type="checkbox" checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      style={{ cursor: 'pointer' }} />
                  </td>
                  <td className="text-sm">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '--'}</td>
                  <td className="font-bold text-sm">{c.trigger_type}</td>
                  <td className="text-xs font-mono">{c.affected_zone_h3?.substring(0, 10)}...</td>
                  <td className="font-mono">{c.srs_score?.toFixed(1)}</td>
                  <td className="font-mono font-bold">₹{c.calculated_payout_rs?.toFixed(2)}</td>
                  <td><span className={`badge ${cfg.class}`}>{cfg.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(c.status === 'pending' || c.status === 'fraud_check') && (
                        <>
                          <button className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--success)', width: 'auto' }}
                            onClick={() => handleApprove(c.id)}>✓</button>
                          <button className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)', width: 'auto' }}
                            onClick={() => handleReject(c.id)}>✕</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-12 mt-20">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span className="text-sm text-secondary">Page {page}</span>
        <button className="btn btn-ghost btn-sm" disabled={claims.length < 20}
          onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  );
}
