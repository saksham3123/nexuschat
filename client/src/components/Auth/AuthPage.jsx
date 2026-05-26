import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.dot} />
          NexusChat
        </div>
        <p style={styles.sub}>Real-time messaging · Socket.io · Redis · JWT</p>

        <div style={styles.tabs}>
          {['login', 'register'].map((m) => (
            <button key={m} style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
              onClick={() => setMode(m)}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'register' && (
            <input style={styles.input} placeholder="Username" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          )}
          <input style={styles.input} type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0d0f14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif" },
  card: { background: '#111318', border: '0.5px solid #ffffff12', borderRadius: 12, padding: '36px 32px', width: 360 },
  brand: { fontSize: 20, fontWeight: 700, color: '#e8eaf0', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#4f6ef7', display: 'inline-block' },
  sub: { fontSize: 11, color: '#6b7280', fontFamily: 'monospace', marginBottom: 24 },
  tabs: { display: 'flex', background: '#0d0f14', borderRadius: 7, padding: 3, marginBottom: 20 },
  tab: { flex: 1, padding: '7px 0', border: 'none', background: 'transparent', color: '#6b7280', borderRadius: 5, cursor: 'pointer', fontSize: 13 },
  tabActive: { background: '#4f6ef7', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { background: '#161920', border: '0.5px solid #ffffff12', borderRadius: 7, padding: '10px 14px', color: '#e8eaf0', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  error: { color: '#f87171', fontSize: 12, margin: 0 },
  btn: { background: '#4f6ef7', color: '#fff', border: 'none', borderRadius: 7, padding: '11px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
};
