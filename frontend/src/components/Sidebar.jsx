import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Auto-close on navigation (mobile)
  useEffect(() => { onClose?.(); }, [location.pathname]);

  const navItems = [
    { to: '/',          label: 'Dashboard',    icon: '📊', roles: ['supervisor','manager'] },
    { to: '/pos',       label: 'Point of Sale', icon: '🖥️', roles: ['cashier','manager','supervisor'] },
    { to: '/inventory', label: 'Inventory',     icon: '📦', roles: ['cashier','manager','supervisor'] },
    { to: '/products',  label: 'Products',      icon: '🏷️', roles: ['manager','supervisor'] },
    { to: '/sales',     label: 'Sales',         icon: '📋', roles: ['manager','supervisor'] },
    { to: '/transfers', label: 'Transfers',     icon: '🔄', roles: ['manager','supervisor'] },
    { to: '/users',     label: 'Users',         icon: '👥', roles: ['manager','supervisor'] },
    { to: '/stores',    label: 'Stores',        icon: '🏪', roles: ['supervisor'] },
  ].filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Dark overlay when sidebar open on mobile */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />

      <div className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--pos-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🛒</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>ZENDA</div>
              <div style={{ fontSize: '11px', color: 'var(--pos-muted)' }}>{user?.store_name || 'All Stores'}</div>
            </div>
          </div>
          {/* Close button visible on mobile */}
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pos-muted)', fontSize: '20px', padding: '4px', lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--pos-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,.03)' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--pos-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <span className={`badge badge-${user?.role}`} style={{ fontSize: '10px', padding: '1px 6px', marginTop: '2px', display: 'inline-flex' }}>{user?.role}</span>
            </div>
            <button onClick={logout} title="Logout"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pos-muted)', fontSize: '18px', padding: '4px', flexShrink: 0 }}>
              ⏏
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
