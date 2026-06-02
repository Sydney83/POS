import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Users from './pages/Users';
import Stores from './pages/Stores';
import Transfers from './pages/Transfers';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--pos-muted)', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '2rem' }}>🛒</div>
        <span>Loading…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate default page for their role
    return <Navigate to="/pos" replace />;
  }
  return children;
}

function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--pos-muted)' }}>
        Loading…
      </div>
    );
  }

  // If already logged in, redirect away from login page
  if (user) {
    return <Navigate to={user.role === 'cashier' ? '/pos' : '/'} replace />;
  }

  return <Login />;
}

function Layout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          <Route path="/" element={
            <ProtectedRoute roles={['supervisor', 'manager']}>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/pos" element={
            <ProtectedRoute>
              <Layout><POS /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute>
              <Layout><Inventory /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute roles={['manager', 'supervisor']}>
              <Layout><Products /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/sales" element={
            <ProtectedRoute roles={['manager', 'supervisor']}>
              <Layout><Sales /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/transfers" element={
            <ProtectedRoute roles={['manager', 'supervisor']}>
              <Layout><Transfers /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute roles={['manager', 'supervisor']}>
              <Layout><Users /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/stores" element={
            <ProtectedRoute roles={['supervisor']}>
              <Layout><Stores /></Layout>
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
