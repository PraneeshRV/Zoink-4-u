import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/admin/riders', icon: '👥', label: 'Riders' },
  { path: '/admin/claims', icon: '📋', label: 'Claims' },
  { path: '/admin/disruptions', icon: '⚡', label: 'Disruptions' },
  { path: '/admin/simulate', icon: '🎮', label: 'Simulate' },
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
        background: 'var(--surface-base)',
      }}>
        <div className="card-glass" style={{ maxWidth: 400, width: '100%', padding: 32, textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>🔐 Admin Panel</h2>
          <p className="text-secondary text-sm mb-20">Enter admin password to continue</p>
          <div className="input-group">
            <input className="input-field" type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <p className="text-xs text-hint mt-4">💡 Use <strong>admin123</strong> for demo</p>
          </div>
          <button className="btn btn-primary mt-12" onClick={handleLogin}>
            Enter Admin Panel
          </button>
          <button className="btn btn-ghost mt-8" onClick={() => navigate('/onboarding')}>
            ← Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container admin-layout">
      <div className="admin-wrapper">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-logo">
            <h2>Zoink-4-u</h2>
            <span>Admin Console</span>
          </div>
          {NAV_ITEMS.map(item => (
            <div
              key={item.path}
              className={`admin-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
          <div style={{ padding: '24px 24px 0', marginTop: 'auto', borderTop: '1px solid var(--border-default)' }}>
            <div className="admin-nav-link" onClick={handleLogout} style={{ marginTop: 12 }}>
              <span className="nav-icon">🚪</span>
              <span>Logout</span>
            </div>
            <div className="admin-nav-link" onClick={() => navigate('/onboarding')}>
              <span className="nav-icon">📱</span>
              <span>Rider App</span>
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
