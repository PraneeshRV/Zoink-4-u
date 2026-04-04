import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from './store/useAuth';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import RiderDashboard from './pages/RiderDashboard';
import PolicyPage from './pages/PolicyPage';
import ClaimsPage from './pages/ClaimsPage';
import ProfilePage from './pages/ProfilePage';
import SimPage from './pages/SimPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRiders from './pages/admin/AdminRiders';
import AdminClaims from './pages/admin/AdminClaims';
import AdminDisruptions from './pages/admin/AdminDisruptions';
import AdminSimulate from './pages/admin/AdminSimulate';
import BottomNav from './components/BottomNav';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated && !localStorage.getItem('jwt_token')) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
  >
    {children}
  </motion.div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#26292d',
            color: '#f1f3f5',
            border: '1px solid rgba(255,255,255,0.10)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          },
          success: { iconTheme: { primary: '#51cf66', secondary: '#26292d' } },
          error: { iconTheme: { primary: '#ff6b6b', secondary: '#26292d' } },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes>
          {/* Onboarding - no bottom nav */}
          <Route path="/onboarding" element={
            <div className="app-container">
              <PageTransition><OnboardingPage /></PageTransition>
            </div>
          } />
          
          <Route path="/login" element={
            <div className="app-container">
              <PageTransition><LoginPage /></PageTransition>
            </div>
          } />

          {/* Rider pages with bottom nav */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="app-container">
                <main className="app-main">
                  <PageTransition><RiderDashboard /></PageTransition>
                </main>
                <BottomNav />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/policy" element={
            <ProtectedRoute>
              <div className="app-container">
                <main className="app-main">
                  <PageTransition><PolicyPage /></PageTransition>
                </main>
                <BottomNav />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/claims" element={
            <ProtectedRoute>
              <div className="app-container">
                <main className="app-main">
                  <PageTransition><ClaimsPage /></PageTransition>
                </main>
                <BottomNav />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/sim" element={
            <ProtectedRoute>
              <div className="app-container">
                <main className="app-main">
                  <PageTransition><SimPage /></PageTransition>
                </main>
                <BottomNav />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <div className="app-container">
                <main className="app-main">
                  <PageTransition><ProfilePage /></PageTransition>
                </main>
                <BottomNav />
              </div>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="riders" element={<AdminRiders />} />
            <Route path="claims" element={<AdminClaims />} />
            <Route path="disruptions" element={<AdminDisruptions />} />
            <Route path="simulate" element={<AdminSimulate />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}
