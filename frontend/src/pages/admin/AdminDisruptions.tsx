import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../lib/api';

const TRIGGER_ICONS: Record<string, string> = {
  T1_HEAVY_RAIN: '🌧️', T2_FLASH_FLOOD: '🌊', T3_SEVERE_AQI: '😷',
  T4_EXTREME_HEAT: '🔥', T5_CYCLONE: '🌀', T6_HAILSTORM: '🌨️',
  T7_DENSE_FOG: '🌫️', T9_GRIDLOCK: '🚗', T10_CURFEW: '🚨',
  T13_CURFEW: '🚫', T14_BANDH: '📢', T17_PLATFORM_CRASH: '📱',
};

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

  const activeCount = events.filter(e => e.is_active).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 className="admin-page-title">Disruption Events</h1>
          <p className="admin-page-sub">
            {events.length} events ·{' '}
            {activeCount > 0 ? (
              <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                {activeCount} active now
              </span>
            ) : 'None active'}
          </p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={e => setShowActiveOnly(e.target.checked)}
            style={{ cursor: 'pointer', width: 15, height: 15 }}
          />
          <span className="text-sm font-semibold">Active only</span>
        </label>
      </div>

      {/* Active event banner */}
      {activeCount > 0 && (
        <div className="trigger-banner" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--danger)' }}>
              {activeCount} Active Disruption{activeCount > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-secondary" style={{ marginTop: 2 }}>
              Auto-claim pipelines may be running
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th><th>City / Zone</th><th>Severity</th>
                <th>Started</th><th>Status</th><th>Riders</th><th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}>
                  <div className="loading-center" style={{ minHeight: 100 }}>
                    <div className="spinner" />
                  </div>
                </td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state" style={{ padding: 32 }}>
                    <div className="empty-icon">✅</div>
                    <div className="empty-title">All clear</div>
                    <div className="empty-text">No disruption events recorded</div>
                  </div>
                </td></tr>
              ) : events.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.1rem' }}>
                        {TRIGGER_ICONS[e.event_type] || '⚡'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                          {e.event_type?.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{e.city}</div>
                    <div className="text-xs font-mono text-hint">{e.zone_h3?.substring(0, 10)}…</div>
                  </td>
                  <td>
                    <span className={`badge ${e.severity >= 8 ? 'badge-danger' : e.severity >= 5 ? 'badge-warning' : 'badge-info'}`}>
                      {e.severity}/10
                    </span>
                  </td>
                  <td className="text-sm text-secondary">
                    {e.started_at ? new Date(e.started_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    }) : '--'}
                  </td>
                  <td>
                    {e.is_active ? (
                      <span className="badge badge-danger">
                        <span className="dot-live" style={{ width: 6, height: 6 }} /> Active
                      </span>
                    ) : (
                      <span className="badge badge-gray">Ended</span>
                    )}
                  </td>
                  <td className="font-mono text-sm">{e.affected_riders ?? '—'}</td>
                  <td className="font-mono font-bold text-sm">
                    {e.total_payout != null ? `₹${e.total_payout.toFixed(0)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
