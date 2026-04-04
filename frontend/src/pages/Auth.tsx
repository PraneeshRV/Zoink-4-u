import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, MapPin, Phone, Key, UserCircle, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { coreApi } from '../lib/api';
import { useAuthStore } from '../store/useAuth';

const ZONES = ['Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar', 'HSR Layout'];

const FEATURES = [
  { icon: '⚡', title: 'Instant Payouts', desc: 'Auto-credited when disruptions hit' },
  { icon: '🛡️', title: 'Zero Paperwork', desc: 'No claims to file, ever' },
  { icon: '💰', title: 'From ₹29/week', desc: 'Less than one chai per day' },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('123456');
  const [name, setName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [zone, setZone] = useState(ZONES[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return toast.error('Please enter a valid 10-digit phone number');
    if (otp.length !== 6) return toast.error('OTP must be 6 digits');
    if (!isLogin && aadhaar.length !== 12) return toast.error('Aadhaar must be 12 digits');
    if (!isLogin && name.trim().length < 2) return toast.error('Please enter your full name');

    setLoading(true);
    try {
      if (isLogin) {
        const { data } = await coreApi.post('/users/login', { phone, aadhaar_otp: otp });
        login(data);
        toast.success(`Welcome back, ${data.name}!`);
        navigate('/dashboard', { replace: true });
      } else {
        const { data } = await coreApi.post('/users/register', {
          name: name.trim(), phone, zone_id: zone, aadhaar_number: aadhaar, aadhaar_otp: otp
        });
        login(data);
        toast.success('Your shield is ready! Welcome aboard.');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 400 && detail === 'User already registered') {
        toast('You already have an account! Switching to login.', { icon: '👋' });
        setIsLogin(true);
      } else if (err.response?.status === 404) {
        toast("We don't have your number yet. Let's get you registered!", { icon: '✨' });
        setIsLogin(false);
      } else if (err.response?.status === 400 && detail === 'Invalid OTP') {
        toast.error('Invalid OTP. Hint: use 123456 for sandbox.');
      } else {
        toast.error(detail || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden animated-gradient-bg">
      {/* Floating orbs */}
      <div className="floating-orb floating-orb-1" />
      <div className="floating-orb floating-orb-2" />
      <div className="floating-orb floating-orb-3" />

      {/* Logo & Branding */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center mb-8 relative z-10"
      >
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-4 relative"
          style={{
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
            boxShadow: '0 8px 32px rgba(13, 148, 136, 0.4)',
          }}
        >
          <ShieldCheck size={38} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Zoink-4-u</h1>
        <p className="text-text-secondary mt-1 text-sm font-medium text-center max-w-[250px]">
          Your earnings, always protected
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="glass-card w-full p-6 relative z-10"
      >
        {/* Tab Switcher */}
        <div className="flex bg-surface-base rounded-xl p-1 mb-6 relative">
          <motion.div
            className="absolute top-1 bottom-1 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)', width: 'calc(50% - 4px)' }}
            animate={{ x: isLogin ? 0 : 'calc(100% + 4px)' }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors relative z-10 ${isLogin ? 'text-white' : 'text-text-hint hover:text-text-secondary'}`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors relative z-10 ${!isLogin ? 'text-white' : 'text-text-hint hover:text-text-secondary'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                key="reg-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <UserCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-hint" />
                    <input required value={name} onChange={e => setName(e.target.value)} className="input-field pl-10" placeholder="Deepak Kumar" />
                  </div>
                </div>
                <div>
                  <label className="label">Aadhaar Number</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-hint" />
                    <input required value={aadhaar} onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))} maxLength={12} className="input-field pl-10 tracking-widest font-mono" placeholder="1234 5678 9012" />
                  </div>
                </div>
                <div>
                  <label className="label">Work Zone</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ZONES.map(z => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZone(z)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition-all border ${
                          zone === z
                            ? 'bg-primary-600/20 border-primary-500/50 text-primary-300 shadow-sm'
                            : 'bg-surface-base border-border-default text-text-hint hover:text-text-secondary hover:border-border-default'
                        }`}
                      >
                        <MapPin size={12} className="inline mr-0.5 -mt-0.5" />
                        {z}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="label">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-border-default bg-surface-base text-text-hint text-sm font-bold">
                <Phone size={14} className="mr-1.5" /> +91
              </span>
              <input required value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} maxLength={10} type="tel" className="input-field rounded-l-none" placeholder="98765 43210" />
            </div>
          </div>

          <div>
            <label className="label">Aadhaar OTP</label>
            <div className="relative">
              <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-hint" />
              <input required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} maxLength={6} className="input-field pl-10 tracking-[0.3em] text-center font-mono text-lg" placeholder="• • • • • •" />
            </div>
            <p className="text-[10px] text-text-hint mt-1 text-center">Sandbox OTP: 123456</p>
          </div>

          <button disabled={loading} type="submit" className="btn-primary mt-2 flex justify-center items-center gap-2">
            {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>
      </motion.div>

      {/* Feature highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex gap-3 mt-6 w-full relative z-10"
      >
        {FEATURES.map((f, i) => (
          <div key={i} className="flex-1 text-center p-3 rounded-xl bg-surface-card/40 backdrop-blur-sm border border-border-default/30">
            <span className="text-xl">{f.icon}</span>
            <p className="text-[10px] font-bold text-text-primary mt-1">{f.title}</p>
            <p className="text-[9px] text-text-hint mt-0.5">{f.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
