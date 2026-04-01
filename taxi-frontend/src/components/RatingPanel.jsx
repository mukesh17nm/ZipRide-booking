import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function RatingPanel() {
  const user    = JSON.parse(localStorage.getItem('zipride_user') || '{}');
  const role    = (user.role || 'PASSENGER').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const passId  = user.passengerId || user.id || '';

  const [form,          setForm]          = useState({
    driverId:'', rideRequestId:'', passengerId: String(passId),
    rating:'5', comment:''
  });
  const [result,        setResult]        = useState(null);
  const [warnedDrivers, setWarnedDrivers] = useState(null);
  const [myRides,       setMyRides]       = useState([]);
  const [drivers,       setDrivers]       = useState([]);
  const [loading,       setLoading]       = useState(false);

  // Load completed rides + all drivers (for driver lookup)
  useEffect(() => {
    if (role === 'PASSENGER') {
      api.get('/api/fare/rides')
        .then(({ data }) => {
          const mine = (Array.isArray(data) ? data : [])
            .filter(r => String(r.passengerId) === String(passId) && r.status === 'COMPLETED');
          setMyRides(mine);
        })
        .catch(() => {});
    }
    api.get('/api/drivers')
      .then(({ data }) => setDrivers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const submit = async e => {
    e.preventDefault(); setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/api/ratings/submit', {
        driverId:      parseInt(form.driverId),
        rideRequestId: parseInt(form.rideRequestId),
        passengerId:   parseInt(form.passengerId),
        rating:        parseFloat(form.rating),
        comment:       form.comment,
      });
      setResult(data);
    } catch (err) {
      setResult({ message: err.response?.data?.message || 'Error submitting rating.' });
    } finally { setLoading(false); }
  };

  const fetchWarned = async () => {
    try {
      const { data } = await api.get('/api/ratings/warned-drivers');
      setWarnedDrivers(Array.isArray(data) ? data : []);
    } catch { setWarnedDrivers([]); }
  };

  const stars = n => Array.from({ length: 5 }, (_, i) => (
    <span key={i}
      style={{ cursor: 'pointer', fontSize: 26, color: i < parseInt(form.rating) ? '#C9A84C' : 'var(--border)' }}
      onClick={() => setForm({ ...form, rating: String(i + 1) })}>
      ★
    </span>
  ));

  // Find driver name from drivers list
  const driverInfo = drivers.find(d => String(d.id) === String(form.driverId));

  return (
    <>
      {/* Submit Rating */}
      <div className="panel">
        <div className="panel-header">
          <h3>★ Rate Your Driver</h3>
          <span className="badge">POST /api/ratings/submit</span>
        </div>
        <div className="panel-body">

          {/* Quick select from completed rides */}
          {myRides.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Quick Select from Completed Rides
              </label>
              <select style={{ width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--text-pri)' }}
                onChange={e => {
                  const ride = myRides.find(r => String(r.id) === e.target.value);
                  if (ride) setForm({ ...form, rideRequestId: String(ride.id), driverId: String(ride.driverId || ''), passengerId: String(ride.passengerId) });
                }}>
                <option value="">— Select a completed ride —</option>
                {myRides.map(r => {
                  const pickup = r.pickupName || `${r.pickupLat?.toFixed(3)}, ${r.pickupLng?.toFixed(3)}`;
                  const drop   = r.dropName   || `${r.dropLat?.toFixed(3)}, ${r.dropLng?.toFixed(3)}`;
                  return (
                    <option key={r.id} value={r.id}>
                      Ride #{r.id} · Driver #{r.driverId || '?'} · {pickup} → {drop} · ₹{r.estimatedFare?.toFixed(0)}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group">
                <label>
                  Driver ID (from Drivers table) *
                  {driverInfo && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#4CAF82', fontWeight: 400 }}>
                      ✓ {driverInfo.driverName} · ★ {driverInfo.rollingAverageRating?.toFixed(1)}
                    </span>
                  )}
                </label>
                <input required placeholder="e.g. 1" value={form.driverId}
                  onChange={e => setForm({ ...form, driverId: e.target.value })} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Use the Driver ID shown in the Drivers table (not the user ID)
                </div>
              </div>
              <div className="form-group">
                <label>Ride Request ID *</label>
                <input required placeholder="e.g. 1" value={form.rideRequestId}
                  onChange={e => setForm({ ...form, rideRequestId: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Passenger ID</label>
                <input placeholder="auto-filled" value={form.passengerId}
                  onChange={e => setForm({ ...form, passengerId: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Rating</label>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>{stars(parseInt(form.rating))}</div>
              <input type="range" min="1" max="5" step="0.5" value={form.rating}
                onChange={e => setForm({ ...form, rating: e.target.value })}
                style={{ width: '100%', accentColor: 'var(--gold)' }} />
              <div style={{ color: 'var(--gold)', fontSize: 14, marginTop: 4, fontWeight: 700 }}>
                {form.rating} / 5.0
              </div>
            </div>
            <div className="form-group">
              <label>Comment (optional)</label>
              <input placeholder="Great driver, very punctual!" value={form.comment}
                onChange={e => setForm({ ...form, comment: e.target.value })} />
            </div>
            <button className="btn-action" type="submit" disabled={loading}>
              {loading && <span className="spinner" />} Submit Rating
            </button>
          </form>

          {result && (
            <div className="result-card" style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 10 }}>{result.message}</div>
              {result.newRollingAverageRating !== undefined && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div className="result-row">
                    <span className="rk">Driver ID Used</span>
                    <span className="rv"># {form.driverId}</span>
                  </div>
                  <div className="result-row">
                    <span className="rk">Ride ID</span>
                    <span className="rv"># {form.rideRequestId}</span>
                  </div>
                  <div className="result-row">
                    <span className="rk">Passenger ID</span>
                    <span className="rv"># {form.passengerId}</span>
                  </div>
                  <div className="result-row">
                    <span className="rk">New Rolling Avg</span>
                    <span className="rv highlight">★ {result.newRollingAverageRating?.toFixed(2)}</span>
                  </div>
                  <div className="result-row">
                    <span className="rk">Ratings Considered</span>
                    <span className="rv">{result.totalRatingsConsidered}</span>
                  </div>
                  <div className="result-row">
                    <span className="rk">Warning Flagged</span>
                    <span className={`rv ${result.warningFlagged ? 'error' : 'success'}`}>
                      {result.warningFlagged ? '⚠ YES — Low rating' : '✓ No'}
                    </span>
                  </div>
                  {result.incentiveBonusAwarded && Object.entries(result.incentiveBonusAwarded).map(([period, amt]) => (
                    <div className="result-row" key={period}>
                      <span className="rk">{period} Bonus</span>
                      <span className={`rv ${amt > 0 ? 'success' : ''}`}>
                        {amt > 0 ? `₹${amt} 🎉 awarded!` : 'Not eligible'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* All Drivers + Ratings (visible to all) */}
      {drivers.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3>🧑‍✈️ Driver Ratings Overview</h3>
            <span className="badge">{drivers.length} drivers</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gap: 10 }}>
              {[...drivers].sort((a, b) => b.rollingAverageRating - a.rollingAverageRating).map(d => {
                const rColor = d.rollingAverageRating >= 4 ? '#4CAF82' : d.rollingAverageRating >= 3 ? '#C9A84C' : '#E85555';
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 12, border: d.warningFlagged ? '1px solid rgba(232,85,85,0.3)' : '1px solid var(--border)' }}>
                    <div style={{ fontSize: 24 }}>🧑‍✈️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {d.driverName}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>Driver ID #{d.id}</span>
                        {d.warningFlagged && <span style={{ marginLeft: 8, fontSize: 10, color: '#E85555', fontWeight: 700 }}>⚠ WARNED</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{d.vehicleType} · {d.zone} · {d.status}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {d.totalRidesRated > 0 ? (
                        <>
                          <div style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, color: rColor }}>★ {d.rollingAverageRating?.toFixed(1)}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{d.totalRidesRated} ratings</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No ratings yet</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Admin: Warned Drivers */}
      {isAdmin && (
        <div className="panel">
          <div className="panel-header">
            <h3>⚠ Warned Drivers</h3>
            <button className="btn-secondary" onClick={fetchWarned} style={{ padding: '5px 12px', fontSize: 12 }}>
              Fetch Warned Drivers
            </button>
          </div>
          <div className="panel-body">
            {warnedDrivers === null ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                Click "Fetch Warned Drivers" to load.
              </div>
            ) : warnedDrivers.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#4CAF82', padding: '20px 0' }}>
                ✓ No drivers with warnings.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {warnedDrivers.map(d => (
                  <div key={d.id} style={{ padding: '12px 16px', background: 'rgba(232,85,85,0.06)', borderRadius: 12, border: '1px solid rgba(232,85,85,0.25)' }}>
                    <div style={{ fontWeight: 700 }}>⚠ {d.driverName} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>Driver ID #{d.id}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Avg Rating: {d.rollingAverageRating?.toFixed(2)} · Rides Rated: {d.totalRidesRated}
                    </div>
                    {d.warningReason && (
                      <div style={{ fontSize: 12, color: '#E85555', marginTop: 4 }}>{d.warningReason}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
