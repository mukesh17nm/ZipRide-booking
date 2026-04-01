import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function CancellationPanel() {
  const user    = JSON.parse(localStorage.getItem('zipride_user') || '{}');
  const role    = (user.role || 'PASSENGER').toUpperCase();
  const userId  = user.id || 1;

  const [form,      setForm]      = useState({ rideRequestId:'', cancelledBy: role === 'DRIVER' ? 'DRIVER' : 'PASSENGER', reason:'CHANGED_MIND' });
  const [result,    setResult]    = useState(null);
  const [history,   setHistory]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [histLoad,  setHistLoad]  = useState(false);
  const [myRides,   setMyRides]   = useState([]);

  const REASONS = [
    { value: 'CHANGED_MIND',     label: 'Changed my mind' },
    { value: 'DRIVER_TOO_FAR',   label: 'Driver too far away' },
    { value: 'WRONG_LOCATION',   label: 'Wrong pickup location' },
    { value: 'EMERGENCY',        label: 'Personal emergency' },
    { value: 'LONG_WAIT',        label: 'Waiting too long' },
    { value: 'OTHER',            label: 'Other reason' },
  ];

  useEffect(() => {
    // Load cancellable rides
    api.get('/api/fare/rides')
      .then(({ data }) => {
        const all = Array.isArray(data) ? data : [];
        let cancellable;
        if (role === 'PASSENGER') {
          cancellable = all.filter(r => String(r.passengerId) === String(userId) && ['PENDING', 'MATCHED'].includes(r.status));
        } else if (role === 'DRIVER') {
          cancellable = all.filter(r => String(r.driverId) === String(user.driverId || userId) && r.status === 'MATCHED');
        } else {
          cancellable = all.filter(r => ['PENDING', 'MATCHED'].includes(r.status));
        }
        setMyRides(cancellable);
      })
      .catch(() => {});
  }, []);

  const cancel = async e => {
    e.preventDefault(); setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/api/cancellation/cancel', {
        rideRequestId: parseInt(form.rideRequestId),
        cancelledBy:   form.cancelledBy,
        reason:        form.reason,
        cancellerId:   userId,
      });
      setResult(data);
      // Remove from local list
      setMyRides(prev => prev.filter(r => r.id !== parseInt(form.rideRequestId)));
    } catch (err) {
      setResult({ message: err.response?.data?.message || 'Error cancelling ride.' });
    } finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setHistLoad(true);
    try {
      const { data } = await api.get(`/api/cancellation/history?cancellerId=${userId}&cancelledBy=${form.cancelledBy}`);
      setHistory(Array.isArray(data) ? data : []);
    } catch { setHistory([]); }
    setHistLoad(false);
  };

  return (
    <>
      {/* Cancel a Ride */}
      <div className="panel">
        <div className="panel-header">
          <h3>✕ Cancel a Ride</h3>
          <span className="badge">POST /api/cancellation/cancel</span>
        </div>
        <div className="panel-body">
          {myRides.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Your Active Rides
              </label>
              <select style={{ width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--text-pri)' }}
                onChange={e => setForm({ ...form, rideRequestId: e.target.value })}>
                <option value="">— Select a ride to cancel —</option>
                {myRides.map(r => (
                  <option key={r.id} value={r.id}>
                    Ride #{r.id} · {r.status} · {r.vehicleType} · ₹{r.estimatedFare?.toFixed(0)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={cancel}>
            <div className="form-row">
              <div className="form-group">
                <label>Ride Request ID *</label>
                <input required placeholder="Enter Ride ID" value={form.rideRequestId}
                  onChange={e => setForm({ ...form, rideRequestId: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Cancelled By</label>
                <select value={form.cancelledBy}
                  onChange={e => setForm({ ...form, cancelledBy: e.target.value })}>
                  <option value="PASSENGER">PASSENGER</option>
                  <option value="DRIVER">DRIVER</option>
                  {role === 'ADMIN' && <option value="ADMIN">ADMIN</option>}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Reason</label>
              <select value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}>
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <button className="btn-action" type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#E85555,#c03030)' }}>
              {loading ? <><span className="spinner" /> Cancelling…</> : '✕ Cancel Ride'}
            </button>
          </form>

          {result && (
            <div className="result-card" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 10 }}>{result.message}</div>
              {result.penaltyAmount !== undefined && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div className="result-row">
                    <span className="rk">Penalty Amount</span>
                    <span className="rv highlight">
                      {result.penaltyAmount > 0 ? `₹${result.penaltyAmount?.toFixed(2)}` : 'No penalty — Free window'}
                    </span>
                  </div>
                  {result.minutesElapsed !== undefined && (
                    <div className="result-row">
                      <span className="rk">Time Elapsed</span>
                      <span className="rv">{result.minutesElapsed} min</span>
                    </div>
                  )}
                  <div className="result-row">
                    <span className="rk">Within Free Window</span>
                    <span className={`rv ${result.withinFreeWindow ? 'success' : 'error'}`}>
                      {result.withinFreeWindow ? '✓ Yes (2-min window)' : '✗ No'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancellation History */}
      <div className="panel">
        <div className="panel-header">
          <h3>📋 Cancellation History</h3>
          <button className="btn-secondary" onClick={fetchHistory} disabled={histLoad}
            style={{ padding: '5px 12px', fontSize: 12 }}>
            {histLoad ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '↻ Load History'}
          </button>
        </div>
        <div className="panel-body">
          {history === null ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              Click "Load History" to see cancellations.
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              No cancellation history found.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {history.map((rec, i) => (
                <div key={i} style={{
                  padding: '12px 16px', background: 'var(--bg-3)',
                  borderRadius: 12, border: '1px solid rgba(232,85,85,0.2)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Ride #{rec.rideRequestId}</div>
                    <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(232,85,85,0.12)', color: '#E85555' }}>
                      CANCELLED
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    By: {rec.cancelledBy} · Reason: {rec.reason?.replace(/_/g, ' ')}
                  </div>
                  {rec.penaltyAmount > 0 && (
                    <div style={{ fontSize: 12, color: '#E85555', marginTop: 4 }}>
                      Penalty: ₹{rec.penaltyAmount?.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
