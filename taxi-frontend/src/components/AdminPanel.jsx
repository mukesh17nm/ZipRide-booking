import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const STATUS_CFG = {
  PENDING:   { color: '#C9A84C', bg: 'rgba(201,168,76,0.12)',  icon: '⏳' },
  MATCHED:   { color: '#4CAF82', bg: 'rgba(76,175,130,0.12)',  icon: '🚖' },
  ACTIVE:    { color: '#5B93E8', bg: 'rgba(91,147,232,0.12)',  icon: '🛣️' },
  COMPLETED: { color: '#4CAF82', bg: 'rgba(76,175,130,0.08)',  icon: '✅' },
  CANCELLED: { color: '#E85555', bg: 'rgba(232,85,85,0.08)',   icon: '✕'  },
};

function RatingBar({ value, max = 5 }) {
  const pct   = Math.min((value / max) * 100, 100);
  const color = value >= 4 ? '#4CAF82' : value >= 3 ? '#C9A84C' : '#E85555';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-4)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32 }}>★ {value?.toFixed(1)}</span>
    </div>
  );
}

export default function AdminPanel() {
  const [tab,     setTab]     = useState('rides');
  const [rides,   setRides]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');
  const [ratingFilter, setRatingFilter] = useState('ALL'); // ALL | HIGH | LOW | WARNED

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ridesR, usersR, driversR] = await Promise.all([
        api.get('/api/fare/rides'),
        api.get('/api/auth/users'),
        api.get('/api/drivers'),
      ]);
      setRides(Array.isArray(ridesR.data) ? ridesR.data.sort((a,b) => new Date(b.requestTime) - new Date(a.requestTime)) : []);
      setUsers(Array.isArray(usersR.data) ? usersR.data : []);
      setDrivers(Array.isArray(driversR.data) ? driversR.data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateRideStatus = async (rideId, status) => {
    try {
      await api.patch(`/api/fare/rides/${rideId}/status?status=${status}`);
      setRides(prev => prev.map(r => r.id === rideId ? { ...r, status } : r));
      setMsg(`✓ Ride #${rideId} updated to ${status}`);
    } catch { setMsg('✗ Error updating ride status.'); }
  };

  const toggleUser = async (userId, isActive) => {
    try {
      await api.patch(`/api/auth/users/${userId}/${isActive ? 'deactivate' : 'activate'}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !isActive } : u));
      setMsg(`✓ User #${userId} ${isActive ? 'deactivated' : 'activated'}.`);
    } catch { setMsg('✗ Error updating user.'); }
  };

  const updateDriverStatus = async (driverId, status) => {
    try {
      await api.patch(`/api/drivers/${driverId}/status?status=${status}`);
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status } : d));
      setMsg(`✓ Driver #${driverId} status set to ${status}`);
    } catch { setMsg('✗ Error updating driver.'); }
  };

  const TABS = [
    { id: 'rides',   label: `🚖 All Rides (${rides.length})` },
    { id: 'users',   label: `👤 Users (${users.length})` },
    { id: 'drivers', label: `🧑‍✈️ Drivers (${drivers.length})` },
    { id: 'ratings', label: `★ Driver Ratings` },
    { id: 'stats',   label: '📊 Stats' },
  ];

  const completedRides = rides.filter(r => r.status === 'COMPLETED');
  const pendingRides   = rides.filter(r => r.status === 'PENDING');
  const totalRevenue   = completedRides.reduce((s, r) => s + (r.finalFare || r.estimatedFare || 0), 0);

  // Rating leaderboard data
  const ratedDrivers = [...drivers].filter(d => d.totalRidesRated > 0);
  const sortedByRating = [...drivers].sort((a, b) => b.rollingAverageRating - a.rollingAverageRating);

  const filteredDriverRatings = sortedByRating.filter(d => {
    if (ratingFilter === 'HIGH')    return d.rollingAverageRating >= 4.0 && d.totalRidesRated > 0;
    if (ratingFilter === 'LOW')     return d.rollingAverageRating < 3.5  && d.totalRidesRated > 0;
    if (ratingFilter === 'WARNED')  return d.warningFlagged;
    return true; // ALL
  });

  const avgRating = ratedDrivers.length > 0
    ? ratedDrivers.reduce((s, d) => s + d.rollingAverageRating, 0) / ratedDrivers.length
    : 0;

  return (
    <>
      {msg && (
        <div className={`alert ${msg.startsWith('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 12 }}>
          {msg}
          <button onClick={() => setMsg('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Tab header */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: tab === t.id ? '1px solid var(--gold)' : '1px solid var(--border)', background: tab === t.id ? 'rgba(201,168,76,0.12)' : 'none', color: tab === t.id ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
        <button className="btn-secondary" onClick={fetchAll} disabled={loading} style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: 12 }}>
          {loading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '↻ Refresh'}
        </button>
      </div>

      {/* ── RIDES TAB ─────────────────────────────────────────────── */}
      {tab === 'rides' && (
        <div className="panel">
          <div className="panel-header">
            <h3>🚖 All Ride Requests</h3>
            <span className="badge">{rides.length} total</span>
          </div>
          <div className="panel-body">
            {rides.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                No ride requests yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {rides.map(r => {
                  const cfg = STATUS_CFG[r.status] || STATUS_CFG.PENDING;
                  const pickupLabel = r.pickupName || `${r.pickupLat?.toFixed(4)}, ${r.pickupLng?.toFixed(4)}`;
                  const dropLabel   = r.dropName   || `${r.dropLat?.toFixed(4)}, ${r.dropLng?.toFixed(4)}`;
                  const passengerLabel = r.passengerName ? `${r.passengerName} (#${r.passengerId})` : `#${r.passengerId}`;
                  return (
                    <div key={r.id} style={{ padding: '14px 16px', background: 'var(--bg-3)', borderRadius: 12, border: `1px solid ${cfg.bg}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{cfg.icon} Ride #{r.id}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            👤 {passengerLabel}
                            {r.driverId ? ` · 🧑‍✈️ Driver #${r.driverId}` : ' · No driver yet'}
                            · {r.vehicleType} · {new Date(r.requestTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            📍 {pickupLabel} → 🏁 {dropLabel}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 13 }}>₹{(r.finalFare || r.estimatedFare || 0).toFixed(0)}</span>
                          <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{r.status}</span>
                        </div>
                      </div>
                      {['PENDING', 'MATCHED', 'ACTIVE'].includes(r.status) && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          {r.status === 'PENDING' && (
                            <button onClick={() => updateRideStatus(r.id, 'CANCELLED')} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, border: '1px solid rgba(232,85,85,0.4)', background: 'rgba(232,85,85,0.08)', color: '#E85555', cursor: 'pointer' }}>Cancel</button>
                          )}
                          {r.status === 'MATCHED' && (
                            <button onClick={() => updateRideStatus(r.id, 'ACTIVE')} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, border: '1px solid rgba(91,147,232,0.4)', background: 'rgba(91,147,232,0.08)', color: '#5B93E8', cursor: 'pointer' }}>→ Active</button>
                          )}
                          {r.status === 'ACTIVE' && (
                            <button onClick={() => updateRideStatus(r.id, 'COMPLETED')} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, border: '1px solid rgba(76,175,130,0.4)', background: 'rgba(76,175,130,0.08)', color: '#4CAF82', cursor: 'pointer' }}>✓ Complete</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── USERS TAB ─────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="panel">
          <div className="panel-header">
            <h3>👤 All Users</h3>
            <span className="badge">{users.length} registered</span>
          </div>
          <div className="panel-body">
            {users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>No users.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {users.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-3)', borderRadius: 12, border: '1px solid var(--border)', opacity: u.active ? 1 : 0.6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{u.fullName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {u.email} · {u.role}
                        {u.driverId ? ` · Driver #${u.driverId}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: u.active ? 'rgba(76,175,130,0.12)' : 'rgba(232,85,85,0.12)', color: u.active ? '#4CAF82' : '#E85555' }}>
                        {u.active ? '● Active' : '● Inactive'}
                      </span>
                      <button onClick={() => toggleUser(u.id, u.active)} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)' }}>
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DRIVERS TAB ───────────────────────────────────────────── */}
      {tab === 'drivers' && (
        <div className="panel">
          <div className="panel-header">
            <h3>🧑‍✈️ All Drivers</h3>
            <span className="badge">{drivers.length} registered</span>
          </div>
          <div className="panel-body">
            {drivers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>No drivers. Add them in Driver Matching.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {drivers.map(d => (
                  <div key={d.id} style={{ padding: '14px 16px', background: 'var(--bg-3)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>🧑‍✈️ {d.driverName} <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 400 }}>(Driver ID #{d.id})</span></div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {d.vehicleType} · {d.vehicleNumber} · {d.zone} · {d.contactNumber}
                          {d.warningFlagged && <span style={{ color: '#E85555', fontWeight: 700 }}> · ⚠ Warned</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: d.status === 'AVAILABLE' ? 'rgba(76,175,130,0.12)' : 'rgba(201,168,76,0.12)', color: d.status === 'AVAILABLE' ? '#4CAF82' : '#C9A84C' }}>{d.status}</span>
                        <select defaultValue="" onChange={e => { if (e.target.value) updateDriverStatus(d.id, e.target.value); }} style={{ padding: '4px 8px', borderRadius: 7, fontSize: 11, border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--text-pri)', cursor: 'pointer' }}>
                          <option value="">Change…</option>
                          {['AVAILABLE', 'BUSY', 'OFFLINE'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Rating bar */}
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 5 }}>
                        RATING — {d.totalRidesRated} ride{d.totalRidesRated !== 1 ? 's' : ''} rated
                      </div>
                      {d.totalRidesRated > 0
                        ? <RatingBar value={d.rollingAverageRating} />
                        : <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No ratings yet</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DRIVER RATINGS TAB ────────────────────────────────────── */}
      {tab === 'ratings' && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total Drivers',   value: drivers.length,                           color: 'var(--gold)'  },
              { label: 'Rated Drivers',   value: ratedDrivers.length,                      color: '#5B93E8'       },
              { label: 'Platform Avg ★',  value: avgRating > 0 ? `★ ${avgRating.toFixed(2)}` : '—', color: '#C9A84C' },
              { label: 'Warned',          value: drivers.filter(d => d.warningFlagged).length, color: '#E85555'   },
            ].map(c => (
              <div key={c.label} className="stat-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '1.9rem', fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL',     label: '📋 All Drivers' },
              { id: 'HIGH',    label: '🏆 Top Rated (≥ 4.0)' },
              { id: 'LOW',     label: '⬇ Low Rated (< 3.5)' },
              { id: 'WARNED',  label: '⚠ Warned' },
            ].map(f => (
              <button key={f.id} onClick={() => setRatingFilter(f.id)} style={{ padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, border: ratingFilter === f.id ? '1px solid var(--gold)' : '1px solid var(--border)', background: ratingFilter === f.id ? 'rgba(201,168,76,0.12)' : 'none', color: ratingFilter === f.id ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer' }}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>★ Driver Rating Leaderboard</h3>
              <span className="badge">{filteredDriverRatings.length} drivers</span>
            </div>
            <div className="panel-body">
              {filteredDriverRatings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
                  No drivers match this filter.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {filteredDriverRatings.map((d, idx) => {
                    const rColor = d.rollingAverageRating >= 4 ? '#4CAF82' : d.rollingAverageRating >= 3 ? '#C9A84C' : '#E85555';
                    return (
                      <div key={d.id} style={{ padding: '16px', background: 'var(--bg-3)', borderRadius: 14, border: d.warningFlagged ? '1px solid rgba(232,85,85,0.35)' : '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Rank badge */}
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: idx === 0 ? 'rgba(201,168,76,0.2)' : idx === 1 ? 'rgba(180,180,180,0.15)' : idx === 2 ? 'rgba(176,106,52,0.15)' : 'var(--bg-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: idx === 0 ? '#C9A84C' : idx === 1 ? '#9e9e9e' : idx === 2 ? '#b06834' : 'var(--text-muted)' }}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>
                                {d.driverName}
                                {d.warningFlagged && <span style={{ marginLeft: 8, fontSize: 11, color: '#E85555', fontWeight: 700 }}>⚠ WARNED</span>}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                Driver ID #{d.id} · {d.vehicleType} · {d.zone}
                              </div>
                            </div>
                          </div>
                          {/* Big rating display */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 700, color: rColor, lineHeight: 1 }}>
                              {d.totalRidesRated > 0 ? d.rollingAverageRating?.toFixed(1) : '—'}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                              {d.totalRidesRated} ride{d.totalRidesRated !== 1 ? 's' : ''} rated
                            </div>
                          </div>
                        </div>
                        {/* Rating bar */}
                        {d.totalRidesRated > 0 && <RatingBar value={d.rollingAverageRating} />}
                        {/* Incentive / trip stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
                          {[
                            ['Trips Today',    d.tripsToday],
                            ['Trips This Week', d.tripsThisWeek],
                            ['Total Rated',    d.totalRidesRated],
                          ].map(([k, v]) => (
                            <div key={k} style={{ padding: '8px 10px', background: 'var(--bg-4)', borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-pri)' }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        {d.warningReason && (
                          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(232,85,85,0.08)', borderRadius: 8, fontSize: 12, color: '#E85555' }}>
                            ⚠ {d.warningReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── STATS TAB ─────────────────────────────────────────────── */}
      {tab === 'stats' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total Rides',      value: rides.length,          color: 'var(--gold)'  },
              { label: 'Pending',          value: pendingRides.length,   color: '#C9A84C'       },
              { label: 'Completed',        value: completedRides.length, color: '#4CAF82'       },
              { label: 'Total Revenue',    value: `₹${totalRevenue.toFixed(0)}`, color: 'var(--gold)' },
              { label: 'Total Users',      value: users.length,          color: '#5B93E8'       },
              { label: 'Total Drivers',    value: drivers.length,        color: '#C9A84C'       },
              { label: 'Available',        value: drivers.filter(d => d.status === 'AVAILABLE').length, color: '#4CAF82' },
              { label: 'Avg Rating',       value: avgRating > 0 ? `★ ${avgRating.toFixed(2)}` : '—', color: '#C9A84C' },
            ].map(c => (
              <div key={c.label} className="stat-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>{c.label}</div>
                <div style={{ fontFamily: 'Playfair Display', fontSize: '1.9rem', fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
