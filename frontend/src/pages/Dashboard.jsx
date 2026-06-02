import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/summary').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--pos-muted)' }}>Loading dashboard…</div>;
  if (!data) return <div style={{ padding: '2rem', color: 'var(--pos-danger)' }}>Failed to load</div>;

  const fmt = (n) => new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(n);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: 'var(--pos-muted)', fontSize: '14px', marginTop: '4px' }}>Overview across all stores</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: "Today's Revenue",  value: fmt(data.todaySales.revenue),  sub: `${data.todaySales.count} transactions`,  color: 'var(--pos-accent2)' },
          { label: "Month Revenue",    value: fmt(data.monthSales.revenue),  sub: `${data.monthSales.count} transactions`,  color: 'var(--pos-accent)' },
          { label: "Low Stock Items",  value: data.lowStock.count,           sub: 'Need restocking',                        color: 'var(--pos-warn)' },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--pos-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <div className="card">
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Sales – Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailySales}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [fmt(v), 'Revenue']} contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="#6c63ff" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Revenue by Store</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.salesByStore} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `$${v}`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
              <Tooltip formatter={v => [fmt(v), 'Revenue']} contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#00d4aa" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products */}
      <div className="card">
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Top Products This Month</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.topProducts.map((p, i) => (
                <tr key={p.name}>
                  <td><span className="badge badge-manager">{i + 1}</span></td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td className="mono">{p.sold}</td>
                  <td className="mono" style={{ color: 'var(--pos-accent2)' }}>{fmt(p.revenue)}</td>
                </tr>
              ))}
              {data.topProducts.length === 0 && (
                <tr><td colSpan={4} style={{ color: 'var(--pos-muted)', textAlign: 'center', padding: '2rem' }}>No sales this month yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
