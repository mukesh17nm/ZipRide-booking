import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../services/ThemeContext';

export default function Login() {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault(); setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:8080/api/auth/login', form);
      if (data.success) {
        localStorage.setItem('zipride_user', JSON.stringify(data));
        navigate('/dashboard');
      } else { setError(data.message || 'Login failed.'); }
    } catch (err) { setError(err.response?.data?.message || 'Unable to connect to server.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-layout">
      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggle} title="Toggle theme">
        <div className={`theme-toggle-knob ${isDark ? '' : 'light'}`}>
          {isDark ? '🌙' : '☀️'}
        </div>
      </button>

      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-brand">
          <div className="logo-icon">🚖</div>
          <h1>Zip<span>Ride</span></h1>
          <p>Premium taxi booking with intelligent fare, driver matching &amp; real-time tracking.</p>
          <div className="auth-left-features">
            {['Nearest driver matching in seconds','Dynamic surge pricing engine','Multi-stop fare calculator','Driver ratings & incentive system','Smart promo code discounts'].map(f => (
              <div className="auth-feature-item" key={f}>
                <span className="dot" /><span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-container">
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to your ZipRide account</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Email Address</label>
              <input name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handle} autoComplete="email" />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input name="password" type={showPass ? 'text' : 'password'}
                  placeholder="••••••••" value={form.password} onChange={handle}
                  autoComplete="current-password" />
                <button type="button" className="eye-btn" onClick={() => setShowPass(p => !p)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="forgot-link">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <p className="auth-link-text">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
