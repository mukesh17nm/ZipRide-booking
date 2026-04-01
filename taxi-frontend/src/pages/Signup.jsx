import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../services/ThemeContext';

function getStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
  return score; // 0=none 1=weak 2=medium 3=strong
}

export default function Signup() {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [form, setForm] = useState({ fullName:'', email:'', password:'', confirm:'', phoneNumber:'', role:'PASSENGER' });
  const [showPass, setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });
  const strength = getStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Medium', 'Strong'][strength];
  const strengthClass = ['', 'weak', 'medium', 'strong'][strength];

  const submit = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.fullName || !form.email || !form.password || !form.phoneNumber) { setError('All fields are required.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:8080/api/auth/signup', {
        fullName: form.fullName, email: form.email,
        password: form.password, phoneNumber: form.phoneNumber, role: form.role
      });
      if (data.success) {
        setSuccess('Account created! Redirecting to login…');
        setTimeout(() => navigate('/login'), 1800);
      } else { setError(data.message || 'Signup failed.'); }
    } catch (err) { setError(err.response?.data?.message || 'Unable to connect to server.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-layout">
      <button className="theme-toggle" onClick={toggle} title="Toggle theme">
        <div className={`theme-toggle-knob ${isDark ? '' : 'light'}`}>{isDark ? '🌙' : '☀️'}</div>
      </button>

      <div className="auth-left">
        <div className="auth-left-brand">
          <div className="logo-icon">🚖</div>
          <h1>Zip<span>Ride</span></h1>
          <p>Join thousands of passengers and drivers on the smartest taxi platform.</p>
          <div className="auth-left-features">
            {['Free to sign up — no hidden fees','Passenger or Driver account','Instant ride matching','Real-time fare estimates','Cancellation protection & promo codes'].map(f => (
              <div className="auth-feature-item" key={f}><span className="dot" /><span>{f}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <h2>Create account</h2>
          <p className="subtitle">Join ZipRide today — it's free</p>

          {error   && <div className="alert alert-error">⚠ {error}</div>}
          {success && <div className="alert alert-success">✓ {success}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Full Name</label>
              <input name="fullName" placeholder="Priya Sharma" value={form.fullName} onChange={handle} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email Address</label>
                <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phoneNumber" placeholder="+91 98765 43210" value={form.phoneNumber} onChange={handle} />
              </div>
            </div>
            <div className="form-group">
              <label>I am a</label>
              <select name="role" value={form.role} onChange={handle}>
                <option value="PASSENGER">Passenger</option>
                <option value="DRIVER">Driver</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input name="password" type={showPass ? 'text' : 'password'}
                  placeholder="Min 6 characters" value={form.password} onChange={handle} />
                <button type="button" className="eye-btn" onClick={() => setShowPass(p => !p)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {form.password && (
                <>
                  <div className="strength-bar">
                    {[1,2,3].map(i => (
                      <div key={i} className={`strength-bar-seg ${strength >= i ? strengthClass : ''}`} />
                    ))}
                  </div>
                  <div className={`strength-label ${strengthClass}`}>{strengthLabel} password</div>
                </>
              )}
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input name="confirm" type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password" value={form.confirm} onChange={handle} />
                <button type="button" className="eye-btn" onClick={() => setShowConfirm(p => !p)}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {form.confirm && form.password !== form.confirm &&
                <div style={{ color:'var(--red)', fontSize:12, marginTop:4 }}>⚠ Passwords do not match</div>
              }
              {form.confirm && form.password === form.confirm && form.confirm.length > 0 &&
                <div style={{ color:'var(--green)', fontSize:12, marginTop:4 }}>✓ Passwords match</div>
              }
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <p className="auth-link-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
