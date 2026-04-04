import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ridersAPI } from '../lib/api';
import { useAuthStore } from '../store/useAuth';
import ZoinkScoreRing from '../components/ZoinkScoreRing';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);

  useEffect(() => {
    ridersAPI.getProfile()
      .then(res => setProfile(res.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/onboarding');
    toast.success('Logged out');
  };

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /></div>;
  if (!profile) return <div className="empty-state"><div className="empty-text">Profile not found</div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👤 Profile</h1>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Profile Card */}
        <div className="card-glass" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>
            {profile.platform === 'swiggy' ? '🧡' : profile.platform === 'zomato' ? '❤️' :
             profile.platform === 'zepto' ? '💜' : profile.platform === 'amazon' ? '📦' : '🛒'}
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{profile.name}</h2>
          <p className="text-secondary text-sm">{profile.platform?.toUpperCase()} Delivery Partner</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <ZoinkScoreRing score={profile.zoink_score} size={110} />
          </div>
        </div>

        {/* Details */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Account Details</h3>
          {[
            { label: 'Phone', value: profile.phone },
            { label: 'City', value: profile.city },
            { label: 'Delivery Zone', value: profile.zone_h3 },
            { label: 'Shift', value: `${profile.shift_start} — ${profile.shift_end}` },
            { label: 'Verification', value: profile.is_verified ? '✅ Verified' : '❌ Unverified' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
            }}>
              <span className="text-sm text-secondary">{item.label}</span>
              <span className="text-sm font-bold">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Active Policy Summary */}
        {profile.active_policy && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.95rem' }}>Active Policy</h3>
            <div className="grid-2">
              <div>
                <div className="text-xs text-hint">Tier</div>
                <div className="font-bold" style={{ textTransform: 'uppercase' }}>{profile.active_policy.tier}</div>
              </div>
              <div>
                <div className="text-xs text-hint">Premium</div>
                <div className="font-mono font-bold">₹{profile.active_policy.weekly_premium_rs?.toFixed(2)}/wk</div>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
          onClick={handleLogout}>
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}
