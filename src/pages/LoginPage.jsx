import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// ECB Boundary: RegistrationUI / AuthenticationUI
export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ROLES = [
    { value: 'stakeholder', label: 'Stakeholder' },
    { value: 'product_manager', label: 'Product Manager' },
    { value: 'dev_team', label: 'Dev Team' },
  ];

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password || !role) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await signIn(email, password, role);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #dde8ff 0%, #e8eeff 40%, #f0f0ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif"
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 40px 36px',
        width: 380, boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
        border: '1px solid #e8eaf0'
      }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, background: '#6366f1', borderRadius: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, marginBottom: 16
          }}>👥</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
            Feature Prioritization System
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748b', lineHeight: 1.5 }}>
            Sign in to manage your product backlog with Kano Model
          </p>
        </div>

        <form onSubmit={handleSignIn}>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }}>✉</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                style={{
                  width: '100%', padding: '10px 12px 10px 34px', borderRadius: 8,
                  border: '1px solid #e8eaf0', fontSize: 13.5, color: '#334155',
                  background: '#f8f9ff', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }}>🔒</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '10px 12px 10px 34px', borderRadius: 8,
                  border: '1px solid #e8eaf0', fontSize: 13.5, color: '#334155',
                  background: '#f8f9ff', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Role */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
              Select Role
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #e8eaf0', fontSize: 13.5,
                  color: role ? '#334155' : '#94a3b8',
                  background: '#f8f9ff', outline: 'none', appearance: 'none', cursor: 'pointer'
                }}
              >
                <option value="">Choose your role</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>▾</span>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {/* Demo credentials hint */}
          <div style={{ background: '#eff0ff', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#6366f1', marginBottom: 16 }}>
            <strong>Demo:</strong> pm@demo.com / dev@demo.com / stakeholder@demo.com · password: <strong>password123</strong>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 8, border: 'none',
              background: '#0f172a', color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
