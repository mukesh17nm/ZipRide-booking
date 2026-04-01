import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const STATUS_CFG = {
  PENDING:   { color: '#C9A84C', bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.30)',  icon: '⏳' },
  MATCHED:   { color: '#4CAF82', bg: 'rgba(76,175,130,0.12)',  border: 'rgba(76,175,130,0.30)',  icon: '🚖' },
  ACTIVE:    { color: '#5B93E8', bg: 'rgba(91,147,232,0.12)',  border: 'rgba(91,147,232,0.30)',  icon: '🛣️' },
  COMPLETED: { color: '#4CAF82', bg: 'rgba(76,175,130,0.08)',  border: 'rgba(76,175,130,0.20)',  icon: '✅' },
  CANCELLED: { color: '#E85555', bg: 'rgba(232,85,85,0.08)',   border: 'rgba(232,85,85,0.20)',   icon: '✕'  },
};

const VEHICLE_ICON = { AUTO: '🛺', MINI: '🚗', SEDAN: '🚘', SUV: '🚙', LUXURY: '🏎️' };

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.MATCHED;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.icon} {status}
    </span>
  );
}

function EarningsChart({ rides }) {
  // Group earnings by date (last 7 days)
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  });
  const earningsByDay = last7.map(day => {
    const total = rides
      .filter(r => r.status === 'COMPLETED' && new Date(r.requestTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) === day)
      .reduce((s, r) => s + (r.finalFare || r.estimatedFare || 0), 0);
    return { day, total };
  });
  const max = Math.max(...earningsByDay.map(d => d.total), 1);

  return (
    <div style={{ padding: '14px 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
        {earningsByDay.map(({ day, total }) => (
          <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700 }}>
              {total > 0 ? `₹${total.toFixed(0)}` : ''}
            </div>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              background: total > 0 ? 'var(--gold)' : 'var(--bg-4)',
              height: `${Math.max((total / max) * 56, total > 0 ? 8 : 4)}px`,
              transition: 'height 0.4s ease',
              opacity: total > 0 ? 1 : 0.3,
            }} />
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>{day}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DriverHistoryPanel() {
  const user      = JSON.parse(localStorage.getItem('zipride_user') || '{}');
  const driverId  = user.driverId || user.id || 1;

  const [rides,      setRides]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [filter,     setFilter]     = useState('ALL');
  const [updating,   setUpdating]   = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollRef = useRef(null);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/fare/rides');
      const all  = Array.isArray(data) ? data : [];
      const mine = all.filter(r => String(r.driverId) === String(driverId));
      mine.sort((a, b) => new Date(b.requestTime) - new Date(a.requestTime));
      setRides(mine);
      setLastUpdate(new Date());
    } catch {
      setRides([]);
    }
    setLoading(false);
  }, [driverId]);

  useEffect(() => {
    fetchRides();
    pollRef.current = setInterval(fetchRides, 6000);
    return () => clearInterval(pollRef.current);
  }, [fetchRides]);

  const updateStatus = async (rideId, newStatus) => {
    setUpdating(rideId);
    try {
      await api.patch(`/api/fare/rides/${rideId}/status?status=${newStatus}`);
    } catch {}
    setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: newStatus } : r));
    setUpdating(null);
  };

  // Stats
  const completed   = rides.filter(r => r.status === 'COMPLETED');
  const active      = rides.filter(r => ['MATCHED', 'ACTIVE'].includes(r.status));
  const totalEarned = completed.reduce((s, r) => s + (r.finalFare || r.estimatedFare || 0), 0);
  const todayRides  = completed.filter(r => new Date(r.requestTime).toDateString() === new Date().toDateString());
  const todayEarned = todayRides.reduce((s, r) => s + (r.finalFare || r.estimatedFare || 0), 0);

  const filtered = filter === 'ALL' ? rides : rides.filter(r => r.status === filter);

  const counts = {
    ALL:       rides.length,
    MATCHED:   rides.filter(r => r.status === 'MATCHED').length,
    ACTIVE:    rides.filter(r => r.status === 'ACTIVE').length,
    COMPLETED: rides.filter(r => r.status === 'COMPLETED').length,
    CANCELLED: rides.filter(r => r.status === 'CANCELLED').length,
  };

  return (
    <>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Rides',    value: rides.length,              color: 'var(--gold)'  },
          { label: 'Completed',      value: completed.length,          color: '#4CAF82'       },
          { label: 'Active Now',     value: active.length,             color: '#5B93E8'       },
          { label: "Today's Earning",value: `₹${todayEarned.toFixed(0)}`, color: '#C9A84C'   },
          { label: 'Total Earned',   value: `₹${totalEarned.toFixed(0)}`, color: 'var(--gold)'},
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: '1.7rem', fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Earnings chart */}
      {completed.length > 0 && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header"><h3>📊 7-Day Earnings</h3></div>
          <div className="panel-body"><EarningsChart rides={rides} /></div>
        </div>
      )}

      {/* Active rides — prominently shown */}
      {active.length > 0 && (
        <div className="panel" style={{ marginBottom: 16, border: '1px solid rgba(76,175,130,0.35)' }}>
          <div className="panel-header">
            <h3>🚀 Active Rides</h3>
            <span className="badge" style={{ background: 'rgba(76,175,130,0.15)', color: '#4CAF82' }}>{active.length}</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gap: 12 }}>
              {active.map(ride => {
                const distKm = Math.sqrt(
                  Math.pow((ride.dropLat - ride.pickupLat) * 111, 2) +
                  Math.pow((ride.dropLng - ride.pickupLng) * 111 * Math.cos(ride.pickupLat * Math.PI / 180), 2)
                ).toFixed(1);
                return (
                  <div key={ride.id} style={{ padding: '16px', background: 'var(--bg-3)', borderRadius: 14, border: '1px solid rgba(76,175,130,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontFamily: 'Playfair Display', fontSize: 15, fontWeight: 700 }}>
                        {VEHICLE_ICON[ride.vehicleType] || '🚖'} Ride #{ride.id}
                      </div>
                      <StatusBadge status={ride.status} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(76,175,130,0.1)', borderRadius: 8 }}>
                        <div style={{ fontSize: 9, color: '#4CAF82', fontWeight: 700, marginBottom: 2 }}>📍 PICKUP</div>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{ride.pickupName || `${ride.pickupLat?.toFixed(4)}, ${ride.pickupLng?.toFixed(4)}`}</div>
                      </div>
                      <div style={{ flex: 1, padding: '8px 10px', background: 'rgba(232,85,85,0.1)', borderRadius: 8 }}>
                        <div style={{ fontSize: 9, color: '#E85555', fontWeight: 700, marginBottom: 2 }}>🏁 DROP</div>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{ride.dropName || `${ride.dropLat?.toFixed(4)}, ${ride.dropLng?.toFixed(4)}`}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-sec)', marginBottom: 14, padding: '0 4px' }}>
                      <span>👤 {ride.passengerName ? `${ride.passengerName} (#${ride.passengerId})` : `Passenger #${ride.passengerId}`}</span>
                      <span>~{distKm} km</span>
                      <span style={{ fontWeight: 700, color: 'var(--gold)' }}>₹{ride.estimatedFare?.toFixed(2) || '—'}</span>
                    </div>
                    {/* Status progression buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {ride.status === 'MATCHED' && (
                        <>
                          <button className="btn-action" style={{ flex: 1, padding: '9px' }} onClick={() => updateStatus(ride.id, 'ACTIVE')} disabled={updating === ride.id}>
                            {updating === ride.id ? '⏳' : '🚦 Start Ride'}
                          </button>
                          <button style={{ flex: 0.5, padding: '9px', borderRadius: 10, border: '1px solid rgba(232,85,85,0.4)', background: 'none', color: '#E85555', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => updateStatus(ride.id, 'CANCELLED')} disabled={updating === ride.id}>
                            ✕ Cancel
                          </button>
                        </>
                      )}
                      {ride.status === 'ACTIVE' && (
                        <button className="btn-action" style={{ width: '100%', padding: '9px', background: 'linear-gradient(135deg,#4CAF82,#2d8f5e)' }} onClick={() => updateStatus(ride.id, 'COMPLETED')} disabled={updating === ride.id}>
                          {updating === ride.id ? '⏳' : '✅ Mark Completed'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* History list */}
      <div className="panel">
        <div className="panel-header">
          <h3>📋 Ride History</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading && <span className="spinner" style={{ width: 13, height: 13 }} />}
            {lastUpdate && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lastUpdate.toLocaleTimeString()}</span>}
            <button className="btn-secondary" onClick={fetchRides} style={{ padding: '5px 10px', fontSize: 11 }}>↻</button>
          </div>
        </div>
        <div className="panel-body">

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {['ALL', 'MATCHED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(s => {
              const cfg = STATUS_CFG[s];
              const isActive = filter === s;
              return (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  border: isActive ? `1px solid ${cfg?.color || 'var(--gold)'}` : '1px solid var(--border)',
                  background: isActive ? (cfg?.bg || 'rgba(201,168,76,0.12)') : 'none',
                  color: isActive ? (cfg?.color || 'var(--gold)') : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {s === 'ALL' ? 'All' : (cfg?.icon + ' ' + s)} {counts[s] > 0 && `(${counts[s]})`}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🚖</div>
              <div style={{ fontSize: 14 }}>{filter === 'ALL' ? 'No rides assigned yet.' : `No ${filter.toLowerCase()} rides.`}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {filtered.map(ride => {
                const cfg    = STATUS_CFG[ride.status] || STATUS_CFG.MATCHED;
                const distKm = Math.sqrt(
                  Math.pow((ride.dropLat - ride.pickupLat) * 111, 2) +
                  Math.pow((ride.dropLng - ride.pickupLng) * 111 * Math.cos(ride.pickupLat * Math.PI / 180), 2)
                ).toFixed(1);
                return (
                  <div key={ride.id} style={{ padding: '14px 16px', background: 'var(--bg-3)', borderRadius: 12, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          {VEHICLE_ICON[ride.vehicleType] || '🚖'} Ride #{ride.id}
                        </div>
                        <StatusBadge status={ride.status} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        👤 {ride.passengerName ? `${ride.passengerName} (#${ride.passengerId})` : `Passenger #${ride.passengerId}`} · ~{distKm} km · {new Date(ride.requestTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: ride.status === 'COMPLETED' ? '#4CAF82' : 'var(--text-pri)' }}>
                        ₹{(ride.finalFare || ride.estimatedFare || 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {ride.status === 'COMPLETED' ? 'earned' : 'estimated'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
