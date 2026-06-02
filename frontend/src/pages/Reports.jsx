import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Reports() {
  const { user } = useAuth()
  const api = useApi()
  const [stores, setStores] = useState([])
  const [storeFilter, setStoreFilter] = useState('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadReport = async () => {
    setLoading(true)
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo })
    if (storeFilter) params.set('store_id', storeFilter)
    const data = await api.get(`/api/sales/reports/summary?${params}`)
    setReport(data)
    setLoading(false)
  }

  useEffect(() => { api.get('/api/stores').then(setStores); loadReport() }, [])

  // Prepare chart data
  const chartData = report?.daily?.reduce((acc, row) => {
    const existing = acc.find(r => r.date === row.date)
    if (existing) { existing[row.store_name] = row.revenue }
    else { acc.push({ date: row.date, [row.store_name]: row.revenue }) }
    return acc
  }, []) || []

  const storeNames = [...new Set(report?.daily?.map(r => r.store_name) || [])]
  const colors = ['var(--accent)', 'var(--green)', 'var(--purple)']

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Sales Reports</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        {user.role === 'supervisor' && (
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} style={{ width: 180 }}>
            <option value="">All Stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 160 }} />
        <span style={{ alignSelf: 'center', color: 'var(--text3)' }}>to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 160 }} />
        <button className="btn btn-primary" onClick={loadReport}>Generate Report</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : report && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            {report.summary.map((s, i) => (
              <div className="card" key={s.store_name} style={{ borderLeft: `3px solid ${colors[i % colors.length]}` }}>
                <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  {s.store_name}
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'IBM Plex Mono', marginBottom: 6, color: colors[i % colors.length] }}>
                  ${(s.total_revenue || 0).toFixed(2)}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)' }}>
                  <span>{s.total_sales} sales</span>
                  <span>Avg ${(s.avg_sale || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
            <div className="card" style={{ borderLeft: '3px solid var(--yellow)' }}>
              <div style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Combined Total
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'IBM Plex Mono', marginBottom: 6, color: 'var(--yellow)' }}>
                ${report.summary.reduce((s, r) => s + (r.total_revenue || 0), 0).toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                {report.summary.reduce((s, r) => s + r.total_sales, 0)} total transactions
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: 'var(--text2)' }}>Daily Revenue by Store</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--text2)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text2)' }} />
                  {storeNames.map((name, i) => (
                    <Bar key={name} dataKey={name} fill={colors[i % colors.length]} radius={[4,4,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Daily table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
              Daily Breakdown
            </div>
            <table>
              <thead>
                <tr><th>Date</th><th>Store</th><th>Sales</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {report.daily.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.date}</td>
                    <td>{r.store_name}</td>
                    <td>{r.count}</td>
                    <td><span className="mono" style={{ color: 'var(--green)', fontWeight: 600 }}>${(r.revenue||0).toFixed(2)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
