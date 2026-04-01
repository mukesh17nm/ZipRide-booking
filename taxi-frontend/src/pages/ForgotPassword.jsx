import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../services/ThemeContext';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  // 3 steps: 1=enter email, 2=enter new password, 3=success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  /* ── Step 1: verify email exists ── */
  const checkEmail = async e => {
    e.preventDefault(); setError('');
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:8080/api/auth/check-email?email=${email}`);
      if (data.exists) { setStep(2); }
      else { setError('No account found with this email address.'); }
    } catch { setError('Unable to connect to server.'); }
    finally { setLoading(false); }
  };

  /* ── Step 2: reset password ── */
  const resetPassword = async e => {
    e.preventDefault(); setError('');
    if (!newPassword || newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:8080/api/auth/forgot-password', {
        email, newPassword, confirmPassword
      });
      if (data.success) { setStep(3); }
      else { setError(data.message || 'Reset failed.'); }
    } catch (err) { setError(err.response?.data?.message || 'Unable to connect to server.'); }
    finally { setLoading(false); }
  };

  const StepIndicator = () => (
    <div className="step-indicator">
      {[1,2,3].map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div className={`step-dot ${step > s ? 'done' : step === s ? 'active' : 'inactive'}`}>
              {step > s ? '✓' : s}
            </div>
            <div className="step-label" style={{ color: step === s ? 'var(--gold)' : 'var(--text-muted)', fontSize:10 }}>
              {['Email', 'New Password', 'Done'][i]}
            </div>
          </div>
          {i < 2 && <div className={`step-line ${step > s ? 'done' : ''}`} style={{ marginBottom:16 }} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="auth-layout">
      <button className="theme-toggle" onClick={toggle} title="Toggle theme">
        <div className={`theme-toggle-knob ${isDark ? '' : 'light'}`}>{isDark ? '🌙' : '☀️'}</div>
      </button>

      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-brand">
          <div className="logo-icon">🚖</div>
          <h1>Zip<span>Ride</span></h1>
          <p>Don't worry — resetting your password is quick and easy.</p>
          <div className="auth-left-features" style={{ marginTop:32 }}>
            <div className="auth-feature-item"><span className="dot" /><span>Step 1 — Enter your registered email</span></div>
            <div className="auth-feature-item"><span className="dot" /><span>Step 2 — Set a new strong password</span></div>
            <div className="auth-feature-item"><span className="dot" /><span>Step 3 — Login with new password</span></div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-container">

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <>
              <h2>Forgot Password</h2>
              <p className="subtitle">Enter your registered email to continue</p>
              <StepIndicator />
              {error && <div className="alert alert-error">⚠ {error}</div>}
              <form onSubmit={checkEmail}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                </div>
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading && <span className="spinner" />}
                  {loading ? 'Checking…' : 'Continue →'}
                </button>
              </form>
              <div className="auth-divider"><span>or</span></div>
              <p className="auth-link-text"><Link to="/login">← Back to Login</Link></p>
            </>
          )}

          {/* ── Step 2: New Password ── */}
          {step === 2 && (
            <>
              <h2>Set New Password</h2>
              <p className="subtitle">Create a strong new password for <strong style={{ color:'var(--gold)' }}>{email}</strong></p>
              <StepIndicator />
              {error && <div className="alert alert-error">⚠ {error}</div>}
              <form onSubmit={resetPassword}>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-wrapper">
                    <input type={showNew ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus />
                    <button type="button" className="eye-btn" onClick={() => setShowNew(p => !p)}>
                      {showNew ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="password-wrapper">
                    <input type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    <button type="button" className="eye-btn" onClick={() => setShowConfirm(p => !p)}>
                      {showConfirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword &&
                    <div style={{ color:'var(--red)', fontSize:12, marginTop:4 }}>⚠ Passwords do not match</div>
                  }
                  {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 &&
                    <div style={{ color:'var(--green)', fontSize:12, marginTop:4 }}>✓ Passwords match</div>
                  }
                </div>
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading && <span className="spinner" />}
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
                <button type="button" className="btn-outline" onClick={() => { setStep(1); setError(''); }}>
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div style={{ textAlign:'center' }}>
              <StepIndicator />
              <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
              <h2 style={{ marginBottom:8 }}>Password Reset!</h2>
              <p style={{ color:'var(--text-sec)', marginBottom:28, lineHeight:1.7 }}>
                Your password has been successfully updated.<br />
                You can now login with your new password.
              </p>
              <div className="alert alert-success">
                ✓ Password changed successfully for <strong>{email}</strong>
              </div>
              <button className="btn-primary" style={{ marginTop:16 }} onClick={() => navigate('/login')}>
                Go to Login →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
