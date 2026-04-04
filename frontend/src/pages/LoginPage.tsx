import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../lib/api';
import { useAuthStore } from '../store/useAuth';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  const handleSendOTP = () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setOtpSent(true);
    toast.success('OTP sent! Use 123456 for demo');
  };

  const handleLogin = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login({ phone, mock_otp: otp });
      login(res.data.access_token, res.data.rider_id, res.data.name);
      toast.success(`Welcome back, ${res.data.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Login failed';
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>
          <span className="gradient-text">Zoink-4-u</span>
        </h1>
        <p className="text-secondary text-sm">Income Protection for Gig Workers</p>
      </div>

      {/* Welcome back illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          textAlign: 'center',
          padding: '28px 0 12px',
        }}
      >
        <div style={{
          width: 88,
          height: 88,
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.2), rgba(20, 184, 166, 0.1))',
          border: '2px solid rgba(45, 212, 191, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.2rem',
          boxShadow: '0 0 30px rgba(13, 148, 136, 0.15)',
        }}>
          👋
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>Welcome Back</h2>
        <p className="text-secondary text-sm">Log in with your registered phone number</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{ flex: 1 }}
      >
        {/* Phone input */}
        <div className="input-group">
          <label className="input-label">Phone Number</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-hint)',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}>+91</span>
            <input
              className="input-field"
              style={{ paddingLeft: 52 }}
              placeholder="9876543210"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              type="tel"
              inputMode="numeric"
              autoFocus
            />
          </div>
        </div>

        {!otpSent ? (
          <motion.button
            className="btn btn-primary"
            onClick={handleSendOTP}
            whileTap={{ scale: 0.97 }}
          >
            📱 Send OTP
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <div className="input-group">
              <label className="input-label">Enter OTP</label>
              <input
                className="input-field"
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                type="tel"
                inputMode="numeric"
                autoFocus
                style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-hint)', marginTop: 6, textAlign: 'center' }}>
                💡 Use <strong style={{ color: 'var(--primary-400)' }}>123456</strong> for demo
              </p>
            </div>
            <motion.button
              className="btn btn-primary"
              onClick={handleLogin}
              disabled={loading}
              whileTap={{ scale: 0.97 }}
            >
              {loading ? <span className="spinner" /> : '🔓 Log In'}
            </motion.button>
          </motion.div>
        )}

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '28px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
          <span className="text-xs" style={{ color: 'var(--text-hint)', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
        </div>

        {/* Register link */}
        <button
          className="btn btn-outline"
          onClick={() => navigate('/onboarding')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          🆕 Create New Account
        </button>

        {/* Admin link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            className="btn-ghost text-xs"
            style={{ color: 'var(--text-hint)' }}
            onClick={() => navigate('/admin')}
          >
            🔧 Admin Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
