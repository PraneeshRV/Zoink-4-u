import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, Phone, Calendar, ShieldCheck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuth';
import { useAppStore } from '../store/useApp';
import BottomNav from '../components/BottomNav';
import ZoinkScoreRing from '../components/ZoinkScoreRing';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const { activePolicy, zoinkScore } = useAppStore();
  const navigate = useNavigate();

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ZK';

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="pt-12 pb-2 px-5">
        <h1 className="text-xl font-extrabold text-text-primary">Profile</h1>
      </header>

      <main className="px-5 flex-1 flex flex-col gap-4 pb-24">
        {/* User Info Card */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                boxShadow: '0 8px 24px rgba(13, 148, 136, 0.3)',
              }}
            >
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-extrabold text-text-primary">{user?.name || 'Worker'}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <Phone size={11} /> {user?.phone}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <MapPin size={11} /> {user?.zone_id}
                </span>
              </div>
              {user?.created_at && (
                <span className="flex items-center gap-1 text-[10px] text-text-hint mt-1">
                  <Calendar size={10} /> Joined {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zoink Score */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-sm text-text-primary mb-4">Your Zoink Score</h3>
          <div className="flex items-center justify-between">
            <ZoinkScoreRing score={zoinkScore} size={130} />
            <div className="flex-1 ml-5 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Tenure bonus</span>
                <span className="font-bold text-success font-mono">+8</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Clean months</span>
                <span className="font-bold text-success font-mono">+6</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Fraud flags</span>
                <span className="font-bold text-text-hint font-mono">0</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Community bonus</span>
                <span className="font-bold text-primary-400 font-mono">+1</span>
              </div>
              <div className="border-t border-border-default pt-2 flex justify-between text-xs">
                <span className="text-text-primary font-bold">Total</span>
                <span className="font-bold font-mono text-primary-400">{zoinkScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Policy */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            {activePolicy ? (
              <ShieldCheck size={18} className="text-success" />
            ) : (
              <Shield size={18} className="text-text-hint" />
            )}
            <h3 className="font-bold text-sm text-text-primary">Policy Status</h3>
          </div>
          {activePolicy ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Tier</span>
                <span className="font-bold text-primary-400">{activePolicy.tier}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Weekly Premium</span>
                <span className="font-bold font-mono">₹{activePolicy.weekly_premium}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Buyback</span>
                <span className={`font-bold ${activePolicy.has_buyback ? 'text-success' : 'text-text-hint'}`}>
                  {activePolicy.has_buyback ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-hint">No active policy.</p>
          )}
        </div>

        {/* Logout */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="btn-outline flex items-center justify-center gap-2 text-danger border-danger/30 hover:border-danger hover:text-danger mb-4"
        >
          <LogOut size={16} /> Log Out
        </motion.button>
      </main>
      <BottomNav />
    </div>
  );
}
