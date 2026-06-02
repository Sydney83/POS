import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const doLogin = async (e, p) => {
    setError('');
    setLoading(true);
    try {
      await login(e, p);
      // AuthContext.login sets user → App re-renders → ProtectedRoute redirects
    } catch (err) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    doLogin(email, password);
  };

  const quickLogin = (e, p) => {
    setEmail(e);
    setPassword(p);
    doLogin(e, p);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '16px', background: 'var(--pos-dark)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🛒</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>POS System</h1>
          <p style={{ color: 'var(--pos-muted)', marginTop: '4px', fontSize: '14px' }}>Multi-store Point of Sale</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--pos-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,.12)', border: '1px solid var(--pos-danger)',
                borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#f87171'
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px' }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

          </form>
        </div>

        {/* Demo shortcuts */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '11px', color: 'var(--pos-muted)', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Demo Accounts — click to log in instantly
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { label: '👑 Supervisor', e: 'supervisor@pos.com', p: 'Password123!' },
              { label: '🏪 Manager',    e: 'manager1@pos.com',   p: 'Password123!' },
              { label: '🖥️ Cashier',    e: 'cashier1@pos.com',   p: 'Password123!' },
            ].map(({ label, e, p }) => (
              <button
                key={e}
                type="button"
                onClick={() => quickLogin(e, p)}
                disabled={loading}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'center', fontSize: '12px', padding: '10px 4px', flexDirection: 'column', gap: '2px' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
