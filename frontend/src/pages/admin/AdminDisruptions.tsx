import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../lib/api';

export default function AdminDisruptions() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => { loadEvents(); }, [showActiveOnly]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDisruptionEvents(showActiveOnly);
      setEvents(res.data.events || []);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-20">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>⚡ Disruption Events</h1>
        <label className="flex items-center gap-8 cursor-pointer">
          <input type="checkbox" checked={showActiveOnly}
            onChange={e => setShowActiveOnly(e.target.checked)}
            style={{ cursor: 'pointer' }} />
          <span className="text-sm text-secondary">Active Only</span>
        </label>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th><th>Zone</th><th>City</th><th>Severity</th>
              <th>Started</th><th>Status</th><th>Affected</th><th>Payout</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-center"><div className="spinner" /></div></td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-secondary" style={{ padding: 24 }}>No events</td></tr>
            ) : events.map(e => (
              <tr key={e.id}>
                <td className="font-bold">{e.event_type}</td>
                <td className="text-xs font-mono">{e.zone_h3?.substring(0, 10)}...</td>
                <td>{e.city}</td>
                <td>
                  <span className={`badge ${e.severity >= 8 ? 'badge-danger' : e.severity >= 5 ? 'badge-warning' : 'badge-info'}`}>
                    {e.severity}/10
                  </span>
                </td>
                <td className="text-sm">{e.started_at ? new Date(e.started_at).toLocaleString() : '--'}</td>
                <td>
                  <span className={`badge ${e.is_active ? 'badge-danger' : 'badge-neutral'}`}>
                    {e.is_active ? '🔴 Active' : 'Ended'}
                  </span>
                </td>
                <td className="font-mono">{e.affected_riders}</td>
                <td className="font-mono font-bold">₹{e.total_payout?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
