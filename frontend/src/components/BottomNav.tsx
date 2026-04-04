import { Link, useLocation } from 'react-router-dom';
import { Home, Shield, Zap, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { name: 'Home', path: '/dashboard', icon: Home },
  { name: 'Cover', path: '/purchase', icon: Shield },
  { name: 'Claims', path: '/claims', icon: Zap },
  { name: 'Wallet', path: '/wallet', icon: Wallet },
  { name: 'Profile', path: '/profile', icon: User },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="floating-nav">
      <div className="flex justify-around items-center px-2 py-3">
        {tabs.map(t => {
          const active = pathname === t.path;
          return (
            <Link
              key={t.name}
              to={t.path}
              className="flex flex-col items-center gap-0.5 relative"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`p-1.5 rounded-xl transition-colors duration-200 ${
                  active ? 'text-primary-400' : 'text-text-hint hover:text-text-secondary'
                }`}
              >
                <t.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </motion.div>
              <span className={`text-[9px] font-bold tracking-wide ${
                active ? 'text-primary-400' : 'text-text-hint'
              }`}>
                {t.name}
              </span>
              {active && (
                <motion.div
                  className="nav-active-dot"
                  layoutId="navDot"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
