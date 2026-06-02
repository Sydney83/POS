import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', sku: '', category_id: '', price: '', cost: '', barcode: '', unit: 'pcs' };

export default function Products() {
  const { can } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/products').then(setProducts);
  useEffect(() => { load(); api.get('/products/categories').then(setCategories); }, []);

  const open = (p = null) => { setForm(p ? { ...p } : EMPTY); setModal(p ? 'edit' : 'new'); };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'edit') await api.put(`/products/${form.id}`, form);
      else await api.post('/products', form);
      load(); setModal(null);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`); load();
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n) => `MK${Number(n).toFixed(2)}`;

  return (
    <div style={{ padding: '24px' }} className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Products</h1>
          <p style={{ color: 'var(--pos-muted)', fontSize: '14px', marginTop: '4px' }}>Global product catalogue</p>
        </div>
        {can('manager','supervisor') && <button className="btn btn-primary" onClick={() => open()}>+ Add Product</button>}
      </div>

      <input className="input" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '16px' }} />

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Cost</th><th>Unit</th>{can('manager','supervisor') && <th>Actions</th>}</tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td className="mono" style={{ fontSize: '12px', color: 'var(--pos-muted)' }}>{p.sku}</td>
                  <td><span className="badge badge-manager" style={{ fontSize: '11px' }}>{p.category_name}</span></td>
                  <td className="mono" style={{ color: 'var(--pos-accent2)' }}>{fmt(p.price)}</td>
                  <td className="mono" style={{ color: 'var(--pos-muted)' }}>{fmt(p.cost)}</td>
                  <td style={{ color: 'var(--pos-muted)', fontSize: '13px' }}>{p.unit}</td>
                  {can('manager','supervisor') && (
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => open(p)}>Edit</button>
                      {can('supervisor') && <button className="btn btn-danger btn-sm" onClick={() => del(p.id)}>Del</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>{modal === 'edit' ? 'Edit' : 'New'} Product</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[['name','Name',1], ['sku','SKU',1], ['price','Price',1], ['cost','Cost',1], ['barcode','Barcode',2], ['unit','Unit',1]].map(([k,l,span]) => (
                <div key={k} style={{ gridColumn: `span ${span}` }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>{l}</label>
                  <input className="input" value={form[k] ?? ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} type={['price','cost'].includes(k) ? 'number' : 'text'} step="0.01" />
                </div>
              ))}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Category</label>
                <select className="input" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                  <option value="">— Select —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
