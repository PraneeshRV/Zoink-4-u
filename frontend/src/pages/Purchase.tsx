import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, ChevronRight, Info, ShieldCheck, Check, X, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { coreApi, mlApi } from '../lib/api';
import { useAuthStore } from '../store/useAuth';
import { useAppStore } from '../store/useApp';
import BottomNav from '../components/BottomNav';

const TIERS = [
  {
    name: 'Bronze', desc: 'Basic weather cover', base: 29, maxPayout: '₹800',
    color: '#cd7f32', triggers: '11 triggers', popular: false,
    perks: ['Environmental triggers', 'Core weather protection', 'Weekly payouts'],
    noperks: ['Social/civil triggers', 'Platform crash cover', 'No-claim rewards'],
  },
  {
    name: 'Gold', desc: 'Weather + civil unrest', base: 69, maxPayout: '₹2,800',
    color: '#fbbf24', triggers: '25+ triggers', popular: true,
    perks: ['All trigger categories', 'No-Claim Rewards', 'Platform crash cover', 'Community Fund access'],
    noperks: ['AI auto-approve', 'Emergency Micro-Advance'],
  },
  {
    name: 'Platinum', desc: 'Full parametric cover', base: 99, maxPayout: '₹4,000',
    color: '#94a3b8', triggers: '25+ triggers', popular: false,
    perks: ['All trigger categories', 'AI auto-approve (1hr)', '₹200 Emergency Advance', 'No-Claim Rewards', 'Priority support'],
    noperks: [],
  },
];

