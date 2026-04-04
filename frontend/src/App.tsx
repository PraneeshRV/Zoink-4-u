import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from './store/useAuth';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Purchase from './pages/Purchase';
import Claims from './pages/Claims';
import WalletPage from './pages/Wallet';
import Profile from './pages/Profile';
import CommunityFund from './pages/CommunityFund';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated && !localStorage.getItem('user_id')) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="flex-1 flex flex-col min-h-0"
  >
    {children}
  </motion.div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-surface-base sm:border-x sm:border-border-default">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#f1f5f9',
              border: '1px solid #334155',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#14b8a6', secondary: '#0F172A' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0F172A' } },
          }}
        />
        <main className="flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
              <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
              <Route path="/purchase" element={<ProtectedRoute><PageWrapper><Purchase /></PageWrapper></ProtectedRoute>} />
              <Route path="/claims" element={<ProtectedRoute><PageWrapper><Claims /></PageWrapper></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><PageWrapper><WalletPage /></PageWrapper></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
              <Route path="/community" element={<ProtectedRoute><PageWrapper><CommunityFund /></PageWrapper></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </BrowserRouter>
  );
}
