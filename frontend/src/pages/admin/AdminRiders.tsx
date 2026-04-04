import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../lib/api';

const PLATFORM_ICONS: Record<string, string> = {
  swiggy: '🧡', zomato: '❤️', zepto: '💜', amazon: '📦', flipkart: '🛒',
};

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
      <div style={{ marginBottom: 24 }}>
        <h1 className="admin-page-title">Riders</h1>
        <p className="admin-page-sub">{total} registered riders across all zones</p>
        <div style={{ maxWidth: 420 }}>
          <input
            className="input-field"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rider</th><th>Phone</th><th>Platform</th><th>City</th>
                <th>Zoink Score</th><th>Tier</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}>
                  <div className="loading-center" style={{ minHeight: 120 }}>
                    <div className="spinner" />
                  </div>
                </td></tr>
              ) : riders.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state" style={{ padding: 32 }}>
                    <div className="empty-icon">🔍</div>
                    <div className="empty-text">No riders found</div>
                  </div>
                </td></tr>
              ) : riders.map(r => (
                <tr key={r.id} className="cursor-pointer" onClick={() => setSelectedRider(r)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1rem' }}>
                        {PLATFORM_ICONS[r.platform] || '🚴'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.name}</div>
                        <div className="text-xs text-hint">{r.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-sm">{r.phone}</td>
                  <td>
                    <span className="badge badge-gray" style={{ textTransform: 'uppercase' }}>{r.platform}</span>
                  </td>
                  <td className="text-sm text-secondary">{r.city}</td>
                  <td>
                    <span className={`badge ${r.zoink_score >= 70 ? 'badge-success' : r.zoink_score >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                      {r.zoink_score}
                    </span>
                  </td>
                  <td style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.8rem' }}>{r.active_tier || '—'}</td>
                  <td>
                    {r.is_banned
                      ? <span className="badge badge-danger">Banned</span>
                      : r.is_verified
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-gray">Pending</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20 }}>
        <button className="btn btn-secondary btn-sm" disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span className="text-sm text-secondary">Page {page}</span>
        <button className="btn btn-secondary btn-sm" disabled={riders.length < 20}
          onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>

      {/* Rider Detail Slide-over */}
      {selectedRider && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={() => setSelectedRider(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 480, width: '100%', padding: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedRider.name}</div>
                <div className="text-sm text-secondary">{selectedRider.platform?.toUpperCase()} Rider</div>
              </div>
              <button
                style={{
                  background: 'var(--bg-overlay)', border: 'none', borderRadius: 8,
                  width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
                  color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onClick={() => setSelectedRider(null)}
              >×</button>
            </div>
            {[
              ['Phone', selectedRider.phone],
              ['City', selectedRider.city],
              ['Zone H3', selectedRider.zone_h3],
              ['Zoink Score', selectedRider.zoink_score],
              ['Active Tier', selectedRider.active_tier || 'None'],
              ['Verified', selectedRider.is_verified ? '✅ Yes' : '❌ No'],
              ['Status', selectedRider.is_banned ? '🚫 Banned' : '✅ Active'],
              ['Joined', selectedRider.created_at ? new Date(selectedRider.created_at).toLocaleDateString('en-IN') : '--'],
            ].map(([label, value]) => (
              <div key={label as string} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
              }}>
                <span className="text-sm text-secondary">{label}</span>
                <span className="text-sm font-semibold">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
