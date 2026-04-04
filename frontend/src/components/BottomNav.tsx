import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';

const NAV_ITEMS = [
  { path: '/dashboard', icon: 'home' as const, label: 'Home' },
  { path: '/policy', icon: 'policy' as const, label: 'Policy' },
  { path: '/claims', icon: 'claims' as const, label: 'Claims' },
  { path: '/sim', icon: 'sim' as const, label: 'Sim' },
  { path: '/profile', icon: 'profile' as const, label: 'Profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            id={`nav-${item.label.toLowerCase()}`}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
