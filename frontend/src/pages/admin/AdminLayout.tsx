import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: '◈', label: 'Dashboard' },
  { path: '/admin/riders', icon: '◉', label: 'Riders' },
  { path: '/admin/claims', icon: '≡', label: 'Claims' },
  { path: '/admin/disruptions', icon: '⚡', label: 'Disruptions' },
  { path: '/admin/simulate', icon: '▷', label: 'Simulate' },
];

export default function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('admin_key'));
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    if (password === 'admin123') {
      localStorage.setItem('admin_key', 'admin-secret-key');
      setIsAdmin(true);
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_key');
    setIsAdmin(false);
    navigate('/onboarding');
  };

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)', padding: 24,
      }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', margin: '0 auto 14px',
            }}>🔐</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>Admin Console</h2>
            <p className="text-secondary text-sm">Zoink-4-u Operations Panel</p>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              id="admin-password"
              className="input-field"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <div className="info-box" style={{ marginTop: 6 }}>
              <span>💡</span>
              <span>Use <strong>admin123</strong> for demo</span>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleLogin} style={{ marginTop: 8 }}>
            Enter Admin Panel
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/onboarding')}
            style={{ marginTop: 8, color: 'var(--text-hint)' }}>
            ← Back to Rider App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container admin-layout" style={{ maxWidth: '100%' }}>
      <div className="admin-wrapper">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-logo">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'var(--accent-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem',
              }}>🛡️</div>
              <div>
                <h2>Zoink-4-u</h2>
                <span>Admin Console</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, paddingTop: 8 }}>
            {NAV_ITEMS.map(item => (
              <div
                key={item.path}
                className={`admin-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon" style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
            <div
              className="admin-nav-link"
              onClick={() => navigate('/dashboard')}
            >
              <span className="nav-icon">📱</span>
              <span>Rider App</span>
            </div>
            <div
              className="admin-nav-link"
              onClick={handleLogout}
              style={{ color: 'var(--danger)' }}
            >
              <span className="nav-icon">↩</span>
              <span>Logout</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
