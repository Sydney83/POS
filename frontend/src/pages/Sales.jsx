import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ store_id: '', from: '', to: '' });
  const [selected, setSelected] = useState(null);

  const load = () => {
    const q = new URLSearchParams();
    if (filters.store_id) q.set('store_id', filters.store_id);
    if (filters.from) q.set('from', filters.from);
    if (filters.to) q.set('to', filters.to);
    api.get(`/sales?${q}`).then(setSales);
  };

  useEffect(() => {
    api.get('/stores').then(setStores);
    load();
  }, []);

  const viewDetail = async (id) => {
    const tx = await api.get(`/sales/${id}`);
    setSelected(tx);
  };

  const fmt = (n) => `MK${Number(n).toFixed(2)}`;

  return (
    <div style={{ padding: '24px' }} className="fade-in">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Sales History</h1>
        <p style={{ color: 'var(--pos-muted)', fontSize: '14px', marginTop: '4px' }}>All transactions</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {user?.role === 'supervisor' && (
          <select className="input" style={{ maxWidth: '180px' }} value={filters.store_id} onChange={e => setFilters(f => ({ ...f, store_id: e.target.value }))}>
            <option value="">All Stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <input className="input" type="date" style={{ maxWidth: '160px' }} value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
        <input className="input" type="date" style={{ maxWidth: '160px' }} value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
        <button className="btn btn-primary" onClick={load}>Apply</button>
        <button className="btn btn-ghost" onClick={() => { setFilters({ store_id: '', from: '', to: '' }); setTimeout(load, 50); }}>Reset</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Store</th><th>Cashier</th><th>Items</th><th>Total</th><th>Payment</th><th></th></tr></thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td className="mono" style={{ fontSize: '12px', color: 'var(--pos-muted)' }}>#{s.id}</td>
                  <td style={{ fontSize: '13px' }}>{new Date(s.created_at).toLocaleString()}</td>
                  <td style={{ fontSize: '13px' }}>{s.store_name}</td>
                  <td style={{ fontSize: '13px' }}>{s.cashier_name}</td>
                  <td className="mono">{/* items count not returned in list - skip */}—</td>
                  <td className="mono" style={{ color: 'var(--pos-accent2)', fontWeight: 700 }}>{fmt(s.total)}</td>
                  <td><span className="badge badge-manager" style={{ fontSize: '11px', textTransform: 'capitalize' }}>{s.payment_method}</span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => viewDetail(s.id)}>View</button></td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--pos-muted)' }}>No sales found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Transaction #{selected.id}</h2>
            <p style={{ fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '16px' }}>{selected.store_name} · {new Date(selected.created_at).toLocaleString()}</p>
            <table style={{ width: '100%', fontSize: '13px' }}>
              <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {selected.items?.map(i => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td className="mono">{i.quantity}</td>
                    <td className="mono">{fmt(i.unit_price)}</td>
                    <td className="mono" style={{ color: 'var(--pos-accent2)' }}>{fmt(i.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr style={{ border: 'none', borderTop: '1px solid var(--pos-border)', margin: '12px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--pos-muted)' }}><span>Discount</span><span className="mono">-{fmt(selected.discount)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--pos-muted)' }}><span>Tax (15%)</span><span className="mono">{fmt(selected.tax)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px' }}><span>TOTAL</span><span className="mono" style={{ color: 'var(--pos-accent2)' }}>{fmt(selected.total)}</span></div>
            </div>
            <button className="btn btn-ghost" onClick={() => setSelected(null)} style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
