import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ProductManagerDashboard from './pages/ProductManagerDashboard';
import StakeholderDashboard from './pages/StakeholderDashboard';
import DevTeamDashboard from './pages/DevTeamDashboard';

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #e8eaf0',
            borderTop: '3px solid #6366f1', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
          }} />
          <div style={{ color: '#64748b', fontSize: 14 }}>Loading...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  switch (user.role) {
    case 'product_manager': return <ProductManagerDashboard />;
    case 'dev_team': return <DevTeamDashboard />;
    case 'stakeholder': return <StakeholderDashboard />;
    default: return <LoginPage />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
