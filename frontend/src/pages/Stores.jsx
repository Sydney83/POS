import { useState, useEffect } from 'react';
import { api } from '../api/client';

const EMPTY = { name: '', address: '', phone: '' };

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/stores').then(setStores);
  useEffect(() => { load(); }, []);

  const open = (s = null) => { setForm(s ? { ...s } : EMPTY); setModal(s ? 'edit' : 'new'); };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'edit') await api.put(`/stores/${form.id}`, form);
      else await api.post('/stores', form);
      load(); setModal(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '24px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Stores</h1>
          <p style={{ color: 'var(--pos-muted)', fontSize: '14px', marginTop: '4px' }}>Manage store locations</p>
        </div>
        <button className="btn btn-primary" onClick={() => open()}>+ Add Store</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {stores.map(s => (
          <div key={s.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ fontSize: '2rem' }}>🏪</div>
              <button className="btn btn-ghost btn-sm" onClick={() => open(s)}>Edit</button>
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginTop: '12px' }}>{s.name}</h2>
            <p style={{ color: 'var(--pos-muted)', fontSize: '13px', marginTop: '4px' }}>{s.address}</p>
            <p style={{ color: 'var(--pos-muted)', fontSize: '13px', marginTop: '2px' }}>{s.phone}</p>
            <div style={{ marginTop: '12px', padding: '8px 12px', background: 'var(--pos-dark)', borderRadius: '8px', fontSize: '12px', color: 'var(--pos-muted)', fontFamily: 'Space Mono' }}>
              ID: {s.id}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>{modal === 'edit' ? 'Edit' : 'New'} Store</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['name','Store Name'],['address','Address'],['phone','Phone']].map(([k, l]) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>{l}</label>
                  <input className="input" value={form[k] ?? ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
                </div>
              ))}
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
