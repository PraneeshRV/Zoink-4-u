import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function MockPaymentModal({ amount, onClose, onSuccess }: any) {
  const [status, setStatus] = useState('init');

  useEffect(() => {
    if (status === 'processing') {
      setTimeout(() => setStatus('success'), 1500);
    } else if (status === 'success') {
      setTimeout(onSuccess, 1000);
    }
  }, [status, onSuccess]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#1E293B', padding: 24, borderRadius: 16, width: '90%', maxWidth: 360, textAlign: 'center', border: '1px solid #334155', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <h3 style={{ marginBottom: 16, fontSize: '1.2rem', color: '#f1f5f9' }}>Mock Payment Gateway</h3>
        <p style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 24, color: '#10b981' }}>₹{amount}</p>
        
        {status === 'init' && (
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => setStatus('processing')}>Pay Now</button>
        )}
        {status === 'processing' && (
          <div className="spinner" style={{ margin: '20px auto', width: 32, height: 32, borderWidth: 4 }} />
        )}
        {status === 'success' && (
          <div style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: 'bold', margin: '20px 0' }}>✅ Payment Successful!</div>
        )}
        
        {status === 'init' && (
          <button className="btn-ghost" style={{ width: '100%' }} onClick={onClose}>Cancel</button>
        )}
      </motion.div>
    </div>
  );
}
