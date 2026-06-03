import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'12px', color:'var(--pos-muted)' }}>
      <div style={{ fontSize:'2rem' }}>🛒</div><span>Loading…</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/pos" replace />;
  return children;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--pos-muted)' }}>Loading…</div>;
  if (user) return <Navigate to={user.role === 'cashier' ? '/pos' : '/'} replace />;
  return <Login />;
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex' }}>
      {/* Mobile top bar */}
      <div className="topbar">
        <button onClick={() => setSidebarOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pos-text)', fontSize: '22px', padding: '6px', lineHeight: 1 }}>
          ☰
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>🛒</span>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>Zenda POS</span>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--pos-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
          <Route path="/" element={<ProtectedRoute roles={['supervisor','manager']}><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute><Layout><POS /></Layout></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute roles={['manager','supervisor']}><Layout><Products /></Layout></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute roles={['manager','supervisor']}><Layout><Sales /></Layout></ProtectedRoute>} />
          <Route path="/transfers" element={<ProtectedRoute roles={['manager','supervisor']}><Layout><Transfers /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['manager','supervisor']}><Layout><Users /></Layout></ProtectedRoute>} />
          <Route path="/stores" element={<ProtectedRoute roles={['supervisor']}><Layout><Stores /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
