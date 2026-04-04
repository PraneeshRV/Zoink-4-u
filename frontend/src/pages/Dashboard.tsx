import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Wallet, Loader2, CloudRain, Sun, Users, ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { coreApi, mlApi } from '../lib/api';
import { useAuthStore } from '../store/useAuth';
import { useAppStore } from '../store/useApp';
import BottomNav from '../components/BottomNav';
import ZoinkScoreRing from '../components/ZoinkScoreRing';
import ImpactWidget from '../components/ImpactWidget';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { activePolicy, walletBalance, setWalletBalance, setActivePolicy, zoinkScore, setCommunityFund, communityFund, weather, setWeather } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        // Fetch wallet balance
        const walletRes = await coreApi.get(`/wallets/${user.id}`).catch(() => null);
        if (walletRes?.data) setWalletBalance(walletRes.data.balance);

        // Fetch active policy
        const policyRes = await coreApi.get(`/policies/?user_id=${user.id}`).catch(() => null);
        if (policyRes?.data) setActivePolicy(policyRes.data);

        // Fetch community fund for zone
        const fundRes = await coreApi.get(`/community-fund/${user.zone_id}`).catch(() => null);
        if (fundRes?.data) setCommunityFund(fundRes.data);

        // Fetch weather oracle
        const weatherRes = await mlApi.get(`/mock_api/weather/${user.zone_id}`).catch(() => null);
        if (weatherRes?.data) setWeather(weatherRes.data);
      } catch { /* silently handle */ }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-primary-400" size={32} />
        <p className="text-sm text-text-hint">Loading your dashboard...</p>
      </div>
    </div>
  );

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ZK';
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="pt-12 pb-4 px-5 flex justify-between items-start">
        <div>
          <p className="text-xs text-text-hint font-semibold uppercase tracking-widest">{greeting}</p>
          <h1 className="text-2xl font-extrabold text-text-primary mt-0.5">{user?.name || 'Worker'}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="badge-info text-[10px]">📍 {user?.zone_id}</span>
          </div>
        </div>
        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/profile')}
          className="w-11 h-11 rounded-xl flex items-center justify-center cursor-pointer font-bold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
          }}
        >
          {initials}
        </motion.div>
      </header>

      <main className="px-5 flex-1 flex flex-col gap-4 pb-4">
        {/* Weather Alert Banner */}
        {weather && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-3.5 flex items-center gap-3 ${
              weather.is_disrupted
                ? 'bg-danger-soft border border-danger/25'
                : 'bg-success-soft border border-success/25'
            }`}
          >
            {weather.is_disrupted ? (
              <CloudRain size={22} className="text-danger shrink-0" />
            ) : (
              <Sun size={22} className="text-success shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-bold ${weather.is_disrupted ? 'text-danger' : 'text-success'}`}>
                {weather.is_disrupted ? 'Disruption Detected' : 'Clear Conditions'}
              </p>
              <p className="text-xs text-text-secondary">
                {weather.is_disrupted
                  ? `${weather.trigger_type?.replace('_', ' ')} — Severity ${weather.severity}/10`
                  : 'No disruptions in your zone right now.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Coverage Status Hero Card */}
        {activePolicy ? (
          <div className="gradient-card p-5 text-white relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">PLAN STATUS</p>
                <h2 className="text-xl font-extrabold mt-1">Coverage Active</h2>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <div className="w-2 h-2 rounded-full bg-success" style={{ boxShadow: '0 0 8px #22c55e80' }} />
                <span className="text-[10px] font-extrabold tracking-wide">SECURE</span>
              </div>
            </div>
            <div className="mt-4 flex gap-6">
              <div>
                <p className="text-[10px] text-white/50 font-bold uppercase">Tier</p>
                <p className="font-bold text-lg">{activePolicy.tier}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-bold uppercase">Weekly</p>
                <p className="font-bold text-lg font-mono">₹{activePolicy.weekly_premium}</p>
              </div>
              {activePolicy.has_buyback && (
                <div>
                  <p className="text-[10px] text-white/50 font-bold uppercase">Buyback</p>
                  <p className="font-bold text-lg text-accent-300">Active</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card p-5 border-warning/20">
            <div className="flex items-center gap-2.5 mb-3">
              <ShieldAlert size={22} className="text-accent-400" />
              <h3 className="font-bold text-text-primary">No Active Coverage</h3>
            </div>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              You're unprotected. One bad rainy day could cost you a full day's earnings.
            </p>
            <button onClick={() => navigate('/purchase')} className="btn-accent flex items-center justify-center gap-2">
              Get Protected <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/wallet')}
            className="stat-pill cursor-pointer"
          >
            <span className="stat-pill-label">Balance</span>
            <span className="stat-pill-value text-accent-400">₹{walletBalance.toFixed(0)}</span>
          </motion.div>
          <div className="stat-pill">
            <span className="stat-pill-label">Score</span>
            <span className="stat-pill-value text-primary-400">{zoinkScore}</span>
          </div>
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/community')}
            className="stat-pill cursor-pointer"
          >
            <span className="stat-pill-label">Zone Fund</span>
            <span className="stat-pill-value text-info">₹{communityFund?.balance?.toFixed(0) || '0'}</span>
          </motion.div>
        </div>

        {/* Zoink Score Section */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-text-primary mb-1">Zoink Score</h3>
              <p className="text-xs text-text-secondary max-w-[180px] leading-relaxed">
                Your trust score affects premium pricing and claim processing speed.
              </p>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="text-text-hint">70+ = 15% discount</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                  <span className="text-text-hint">40-69 = Standard rate</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                  <span className="text-text-hint">&lt;40 = Manual review</span>
                </div>
              </div>
            </div>
            <ZoinkScoreRing score={zoinkScore} size={110} />
          </div>
        </div>

        {/* Impact Widget */}
        <ImpactWidget totalPaid={activePolicy ? activePolicy.weekly_premium * 4 : 0} totalReceived={walletBalance * 3} />

        {/* Quick Actions */}
        <div>
          <h3 className="font-bold text-text-primary mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Shield, label: 'Get Coverage', path: '/purchase', color: 'text-primary-400', bg: 'bg-primary-600/10' },
              { icon: Zap, label: 'Simulate Claim', path: '/claims', color: 'text-accent-400', bg: 'bg-accent-500/10' },
              { icon: Wallet, label: 'Wallet', path: '/wallet', color: 'text-info', bg: 'bg-info/10' },
              { icon: Users, label: 'Community Fund', path: '/community', color: 'text-success', bg: 'bg-success/10' },
            ].map((action, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.path)}
                className="glass-card-hover p-4 flex items-center gap-3 text-left"
              >
                <div className={`${action.bg} p-2.5 rounded-xl`}>
                  <action.icon size={18} className={action.color} />
                </div>
                <span className="text-sm font-bold text-text-primary">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Community Fund */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <Users size={18} className="text-info" />
            <h3 className="font-bold text-text-primary text-sm">Community Resilience Fund</h3>
            <span className="text-[9px] text-text-hint font-bold ml-auto uppercase tracking-wider">{user?.zone_id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Pool Balance</span>
            <span className="font-bold font-mono text-info">₹{communityFund?.balance?.toFixed(2) || '0.00'}</span>
          </div>
          <p className="text-[11px] text-text-hint mt-2.5 leading-relaxed">
            1% of every premium in {user?.zone_id} is pooled here for emergency grants during excluded events.
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
