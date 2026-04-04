import { useEffect, useState } from 'react';
import { Users, Loader2, TrendingUp, TrendingDown, Heart, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { coreApi } from '../lib/api';
import { useAuthStore } from '../store/useAuth';
import BottomNav from '../components/BottomNav';

export default function CommunityFund() {
  const { user } = useAuthStore();
  const [fund, setFund] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    coreApi.get(`/community-fund/${user.zone_id}`)
      .then(r => setFund(r.data))
      .catch(() => setFund(null))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-primary-400" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <header className="pt-12 pb-4 px-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-success-soft">
            <Users className="text-success" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">Community Fund</h1>
            <p className="text-xs text-text-secondary">Zone: {user?.zone_id}</p>
          </div>
        </div>
      </header>

      <main className="px-5 flex-1 flex flex-col gap-4 pb-24">
        {/* Fund Balance Hero */}
        <div className="gradient-card p-6 text-center text-white relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart size={16} className="text-white/60" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Community Pool</p>
          </div>
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-extrabold font-mono"
          >
            ₹{fund?.balance?.toFixed(2) || '0.00'}
          </motion.h2>
          <p className="text-[11px] text-white/50 mt-2">{user?.zone_id} Resilience Fund</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="stat-pill">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} className="text-success" />
              <span className="stat-pill-label">Total Contributed</span>
            </div>
            <span className="stat-pill-value text-success">₹{fund?.total_contributed?.toFixed(0) || '0'}</span>
          </div>
          <div className="stat-pill">
            <div className="flex items-center gap-1.5">
              <TrendingDown size={12} className="text-accent-400" />
              <span className="stat-pill-label">Grants Released</span>
            </div>
            <span className="stat-pill-value text-accent-400">₹{fund?.total_granted?.toFixed(0) || '0'}</span>
          </div>
        </div>

        {/* How the Fund Works */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-text-hint" />
            <h3 className="text-sm font-bold text-text-primary">How It Works</h3>
          </div>
          <div className="space-y-3">
            {[
              { num: '1', title: 'Auto-Contribution', desc: '1% of every premium paid in your zone is pooled here.' },
              { num: '2', title: 'Emergency Grants', desc: 'During excluded events (pandemics, major floods), grants are released to affected workers.' },
              { num: '3', title: 'Community-Owned', desc: 'This is not insurance. It is a community solidarity fund, CSR tax-deductible.' },
              { num: '4', title: 'Zone-Specific', desc: 'Each zone maintains its own fund. Your contributions help your neighborhood.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-success-soft flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-success">{step.num}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">{step.title}</p>
                  <p className="text-[11px] text-text-hint leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Community Impact */}
        <div className="glass-card p-5">
          <h3 className="font-bold text-sm text-text-primary mb-3">Community Solidarity</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            When disasters strike beyond parametric coverage scope — like pandemics or multi-week floods — this fund provides emergency grants to workers in your zone. Every week you pay premium, 1% strengthens your community's resilience.
          </p>
          <div className="mt-3 p-3 rounded-xl bg-success-soft border border-success/15">
            <p className="text-xs text-success font-bold">
              "47 riders near you received ₹16,200 in emergency grants last quarter."
            </p>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
