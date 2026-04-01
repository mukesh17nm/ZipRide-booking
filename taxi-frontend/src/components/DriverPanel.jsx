import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function DriverPanel() {
  const user    = JSON.parse(localStorage.getItem('zipride_user') || '{}');
  const role    = (user.role || 'PASSENGER').toUpperCase();
  const isAdmin = role === 'ADMIN';

  const [drivers,     setDrivers]     = useState([]);
  const [form,        setForm]        = useState({
    driverName:'', contactNumber:'', vehicleType:'SEDAN',
    vehicleNumber:'', status:'AVAILABLE', latitude:'11.9416', longitude:'79.8083', zone:'ZONE_A'
  });
  const [matchForm,   setMatchForm]   = useState({
    pickupLat:'11.9416', pickupLng:'79.8083', topN:'3',
    zone:'ZONE_A', vehicleType:'SEDAN', passengerId: String(user.id || 1)
  });
  const [matchResult, setMatchResult] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [msg,         setMsg]         = useState('');
  const [statusMsg,   setStatusMsg]   = useState('');

  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/api/drivers');
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchDrivers error', err);
    }
  };

  const addDriver = async e => {
    e.preventDefault(); setMsg('');
    try {
      await api.post('/api/drivers', {
        ...form,
        latitude:  parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      setMsg('✓ Driver added successfully.');
      setForm({ driverName:'', contactNumber:'', vehicleType:'SEDAN', vehicleNumber:'', status:'AVAILABLE', latitude:'11.9416', longitude:'79.8083', zone:'ZONE_A' });
      fetchDrivers();
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.message || 'Error adding driver.'));
    }
  };

  const updateStatus = async (driverId, status) => {
    setStatusMsg('');
    try {
      await api.patch(`/api/drivers/${driverId}/status?status=${status}`);
      setStatusMsg(`✓ Driver #${driverId} status updated to ${status}`);
      fetchDrivers();
    } catch (err) {
      setStatusMsg('✗ ' + (err.response?.data?.message || 'Error updating status.'));
    }
  };

  const findDrivers = async e => {
    e.preventDefault(); setLoading(true); setMatchResult(null);
    try {
      const { data } = await api.post('/api/drivers/match', {
        pickupLat:  parseFloat(matchForm.pickupLat),
        pickupLng:  parseFloat(matchForm.pickupLng),
        topN:       parseInt(matchForm.topN),
        zone:       matchForm.zone,
        vehicleType: matchForm.vehicleType,
        passengerId: parseInt(matchForm.passengerId),
      });
      setMatchResult(data);
    } catch (err) {
      setMatchResult({ message: err.response?.data?.message || 'Error finding drivers.' });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = s =>
    s === 'AVAILABLE' ? '#4CAF82' : s === 'BUSY' ? '#C9A84C' : 'var(--text-muted)';

  return (
    <>
      {/* ── ADMIN ONLY: Register Driver ──────────────────────────── */}
      {isAdmin && (
        <div className="panel">
          <div className="panel-header">
            <h3>🚖 Register New Driver</h3>
            <span className="badge">ADMIN · POST /api/drivers</span>
          </div>
          <div className="panel-body">
            {msg && (
              <div className={`alert ${msg.startsWith('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
                {msg}
              </div>
            )}
            <form onSubmit={addDriver}>
              <div className="form-row">
                <div className="form-group">
                  <label>Driver Name *</label>
                  <input required placeholder="Ravi Kumar" value={form.driverName}
                    onChange={e => setForm({ ...form, driverName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Contact Number *</label>
                  <input required placeholder="+91 9876543210" value={form.contactNumber}
                    onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                    {['AUTO', 'MINI', 'SEDAN', 'SUV', 'LUXURY'].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vehicle Number *</label>
                  <input required placeholder="TN01AB1234" value={form.vehicleNumber}
                    onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {['AVAILABLE', 'BUSY', 'OFFLINE'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input type="number" step="any" placeholder="11.9416" value={form.latitude}
                    onChange={e => setForm({ ...form, latitude: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input type="number" step="any" placeholder="79.8083" value={form.longitude}
                    onChange={e => setForm({ ...form, longitude: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Zone</label>
                  <select value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>
                    {['ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D'].map(z => <option key={z}>{z}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn-action" type="submit">+ Add Driver</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Driver List ──────────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>🧑‍✈️ All Drivers</h3>
          <button className="btn-secondary" onClick={fetchDrivers} style={{ padding: '5px 12px', fontSize: 12 }}>↻ Refresh</button>
        </div>
        <div className="panel-body">
          {statusMsg && (
            <div className={`alert ${statusMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 12 }}>
              {statusMsg}
            </div>
          )}
          {drivers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🚖</div>
              <div style={{ fontSize: 14 }}>No drivers registered yet.</div>
              {isAdmin && <div style={{ fontSize: 12, marginTop: 6 }}>Use the form above to add drivers.</div>}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {drivers.map(d => (
                <div key={d.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: 'var(--bg-3)', borderRadius: 12,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>🧑‍✈️ {d.driverName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                      {d.vehicleType} · {d.vehicleNumber} · {d.zone} · ★ {d.rollingAverageRating?.toFixed(1) || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.contactNumber}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: `${statusColor(d.status)}22`, color: statusColor(d.status),
                      border: `1px solid ${statusColor(d.status)}44`,
                    }}>
                      {d.status}
                    </span>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {d.status !== 'AVAILABLE' && (
                          <button onClick={() => updateStatus(d.id, 'AVAILABLE')}
                            style={{ padding: '4px 8px', borderRadius: 7, fontSize: 11, border: '1px solid rgba(76,175,130,0.4)', background: 'rgba(76,175,130,0.1)', color: '#4CAF82', cursor: 'pointer' }}>
                            Set Available
                          </button>
                        )}
                        {d.status !== 'OFFLINE' && (
                          <button onClick={() => updateStatus(d.id, 'OFFLINE')}
                            style={{ padding: '4px 8px', borderRadius: 7, fontSize: 11, border: '1px solid rgba(120,120,120,0.3)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            Set Offline
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Driver Matching ──────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>🎯 Find Nearest Driver</h3>
          <span className="badge">POST /api/drivers/match</span>
        </div>
        <div className="panel-body">
          <form onSubmit={findDrivers}>
            <div className="form-row">
              <div className="form-group">
                <label>Pickup Latitude</label>
                <input type="number" step="any" value={matchForm.pickupLat}
                  onChange={e => setMatchForm({ ...matchForm, pickupLat: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Pickup Longitude</label>
                <input type="number" step="any" value={matchForm.pickupLng}
                  onChange={e => setMatchForm({ ...matchForm, pickupLng: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Vehicle Type</label>
                <select value={matchForm.vehicleType}
                  onChange={e => setMatchForm({ ...matchForm, vehicleType: e.target.value })}>
                  {['AUTO', 'MINI', 'SEDAN', 'SUV', 'LUXURY'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Zone</label>
                <select value={matchForm.zone}
                  onChange={e => setMatchForm({ ...matchForm, zone: e.target.value })}>
                  {['ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D'].map(z => <option key={z}>{z}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Top N</label>
                <input type="number" min="1" max="10" value={matchForm.topN}
                  onChange={e => setMatchForm({ ...matchForm, topN: e.target.value })} />
              </div>
            </div>
            <button className="btn-action" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Searching…</> : '🎯 Find Drivers'}
            </button>
          </form>

          {matchResult && (
            <div className="result-card" style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{matchResult.message || 'Match result'}</div>
              {matchResult.nearestDrivers?.length > 0 && (
                <div style={{ display: 'grid', gap: 8 }}>
                  {matchResult.nearestDrivers.map((d, i) => (
                    <div key={d.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', background: 'var(--bg-3)', borderRadius: 10,
                    }}>
                      <span style={{ fontSize: 22 }}>🧑‍✈️</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>#{i + 1} {d.driverName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {d.vehicleType} · {d.vehicleNumber} · {d.zone}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 13 }}>
                          {matchResult.driverDistances?.[d.id]?.toFixed(1)} km
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          ETA ~{Math.ceil((matchResult.driverDistances?.[d.id] || 0) * 3)} min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {matchResult.rideRequestId && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(76,175,130,0.1)', borderRadius: 8, fontSize: 13 }}>
                  ✓ Ride Request #{matchResult.rideRequestId} created and saved to DB
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
