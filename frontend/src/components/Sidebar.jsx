import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: '📊', pos: '🖥️', inventory: '📦', products: '🏷️',
  sales: '📋', users: '👥', stores: '🏪', transfers: '🔄', reports: '📈',
};

export default function Sidebar() {
  const { user, logout, can } = useAuth();

  const navItems = [
    { to: '/',          label: 'Dashboard',  icon: icons.dashboard,  roles: ['supervisor','manager'] },
    { to: '/pos',       label: 'Point of Sale', icon: icons.pos,     roles: ['cashier','manager','supervisor'] },
    { to: '/inventory', label: 'Inventory',  icon: icons.inventory,  roles: ['cashier','manager','supervisor'] },
    { to: '/products',  label: 'Products',   icon: icons.products,   roles: ['manager','supervisor'] },
    { to: '/sales',     label: 'Sales',      icon: icons.sales,      roles: ['manager','supervisor'] },
    { to: '/transfers', label: 'Transfers',  icon: icons.transfers,  roles: ['manager','supervisor'] },
    { to: '/users',     label: 'Users',      icon: icons.users,      roles: ['manager','supervisor'] },
    { to: '/stores',    label: 'Stores',     icon: icons.stores,     roles: ['supervisor'] },
  ];

  const visible = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--pos-border)' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <img src="/logo.png" alt="Belea" style={{ height: '48px', width: 'auto' }} />   {/* replaces the span */}
    <div>
      <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em' }}>Zenda POS</div>
      <div style={{ fontSize: '11px', color: 'var(--pos-muted)' }}>{user?.store_name || 'All Stores'}</div>
    </div>
  </div>
</div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {visible.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--pos-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,.03)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--pos-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <span className={`badge badge-${user?.role}`} style={{ fontSize: '10px', padding: '1px 6px' }}>{user?.role}</span>
          </div>
          <button onClick={logout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pos-muted)', fontSize: '16px', padding: '4px' }}>⏏</button>
        </div>
      </div>
    </div>
  );
}
