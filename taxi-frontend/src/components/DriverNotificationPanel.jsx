import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const VEHICLE_ICON = { AUTO: '🛺', MINI: '🚗', SEDAN: '🚘', SUV: '🚙', LUXURY: '🏎️' };

function CountdownTimer({ seconds, rideId, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => { setRemaining(seconds); }, [rideId, seconds]);
  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);
  const pct   = (remaining / seconds) * 100;
  const color = remaining > 15 ? '#4CAF82' : remaining > 7 ? '#C9A84C' : '#E85555';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--bg-4)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 1s linear, background 0.3s' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color, minWidth: 26, textAlign: 'right' }}>{remaining}s</span>
    </div>
  );
}

function PlaceLabel({ label, name, lat, lng, color }) {
  const display = name && name.trim() && !name.match(/^\d/)
    ? name
    : (lat && lng ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}` : '—');
  return (
    <div style={{ padding: '9px 11px', background: `${color}18`, borderRadius: 9, border: `1px solid ${color}30` }}>
      <div style={{ fontSize: 9, color, fontWeight: 800, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, wordBreak: 'break-word', lineHeight: 1.4 }}>{display}</div>
    </div>
  );
}

export default function DriverNotificationPanel() {
  const user     = JSON.parse(localStorage.getItem('zipride_user') || '{}');
  const role     = (user.role || 'DRIVER').toUpperCase();
  const driverId = user.driverId || user.id || 1;

  const [pending,    setPending]    = useState([]);
  const [myAccepted, setMyAccepted] = useState([]);
  const [dismissed,  setDismissed]  = useState(new Set());
  const [accepting,  setAccepting]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [autoOn,     setAutoOn]     = useState(true);
  const [lastFetch,  setLastFetch]  = useState(null);
  const [newIds,     setNewIds]     = useState(new Set());
  const prevIds  = useRef(new Set());
  const pollRef  = useRef(null);
  const audioRef = useRef(null);

  const playPing = useCallback(() => {
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/fare/rides');
      const all  = Array.isArray(data) ? data : [];
      const pend = all.filter(r => r.status === 'PENDING');
      const mine = role === 'DRIVER'
        ? all.filter(r => String(r.driverId) === String(driverId) && ['MATCHED', 'ACTIVE'].includes(r.status))
        : all.filter(r => ['MATCHED', 'ACTIVE'].includes(r.status));
      const appeared = pend.filter(r => !prevIds.current.has(r.id)).map(r => r.id);
      if (appeared.length > 0) {
        setNewIds(new Set(appeared));
        playPing();
        setTimeout(() => setNewIds(new Set()), 3000);
      }
      prevIds.current = new Set(pend.map(r => r.id));
      setPending(pend);
      setMyAccepted(mine);
      setLastFetch(new Date());
    } catch { }
    setLoading(false);
  }, [driverId, role, playPing]);

  useEffect(() => {
    fetchPending();
    if (autoOn) pollRef.current = setInterval(fetchPending, 6000);
    return () => clearInterval(pollRef.current);
  }, [autoOn, fetchPending]);

  const accept = async (ride) => {
    if (role === 'ADMIN') return;
    setAccepting(ride.id);
    try {
      await api.patch(`/api/fare/rides/${ride.id}/accept?driverId=${driverId}`);
      setPending(prev => prev.filter(r => r.id !== ride.id));
      setMyAccepted(prev => [...prev, { ...ride, driverId, status: 'MATCHED' }]);
    } catch {
      setPending(prev => prev.filter(r => r.id !== ride.id));
      setMyAccepted(prev => [...prev, { ...ride, driverId, status: 'MATCHED' }]);
    }
    setAccepting(null);
  };

  const decline = (rideId) => setDismissed(prev => new Set([...prev, rideId]));

  const visible = pending.filter(r => !dismissed.has(r.id));

  return (
    <>
      {/* Control bar */}
      <div className="panel" style={{ marginBottom: 0 }}>
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            📡 {role === 'ADMIN' ? 'All Ride Requests (Admin View)' : 'Ride Broadcast'}
            {visible.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: '#E85555', color: '#fff', fontSize: 11, fontWeight: 800 }}>
                {visible.length}
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {loading && <span className="spinner" style={{ width: 13, height: 13 }} />}
            {lastFetch && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Updated {lastFetch.toLocaleTimeString()}</span>}
            <button onClick={() => setAutoOn(p => !p)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', background: autoOn ? 'rgba(76,175,130,0.15)' : 'rgba(120,120,120,0.1)', color: autoOn ? '#4CAF82' : 'var(--text-muted)' }}>
              {autoOn ? '🟢 Live' : '⚫ Paused'}
            </button>
            <button className="btn-secondary" onClick={fetchPending} style={{ padding: '5px 12px', fontSize: 11 }}>↻ Refresh</button>
          </div>
        </div>
        <div style={{ padding: '8px 20px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
          {role === 'ADMIN'
            ? 'Monitoring all pending ride requests in real-time.'
            : 'Every passenger booking is broadcast to ALL drivers. First to accept within 30s gets the ride.'}
        </div>
      </div>

      {/* Incoming requests */}
      <div className="panel">
        <div className="panel-header">
          <h3>🔔 {role === 'ADMIN' ? 'Pending Requests' : 'Incoming Requests'}</h3>
          <span className="badge">{visible.length} pending</span>
        </div>
        <div className="panel-body">
          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 14, marginBottom: 6 }}>No pending ride requests.</div>
              <div style={{ fontSize: 12 }}>{autoOn ? 'Checking every 6 seconds…' : 'Auto-refresh is paused.'}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {visible.map(ride => {
                const isNew = newIds.has(ride.id);
                const isAcc = accepting === ride.id;
                const distKm = Math.sqrt(
                  Math.pow((ride.dropLat - ride.pickupLat) * 111, 2) +
                  Math.pow((ride.dropLng - ride.pickupLng) * 111 * Math.cos(ride.pickupLat * Math.PI / 180), 2)
                ).toFixed(1);
                const eta = Math.ceil(parseFloat(distKm) * 3);
                const passengerLabel = ride.passengerName
                  ? `${ride.passengerName} (ID #${ride.passengerId})`
                  : `Passenger #${ride.passengerId}`;
                return (
                  <div key={ride.id} style={{
                    borderRadius: 16, overflow: 'hidden',
                    border: isNew ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: isNew ? 'rgba(201,168,76,0.04)' : 'var(--bg-3)',
                    boxShadow: isNew ? '0 0 24px rgba(201,168,76,0.18)' : 'none',
                    transition: 'all 0.35s',
                  }}>
                    <div style={{ height: 3, background: 'var(--gold)', opacity: isNew ? 1 : 0.4 }} />
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                          {isNew && <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.08em', marginBottom: 3 }}>✨ NEW BOOKING</div>}
                          <div style={{ fontFamily: 'Playfair Display', fontSize: 17, fontWeight: 700 }}>
                            {VEHICLE_ICON[ride.vehicleType] || '🚖'} Ride #{ride.id}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            👤 {passengerLabel} · {new Date(ride.requestTime).toLocaleTimeString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'Playfair Display', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                            ₹{ride.estimatedFare?.toFixed(0) || '—'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>estimated</div>
                        </div>
                      </div>

                      {/* Pickup / Drop with place names */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                        <PlaceLabel label="📍 PICKUP" name={ride.pickupName} lat={ride.pickupLat} lng={ride.pickupLng} color="#4CAF82" />
                        <PlaceLabel label="🏁 DROP"   name={ride.dropName}   lat={ride.dropLat}   lng={ride.dropLng}   color="#E85555" />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
                        {[['🚗', ride.vehicleType], ['📏', `${distKm} km`], ['⏱', `${eta} min`], ['📍', ride.zone || 'ZONE_A']].map(([icon, val]) => (
                          <div key={icon} style={{ padding: '7px 6px', background: 'var(--bg-4)', borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontSize: 12 }}>{icon}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-pri)', marginTop: 2 }}>{val}</div>
                          </div>
                        ))}
                      </div>

                      {role === 'DRIVER' && (
                        <>
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>⏳ OFFER WINDOW</div>
                            <CountdownTimer seconds={30} rideId={ride.id} onExpire={() => decline(ride.id)} />
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => decline(ride.id)} disabled={isAcc}
                              style={{ flex: 0.42, padding: '11px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,85,85,0.1)'; e.currentTarget.style.color = '#E85555'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                              ✕ Decline
                            </button>
                            <button className="btn-action" style={{ flex: 1, padding: '11px 0' }}
                              onClick={() => accept(ride)} disabled={isAcc}>
                              {isAcc ? <><span className="spinner" /> Accepting…</> : '✓ Accept Ride'}
                            </button>
                          </div>
                        </>
                      )}

                      {role === 'ADMIN' && (
                        <div style={{ padding: '8px 12px', background: 'rgba(201,168,76,0.08)', borderRadius: 8, fontSize: 12, color: '#C9A84C', fontWeight: 600 }}>
                          📊 Monitoring — waiting for a driver to accept
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* My accepted / Active rides */}
      {myAccepted.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <h3>🚀 {role === 'ADMIN' ? 'Active Rides' : 'My Accepted Rides'}</h3>
            <span className="badge" style={{ background: 'rgba(76,175,130,0.15)', color: '#4CAF82' }}>{myAccepted.length}</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gap: 10 }}>
              {myAccepted.map(r => {
                const passengerLabel = r.passengerName
                  ? `${r.passengerName} (ID #${r.passengerId})`
                  : `Passenger #${r.passengerId}`;
                return (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 12, border: '1px solid rgba(76,175,130,0.25)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{VEHICLE_ICON[r.vehicleType] || '🚖'} Ride #{r.id}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        👤 {passengerLabel}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        📍 {r.pickupName || `${r.pickupLat?.toFixed(4)}, ${r.pickupLng?.toFixed(4)}`}
                        {' → '}
                        🏁 {r.dropName || `${r.dropLat?.toFixed(4)}, ${r.dropLng?.toFixed(4)}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        Driver #{r.driverId} · ₹{r.estimatedFare?.toFixed(2)}
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(76,175,130,0.15)', color: '#4CAF82', border: '1px solid rgba(76,175,130,0.3)', flexShrink: 0, marginLeft: 8 }}>
                      🚖 {r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:none; } }
      `}</style>
    </>
  );
}
