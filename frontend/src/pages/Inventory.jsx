import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Inventory() {
  const { user, can } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(user?.store_id || '');
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);

  const load = (storeId) => api.get(`/inventory/store/${storeId}`).then(setInventory);

  useEffect(() => {
    api.get('/stores').then(s => {
      setStores(s);
      const sid = user?.store_id || s[0]?.id;
      setSelectedStore(sid);
      if (sid) load(sid);
    });
  }, []);

  const handleStoreChange = (sid) => { setSelectedStore(sid); load(sid); };

  const saveAdjust = async () => {
    await api.put('/inventory/adjust', {
      product_id: editItem.product_id,
      store_id: selectedStore,
      quantity: parseFloat(editItem.quantity),
      low_stock_threshold: parseFloat(editItem.low_stock_threshold),
    });
    setEditItem(null);
    load(selectedStore);
  };

  const filtered = inventory.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Inventory</h1>
          <p style={{ color: 'var(--pos-muted)', fontSize: '14px', marginTop: '4px' }}>Stock levels per store</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {user?.role !== 'cashier' && (
          <select className="input" value={selectedStore} onChange={e => handleStoreChange(e.target.value)} style={{ maxWidth: '200px' }}>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <input className="input" placeholder="Search by product name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Product</th><th>SKU</th><th>Category</th><th>Qty</th><th>Low Stock Alert</th><th>Status</th>{can('manager','supervisor') && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td className="mono" style={{ color: 'var(--pos-muted)', fontSize: '12px' }}>{i.sku}</td>
                  <td><span className="badge badge-manager" style={{ fontSize: '11px' }}>{i.category_name}</span></td>
                  <td className="mono" style={{ fontWeight: 700, fontSize: '16px' }}>{i.quantity}</td>
                  <td className="mono" style={{ color: 'var(--pos-muted)', fontSize: '13px' }}>{i.low_stock_threshold}</td>
                  <td>
                    {i.quantity === 0
                      ? <span className="badge badge-danger">Out of Stock</span>
                      : i.quantity <= i.low_stock_threshold
                      ? <span className="badge badge-warn">Low Stock</span>
                      : <span className="badge badge-success">In Stock</span>}
                  </td>
                  {can('manager','supervisor') && (
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditItem({ ...i })}>Adjust</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Adjust Stock — {editItem.name}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px' }}>QUANTITY</label>
                <input className="input" type="number" value={editItem.quantity} onChange={e => setEditItem(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px' }}>LOW STOCK THRESHOLD</label>
                <input className="input" type="number" value={editItem.low_stock_threshold} onChange={e => setEditItem(p => ({ ...p, low_stock_threshold: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setEditItem(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveAdjust}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
