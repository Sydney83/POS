import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', email: '', password: '', role: 'cashier', store_id: '', active: 1 };

export default function Users() {
  const { user, can } = useAuth();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/users').then(setUsers);
  useEffect(() => { load(); api.get('/stores').then(setStores); }, []);

  const open = (u = null) => {
    setForm(u ? { ...u, password: '' } : EMPTY);
    setModal(u ? 'edit' : 'new');
  };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'edit') await api.put(`/users/${form.id}`, form);
      else await api.post('/users', form);
      load(); setModal(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/users/${id}`); load();
  };

  const availableRoles = can('supervisor')
    ? ['cashier', 'manager', 'supervisor']
    : ['cashier'];

  return (
    <div style={{ padding: '24px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Users</h1>
          <p style={{ color: 'var(--pos-muted)', fontSize: '14px', marginTop: '4px' }}>Manage staff accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => open()}>+ Add User</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Store</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: 'var(--pos-muted)', fontSize: '13px' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td style={{ fontSize: '13px' }}>{u.store_name || <span style={{ color: 'var(--pos-muted)' }}>All Stores</span>}</td>
                  <td>{u.active ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}</td>
                  <td style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => open(u)}>Edit</button>
                    {can('supervisor') && u.id !== user.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => deactivate(u.id)}>Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>{modal === 'edit' ? 'Edit' : 'New'} User</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['name','Full Name','text'],['email','Email','email'],['password', modal === 'edit' ? 'New Password (leave blank to keep)' : 'Password', 'password']].map(([k,l,t]) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>{l}</label>
                  <input className="input" type={t} value={form[k] ?? ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} required={k !== 'password' || modal === 'new'} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Role</label>
                <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {availableRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Store</label>
                <select className="input" value={form.store_id ?? ''} onChange={e => setForm(p => ({ ...p, store_id: e.target.value }))}>
                  {can('supervisor') && <option value="">— All Stores (Supervisor) —</option>}
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {modal === 'edit' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Status</label>
                  <select className="input" value={form.active} onChange={e => setForm(p => ({ ...p, active: parseInt(e.target.value) }))}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
