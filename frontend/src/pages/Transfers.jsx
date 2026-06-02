import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Transfers() {
  const { user, can } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ from_store_id: '', to_store_id: '', product_id: '', quantity: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/inventory/transfers').then(setTransfers);
  useEffect(() => {
    load();
    api.get('/stores').then(setStores);
    api.get('/products').then(setProducts);
  }, []);

  const submit = async () => {
    setSaving(true);
    try {
      await api.post('/inventory/transfer', { ...form, quantity: parseFloat(form.quantity) });
      load(); setModal(false);
      setForm({ from_store_id: '', to_store_id: '', product_id: '', quantity: '' });
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const approve = async (id, status) => {
    if (!confirm(`${status === 'approved' ? 'Approve' : 'Reject'} this transfer?`)) return;
    await api.put(`/inventory/transfer/${id}`, { status });
    load();
  };

  const statusBadge = (s) => {
    if (s === 'approved') return <span className="badge badge-success">Approved</span>;
    if (s === 'rejected') return <span className="badge badge-danger">Rejected</span>;
    return <span className="badge badge-warn">Pending</span>;
  };

  return (
    <div style={{ padding: '24px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Stock Transfers</h1>
          <p style={{ color: 'var(--pos-muted)', fontSize: '14px', marginTop: '4px' }}>Move stock between stores</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Request Transfer</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>From</th><th>To</th><th>Qty</th><th>Requested By</th><th>Date</th><th>Status</th>{can('manager','supervisor') && <th>Actions</th>}</tr></thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.product_name} <span style={{ fontSize: '11px', color: 'var(--pos-muted)' }}>({t.sku})</span></td>
                  <td style={{ fontSize: '13px' }}>{t.from_store || <span style={{ color: 'var(--pos-muted)' }}>External</span>}</td>
                  <td style={{ fontSize: '13px' }}>{t.to_store}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{t.quantity}</td>
                  <td style={{ fontSize: '13px', color: 'var(--pos-muted)' }}>{t.requested_by_name}</td>
                  <td style={{ fontSize: '12px', color: 'var(--pos-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td>{statusBadge(t.status)}</td>
                  {can('manager','supervisor') && (
                    <td>
                      {t.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-success btn-sm" onClick={() => approve(t.id, 'approved')}>✓</button>
                          <button className="btn btn-danger btn-sm" onClick={() => approve(t.id, 'rejected')}>✕</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {transfers.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--pos-muted)' }}>No transfers yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Request Stock Transfer</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>From Store</label>
                <select className="input" value={form.from_store_id} onChange={e => setForm(p => ({ ...p, from_store_id: e.target.value }))}>
                  <option value="">— Select Source —</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>To Store</label>
                <select className="input" value={form.to_store_id} onChange={e => setForm(p => ({ ...p, to_store_id: e.target.value }))}>
                  <option value="">— Select Destination —</option>
                  {stores.filter(s => s.id != form.from_store_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Product</label>
                <select className="input" value={form.product_id} onChange={e => setForm(p => ({ ...p, product_id: e.target.value }))}>
                  <option value="">— Select Product —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Quantity</label>
                <input className="input" type="number" min="1" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Submitting…' : 'Submit Request'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
