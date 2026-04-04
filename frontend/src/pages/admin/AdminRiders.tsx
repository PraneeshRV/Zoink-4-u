import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../lib/api';

export default function AdminRiders() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRider, setSelectedRider] = useState<any>(null);

  useEffect(() => { loadRiders(); }, [page, search]);

  const loadRiders = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getRiders(page, search);
      setRiders(res.data.riders || []);
      setTotal(res.data.total || 0);
    } catch { toast.error('Failed to load riders'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-20">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>👥 Riders</h1>
        <span className="text-secondary text-sm">{total} total</span>
      </div>

      {/* Search */}
      <div className="input-group" style={{ maxWidth: 400 }}>
        <input className="input-field" placeholder="Search by name or phone..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      <div className="table-container mt-16">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Phone</th><th>Platform</th><th>City</th>
              <th>Zone</th><th>Zoink Score</th><th>Tier</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-center"><div className="spinner" /></div></td></tr>
            ) : riders.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-secondary" style={{ padding: 24 }}>No riders found</td></tr>
            ) : riders.map(r => (
              <tr key={r.id} className="cursor-pointer" onClick={() => setSelectedRider(r)}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td className="font-mono">{r.phone}</td>
                <td><span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>{r.platform}</span></td>
                <td>{r.city}</td>
                <td className="text-xs font-mono">{r.zone_h3?.substring(0, 10)}...</td>
                <td>
                  <span className={`badge ${r.zoink_score >= 70 ? 'badge-success' : r.zoink_score >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                    {r.zoink_score}
                  </span>
                </td>
                <td style={{ textTransform: 'uppercase', fontWeight: 600 }}>{r.active_tier || '—'}</td>
                <td>
                  {r.is_banned ? <span className="badge badge-danger">Banned</span> :
                   r.is_verified ? <span className="badge badge-success">Active</span> :
                   <span className="badge badge-neutral">Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-12 mt-20">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span className="text-sm text-secondary">Page {page}</span>
        <button className="btn btn-ghost btn-sm" disabled={riders.length < 20}
          onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>

      {/* Rider Detail Modal */}
      {selectedRider && (
        <div className="modal-overlay" onClick={() => setSelectedRider(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedRider.name}</h2>
              <button className="modal-close" onClick={() => setSelectedRider(null)}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Phone', selectedRider.phone],
                ['Platform', selectedRider.platform],
                ['City', selectedRider.city],
                ['Zone', selectedRider.zone_h3],
                ['Zoink Score', selectedRider.zoink_score],
                ['Tier', selectedRider.active_tier || 'None'],
                ['Status', selectedRider.is_banned ? 'Banned' : selectedRider.is_verified ? 'Active' : 'Pending'],
                ['Joined', selectedRider.created_at ? new Date(selectedRider.created_at).toLocaleDateString() : '--'],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-center"
                  style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-sm text-secondary">{label}</span>
                  <span className="text-sm font-bold">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
