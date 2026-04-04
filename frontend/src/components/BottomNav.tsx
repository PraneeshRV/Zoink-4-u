import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Home' },
  { path: '/policy', icon: '🛡️', label: 'Policy' },
  { path: '/claims', icon: '📋', label: 'Claims' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {isActive && <span className="nav-dot" />}
          </button>
        );
      })}
    </nav>
  );
}
