import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(user?.store_id || '');

  useEffect(() => {
    api.get('/products').then(setProducts);
    api.get('/stores').then(s => { setStores(s); if (!selectedStore && s[0]) setSelectedStore(s[0].id); });
  }, []);

  useEffect(() => {
    if (selectedStore) api.get(`/inventory/store/${selectedStore}`).then(setInventory);
  }, [selectedStore]);

  const storeId = user?.role === 'cashier' ? user.store_id : selectedStore;

  const getStock = (productId) => inventory.find(i => i.product_id === productId)?.quantity ?? 0;

  const addToCart = (product) => {
    const stock = getStock(product.id);
    const inCart = cart.find(c => c.product_id === product.id)?.quantity || 0;
    if (inCart >= stock) return;
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id);
      if (existing) return prev.map(c => c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product_id: product.id, name: product.name, unit_price: product.price, quantity: 1 }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) { setCart(prev => prev.filter(c => c.product_id !== productId)); return; }
    const stock = getStock(productId);
    setCart(prev => prev.map(c => c.product_id === productId ? { ...c, quantity: Math.min(qty, stock) } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.quantity * c.unit_price, 0);
  const discountAmt = parseFloat(discount) || 0;
  const taxable = Math.max(0, subtotal - discountAmt);
  const tax = taxable * 0.15;
  const total = taxable + tax;

  const checkout = async () => {
    if (!cart.length) return;
    setLoading(true);
    try {
      const items = cart.map(c => ({ product_id: c.product_id, quantity: c.quantity, unit_price: c.unit_price }));
      const res = await api.post('/sales', { store_id: storeId, items, payment_method: paymentMethod, discount: discountAmt });
      setReceipt({ ...res, items: cart, payment_method: paymentMethod });
      setCart([]);
      setDiscount(0);
      // Refresh inventory
      api.get(`/inventory/store/${storeId}`).then(setInventory);
    } catch (e) { alert('Checkout failed: ' + e.message); }
    finally { setLoading(false); }
  };

  const fmt = (n) => `MK${Number(n).toFixed(2)}`;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (receipt) return (
    <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto' }} className="fade-in">
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>✅</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--pos-accent2)' }}>Sale Complete!</h2>
        <p style={{ color: 'var(--pos-muted)', marginTop: '4px', fontSize: '14px' }}>Transaction #{receipt.id}</p>
        <div style={{ margin: '20px 0', padding: '16px', background: 'var(--pos-dark)', borderRadius: '8px', textAlign: 'left' }}>
          {receipt.items.map(item => (
            <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
              <span>{item.name} × {item.quantity}</span>
              <span className="mono">{fmt(item.quantity * item.unit_price)}</span>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid var(--pos-border)', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--pos-muted)' }}>
            <span>Tax (15%)</span><span className="mono">{fmt(receipt.tax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px', marginTop: '8px' }}>
            <span>TOTAL</span><span className="mono" style={{ color: 'var(--pos-accent2)' }}>{fmt(receipt.total)}</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--pos-muted)', textAlign: 'center', textTransform: 'uppercase' }}>
            Payment: {receipt.payment_method}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setReceipt(null)} style={{ width: '100%', justifyContent: 'center' }}>New Sale</button>
      </div>
    </div>
  );

  return (
    <div style={{ height: 'calc(100vh - 0px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pos-border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, flexShrink: 0 }}>🖥️ Point of Sale</h1>
        {user?.role !== 'cashier' && (
          <select className="input" value={selectedStore} onChange={e => setSelectedStore(e.target.value)} style={{ maxWidth: '180px' }}>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <input className="input" placeholder="Search products by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', flex: 1, overflow: 'hidden' }}>
        {/* Products */}
        <div style={{ overflow: 'auto', padding: '16px' }}>
          <div className="product-grid">
            {filtered.map(p => {
              const stock = getStock(p.id);
              return (
                <div key={p.id} className="product-card" onClick={() => addToCart(p)} style={{ opacity: stock === 0 ? 0.4 : 1, cursor: stock === 0 ? 'not-allowed' : 'pointer' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🏷️</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', lineHeight: '1.3' }}>{p.name}</div>
                  <div className="price" style={{ fontSize: '15px' }}>MK{p.price.toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: stock < 10 ? 'var(--pos-warn)' : 'var(--pos-muted)', marginTop: '4px' }}>
                    {stock === 0 ? 'Out of stock' : `${stock} in stock`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div style={{ borderLeft: '1px solid var(--pos-border)', display: 'flex', flexDirection: 'column', background: 'var(--pos-card)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--pos-border)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600 }}>Cart ({cart.length} items)</h2>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            {cart.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--pos-muted)', fontSize: '14px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛒</div>
                Click products to add them
              </div>
            )}
            {cart.map(item => (
              <div key={item.product_id} style={{ padding: '10px', borderRadius: '8px', marginBottom: '6px', background: 'rgba(255,255,255,.03)', border: '1px solid var(--pos-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, flex: 1 }}>{item.name}</div>
                  <button onClick={() => updateQty(item.product_id, 0)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pos-danger)', fontSize: '14px' }}>✕</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '2px 10px' }} onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                    <span className="mono" style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '2px 10px' }} onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
                  </div>
                  <span className="mono" style={{ color: 'var(--pos-accent2)' }}>MK{(item.quantity * item.unit_price).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--pos-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--pos-muted)' }}>
                <span>Subtotal</span><span className="mono">{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--pos-muted)' }}>
                <span>Discount (MK)</span>
                <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="input" style={{ width: '80px', textAlign: 'right', padding: '4px 8px', fontSize: '13px' }} min="0" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--pos-muted)' }}>
                <span>Tax (15%)</span><span className="mono">{fmt(tax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>
                <span>TOTAL</span><span className="mono" style={{ color: 'var(--pos-accent2)' }}>{fmt(total)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="mobile">📱 Mobile Pay</option>
              </select>
            </div>

            <button className="btn btn-success" onClick={checkout} disabled={!cart.length || loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px', fontWeight: 700 }}>
              {loading ? 'Processing…' : `Checkout ${fmt(total)}`}
            </button>
            {cart.length > 0 && (
              <button className="btn btn-ghost" onClick={() => setCart([])} style={{ width: '100%', justifyContent: 'center', marginTop: '6px', fontSize: '13px' }}>Clear Cart</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