export default function Purchase() {
  const { user } = useAuthStore();
  const { setActivePolicy } = useAppStore();
  const navigate = useNavigate();

  const [selectedTier, setSelectedTier] = useState('Gold');
  const [enableBuyback, setEnableBuyback] = useState(false);
  const [pricing, setPricing] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [exclusions, setExclusions] = useState<any>(null);

  useEffect(() => {
    coreApi.get('/claims/exclusions').then(r => setExclusions(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoadingPrice(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await mlApi.post('/pricing/calculate', { zone_id: user.zone_id, tier: selectedTier, work_hours_estimated: 40 });
        if (alive) setPricing(data);
      } catch {
        if (alive) {
          const base = TIERS.find(t => t.name === selectedTier)?.base || 49;
          setPricing({ base_premium: base, dynamic_premium: base * 0.95, risk_score: 1.0, factors: { fallback: true } });
          toast('ML Engine offline. Using base rates.', { icon: 'ℹ️' });
        }
      } finally { if (alive) setLoadingPrice(false); }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [selectedTier, user]);

  const purchase = async () => {
    if (!user || purchasing) return;
    setPurchasing(true);
    try {
      const { data } = await coreApi.post('/policies/', { user_id: user.id, tier: selectedTier, zone_id: user.zone_id, enable_buyback: enableBuyback });
      setActivePolicy(data);
      toast.success(`${selectedTier} Shield activated! You're protected.`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('active policy')) {
        toast.error("You already have an active policy!");
        navigate('/dashboard', { replace: true });
      } else { toast.error(detail || 'Purchase failed. Try again.'); }
    } finally { setPurchasing(false); }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="pt-12 pb-4 px-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary-600/15">
            <Shield className="text-primary-400" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">Get Coverage</h1>
            <p className="text-xs text-text-secondary">AI-powered pricing for {user?.zone_id}</p>
          </div>
        </div>
      </header>

      <main className="px-5 flex-1 flex flex-col gap-4 pb-6">
        {/* Tier Cards */}
        <div className="flex flex-col gap-3">
          {TIERS.map((t, idx) => {
            const selected = selectedTier === t.name;
            return (
              <motion.button
                key={t.name}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTier(t.name)}
                className={`relative text-left p-4 rounded-2xl border transition-all ${
                  selected
                    ? 'glass-card border-primary-500/50 shadow-lg'
                    : 'bg-surface-card/40 border-border-default/30 opacity-70 hover:opacity-100'
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-2 right-4 bg-accent-500 text-surface-base text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Popular
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${t.color}20` }}>
                      <Crown size={18} style={{ color: t.color }} />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">{t.name}</p>
                      <p className="text-[11px] text-text-hint mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold font-mono" style={{ color: t.color }}>₹{t.base}</p>
                    <p className="text-[10px] text-text-hint">/week</p>
                  </div>
                </div>

                {selected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-3 border-t border-border-default/30"
                  >
                    <div className="flex gap-4 mb-3">
                      <div>
                        <p className="text-[9px] text-text-hint font-bold uppercase">Max Payout</p>
                        <p className="text-sm font-bold font-mono text-primary-400">{t.maxPayout}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-text-hint font-bold uppercase">Coverage</p>
                        <p className="text-sm font-bold text-primary-400">{t.triggers}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {t.perks.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Check size={12} className="text-success shrink-0" />
                          <span className="text-text-secondary">{p}</span>
                        </div>
                      ))}
                      {t.noperks.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <X size={12} className="text-text-muted shrink-0" />
                          <span className="text-text-muted">{p}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Dynamic Pricing Card */}
        <div className="glass-card p-5">
          <h2 className="font-bold text-sm text-text-primary">Your Price</h2>
          <div className="mt-3 min-h-[60px] flex items-end gap-2">
            {loadingPrice || !pricing ? (
              <div className="animate-pulse flex items-center gap-3">
                <div className="h-10 w-24 bg-surface-elevated rounded-lg" />
                <div className="h-4 w-16 bg-surface-elevated rounded" />
              </div>
            ) : (
              <>
                <motion.span
                  key={pricing.dynamic_premium}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold font-mono text-primary-400"
                >
                  ₹{pricing.dynamic_premium.toFixed(0)}
                </motion.span>
                {pricing.dynamic_premium !== pricing.base_premium && (
                  <span className="text-text-muted line-through text-sm mb-1">₹{pricing.base_premium}</span>
                )}
                <span className="text-text-hint text-sm mb-1">/week</span>
              </>
            )}
          </div>
          {!loadingPrice && pricing && (
            <p className="text-xs text-text-hint mt-2">
              Risk score: {pricing.risk_score} — Zone: {user?.zone_id}
            </p>
          )}
        </div>

        {/* Buyback Toggle */}
        <button type="button" onClick={() => setEnableBuyback(!enableBuyback)} className="glass-card p-4 flex justify-between items-center text-left">
          <div className="pr-4">
            <p className="font-bold text-sm text-text-primary flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-primary-400" /> Exclusion Buyback
            </p>
            <p className="text-xs text-text-hint mt-1 leading-relaxed">Get partial payouts even for normally excluded events.</p>
          </div>
          <div className={`w-11 h-6 flex items-center rounded-full transition-colors ${enableBuyback ? 'bg-primary-500' : 'bg-surface-overlay'} p-0.5`}>
            <motion.div
              animate={{ x: enableBuyback ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="bg-white w-5 h-5 rounded-full shadow"
            />
          </div>
        </button>

        {/* Exclusions Info */}
        {exclusions && (
          <details className="glass-card p-4 group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-bold text-text-primary list-none">
              <Info size={16} className="text-text-hint" /> What's not covered?
              <span className="ml-auto text-text-muted group-open:rotate-90 transition-transform">▶</span>
            </summary>
            <div className="mt-3 space-y-2">
              {exclusions.excluded_categories?.map((cat: any, i: number) => (
                <div key={i} className={`text-xs p-3 rounded-xl border ${
                  cat.tier === 'HARD'
                    ? 'bg-danger-soft border-danger/15 text-danger'
                    : 'bg-warning-soft border-warning/15 text-accent-400'
                }`}>
                  <span className="font-bold">{cat.category}</span>
                  {cat.buyback_available && (
                    <span className="ml-2 text-[10px] bg-primary-600/20 text-primary-400 px-1.5 py-0.5 rounded font-bold">BUYBACK OK</span>
                  )}
                  <p className="text-text-hint mt-0.5">{cat.reason}</p>
                </div>
              ))}
            </div>
          </details>
        )}

        <button onClick={purchase} disabled={purchasing || loadingPrice} className="btn-primary mt-auto mb-16 flex items-center justify-center gap-2 pulse-glow">
          {purchasing ? <><Loader2 size={18} className="animate-spin" /> Activating...</> : <>Activate Protection <ChevronRight size={16} /></>}
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
