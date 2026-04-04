import { useEffect, useState } from 'react';
import { Wallet, ArrowDownCircle, Loader2, Banknote, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { coreApi } from '../lib/api';
import { useAuthStore } from '../store/useAuth';
import { useAppStore } from '../store/useApp';
import BottomNav from '../components/BottomNav';

const WITHDRAW_REASONS = ['PANDEMIC_LOCKDOWN', 'EPIDEMIC_QUARANTINE', 'SUDDEN_CURFEW', 'SUDDEN_PROTEST'];
const PRESETS = [50, 100, 200];

export default function WalletPage() {
  const { user } = useAuthStore();
  const { walletBalance, setWalletBalance } = useAppStore();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState(WITHDRAW_REASONS[0]);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!user) return;
    coreApi.get(`/wallets/${user.id}`)
      .then(r => { setWallet(r.data); setWalletBalance(r.data.balance); })
      .catch(() => setWallet(null))
      .finally(() => setLoading(false));
  }, [user]);

  const handleWithdraw = async () => {
    if (!user) return;
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > walletBalance) return toast.error(`Insufficient balance. You have ₹${walletBalance.toFixed(2)}`);

    setWithdrawing(true);
    try {
      const { data } = await coreApi.post(`/wallets/${user.id}/withdraw`, { user_id: user.id, amount: amt, reason: withdrawReason });
      setWalletBalance(data.remaining_balance);
      setWallet((w: any) => w ? { ...w, balance: data.remaining_balance } : w);
      setWithdrawAmount('');
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Withdrawal failed');
    } finally { setWithdrawing(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-primary-400" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <header className="pt-12 pb-4 px-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-info-soft">
            <Wallet className="text-info" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">Disruption Shield</h1>
            <p className="text-xs text-text-secondary">Your personal safety net savings</p>
          </div>
        </div>
      </header>

      <main className="px-5 flex-1 flex flex-col gap-4 pb-24">
        {/* Balance Hero */}
        <div className="gradient-card p-6 text-center text-white relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Available Balance</p>
          <motion.h2
            key={walletBalance}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold font-mono mt-2"
          >
            ₹{walletBalance.toFixed(2)}
          </motion.h2>
        </div>

        {/* Stats Row */}
        {wallet && (
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-pill">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-success" />
                <span className="stat-pill-label">Deposited</span>
              </div>
              <span className="stat-pill-value text-success">₹{wallet.total_deposited?.toFixed(0)}</span>
            </div>
            <div className="stat-pill">
              <div className="flex items-center gap-1.5">
                <TrendingDown size={12} className="text-accent-400" />
                <span className="stat-pill-label">Withdrawn</span>
              </div>
              <span className="stat-pill-value text-accent-400">₹{wallet.total_withdrawn?.toFixed(0)}</span>
            </div>
          </div>
        )}

        {!wallet ? (
          <div className="glass-card p-5 text-center">
            <Banknote size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary text-sm">No wallet yet. Your shield wallet is created when you purchase your first policy.</p>
          </div>
        ) : (
          <>
            {/* Emergency Withdrawal */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <ArrowDownCircle size={18} className="text-accent-400" />
                <h3 className="font-bold text-sm text-text-primary">Emergency Withdrawal</h3>
              </div>
              <p className="text-xs text-text-hint mb-4 leading-relaxed">
                Withdraw during excluded events only. This is your own savings (3% of premiums), not insurance payouts.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="label">Amount (₹)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    min={1}
                    className="input-field font-mono"
                    placeholder="Enter amount"
                  />
                  <div className="flex gap-2 mt-2">
                    {PRESETS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setWithdrawAmount(String(p))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          withdrawAmount === String(p)
                            ? 'bg-primary-600/20 border-primary-500/40 text-primary-300'
                            : 'bg-surface-base border-border-default text-text-hint hover:text-text-secondary'
                        }`}
                      >
                        ₹{p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Reason (Excluded Event)</label>
                  <select value={withdrawReason} onChange={e => setWithdrawReason(e.target.value)} className="input-field">
                    {WITHDRAW_REASONS.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <button onClick={handleWithdraw} disabled={withdrawing} className="btn-outline flex items-center justify-center gap-2">
                  {withdrawing ? <Loader2 size={16} className="animate-spin" /> : 'Withdraw'}
                </button>
              </div>
            </div>

            {/* How it Works */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info size={16} className="text-text-hint" />
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">How it works</p>
              </div>
              <div className="space-y-3">
                {[
                  { num: '1', text: '3% of your weekly premium is auto-deposited here' },
                  { num: '2', text: 'Withdraw anytime during excluded events (pandemics, curfews)' },
                  { num: '3', text: 'This is YOUR money — zero risk for the platform' },
                  { num: '4', text: 'Think of it as a forced-savings emergency fund' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary-400">{step.num}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
