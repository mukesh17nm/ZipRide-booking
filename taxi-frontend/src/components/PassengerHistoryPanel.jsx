import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const STATUS_CFG = {
  PENDING:   { color: '#C9A84C', bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.30)',  icon: '⏳', label: 'Waiting for Driver' },
  MATCHED:   { color: '#4CAF82', bg: 'rgba(76,175,130,0.12)',  border: 'rgba(76,175,130,0.30)',  icon: '🚖', label: 'Driver Assigned'    },
  ACTIVE:    { color: '#5B93E8', bg: 'rgba(91,147,232,0.12)',  border: 'rgba(91,147,232,0.30)',  icon: '🛣️', label: 'Ride in Progress'   },
  COMPLETED: { color: '#4CAF82', bg: 'rgba(76,175,130,0.08)',  border: 'rgba(76,175,130,0.20)',  icon: '✅', label: 'Completed'          },
  CANCELLED: { color: '#E85555', bg: 'rgba(232,85,85,0.08)',   border: 'rgba(232,85,85,0.20)',   icon: '✕',  label: 'Cancelled'          },
};

const VEHICLE_ICON = { AUTO: '🛺', MINI: '🚗', SEDAN: '🚘', SUV: '🚙', LUXURY: '🏎️' };

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {c.icon} {c.label}
    </span>
  );
}

function PulsingDot({ color }) {
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 6, boxShadow: `0 0 0 0 ${color}`, animation: 'pulse-ring 1.5s infinite' }} />
  );
}

function WaitingAnimation() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', marginTop: 10 }}>
      <PulsingDot color="#C9A84C" />
      <span style={{ fontSize: 12, color: '#C9A84C', fontWeight: 600 }}>Broadcasting to all drivers{dots}</span>
    </div>
  );
}

// ── Inline Rating Widget ──────────────────────────────────────────────────────
function RatingWidget({ ride, passengerId, onRated }) {
  const [rating,    setRating]    = useState(5);
  const [comment,   setComment]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result,    setResult]    = useState(null);

  if (submitted) {
    return (
      <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(76,175,130,0.1)', borderRadius: 12, border: '1px solid rgba(76,175,130,0.3)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4CAF82', marginBottom: 4 }}>✅ Rating Submitted!</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          You gave Driver #{ride.driverId} ★ {rating} / 5
          {result?.newRollingAverageRating !== undefined && (
            <> · New avg: ★ {result.newRollingAverageRating?.toFixed(2)}</>
          )}
        </div>
      </div>
    );
  }

  const submitRating = async () => {
    if (!ride.driverId) { alert('No driver assigned to rate.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/api/ratings/submit', {
        driverId:      parseInt(ride.driverId),
        rideRequestId: parseInt(ride.id),
        passengerId:   parseInt(passengerId),
        rating:        parseFloat(rating),
        comment,
      });
      setResult(data);
      setSubmitted(true);
      onRated?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting rating.');
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 14, padding: '14px', background: 'var(--bg-4)', borderRadius: 12, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sec)', marginBottom: 10 }}>
        ★ Rate Driver #{ride.driverId} for this ride
      </div>

      {/* Star selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s} onClick={() => setRating(s)} style={{ fontSize: 28, cursor: 'pointer', color: s <= rating ? '#C9A84C' : 'var(--border)', transition: 'color 0.15s' }}>★</span>
        ))}
        <span style={{ alignSelf: 'center', fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginLeft: 6 }}>{rating}/5</span>
      </div>

      {/* Comment */}
      <input
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Leave a comment (optional)…"
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--text-pri)', fontSize: 12, marginBottom: 10, boxSizing: 'border-box' }}
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={submitRating}
          disabled={loading}
          style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#C9A84C,#a07830)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Submitting…' : '⭐ Submit Rating'}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ride #{ride.id} · Driver #{ride.driverId}</span>
      </div>
    </div>
  );
}

function RideCard({ ride, passengerId, onCancel, cancelling }) {
  const cfg       = STATUS_CFG[ride.status] || STATUS_CFG.PENDING;
  const isPending = ride.status === 'PENDING';
  const isActive  = ['PENDING', 'MATCHED', 'ACTIVE'].includes(ride.status);
  const isCompleted = ride.status === 'COMPLETED';
  const [showRating, setShowRating] = useState(false);
  const [rated,      setRated]      = useState(false);

  const distKm = Math.sqrt(
    Math.pow((ride.dropLat - ride.pickupLat) * 111, 2) +
    Math.pow((ride.dropLng - ride.pickupLng) * 111 * Math.cos(ride.pickupLat * Math.PI / 180), 2)
  ).toFixed(1);

  const pickupDisplay = ride.pickupName || `${ride.pickupLat?.toFixed(4)}, ${ride.pickupLng?.toFixed(4)}`;
  const dropDisplay   = ride.dropName   || `${ride.dropLat?.toFixed(4)}, ${ride.dropLng?.toFixed(4)}`;

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${cfg.border}`, background: 'var(--bg-3)', transition: 'box-shadow 0.2s', boxShadow: isActive ? `0 0 0 1px ${cfg.border}` : 'none' }}>
      <div style={{ height: 3, background: cfg.color, opacity: isPending ? undefined : 0.7 }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
              {new Date(ride.requestTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: 16, fontWeight: 700, color: 'var(--text-pri)' }}>
              {VEHICLE_ICON[ride.vehicleType] || '🚖'} Ride #{ride.id}
            </div>
          </div>
          <StatusBadge status={ride.status} />
        </div>

        {isPending && <WaitingAnimation />}

        {/* Route with place names */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '14px 0', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 7, top: 18, bottom: 18, width: 2, background: 'var(--border)', borderRadius: 2 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#4CAF82', flexShrink: 0, zIndex: 1, border: '2px solid var(--bg-3)' }} />
            <div style={{ fontSize: 12, color: 'var(--text-sec)', wordBreak: 'break-word' }}>
              <span style={{ fontWeight: 600 }}>Pickup: </span>{pickupDisplay}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: '#E85555', flexShrink: 0, zIndex: 1, border: '2px solid var(--bg-3)' }} />
            <div style={{ fontSize: 12, color: 'var(--text-sec)', wordBreak: 'break-word' }}>
              <span style={{ fontWeight: 600 }}>Drop: </span>{dropDisplay}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
          {[
            ['🚗 Vehicle', ride.vehicleType || '—'],
            ['📏 Distance', `~${distKm} km`],
            ['💰 Fare',    ride.estimatedFare ? `₹${ride.estimatedFare.toFixed(2)}` : '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: '8px 10px', background: 'var(--bg-4)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-pri)' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Driver info if matched */}
        {ride.driverId && ride.status !== 'CANCELLED' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(76,175,130,0.08)', borderRadius: 10, border: '1px solid rgba(76,175,130,0.2)', marginBottom: 14 }}>
            <span style={{ fontSize: 22 }}>🧑‍✈️</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginBottom: 1 }}>DRIVER ASSIGNED</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-pri)' }}>Driver ID #{ride.driverId}</div>
            </div>
          </div>
        )}

        {/* Final fare if completed */}
        {isCompleted && ride.finalFare && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(76,175,130,0.08)', borderRadius: 10, border: '1px solid rgba(76,175,130,0.2)', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)' }}>Final Fare Paid</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#4CAF82' }}>₹{ride.finalFare.toFixed(2)}</span>
          </div>
        )}

        {/* ── Rating section for completed rides ─────────────────────── */}
        {isCompleted && ride.driverId && (
          <div style={{ marginTop: 4 }}>
            {!showRating && !rated ? (
              <button
                onClick={() => setShowRating(true)}
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(201,168,76,0.5)', background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s' }}
                onMouseEnter={e => e.target.style.background = 'rgba(201,168,76,0.18)'}
                onMouseLeave={e => e.target.style.background = 'rgba(201,168,76,0.08)'}>
                ★ Rate this Ride
              </button>
            ) : (
              <RatingWidget ride={ride} passengerId={passengerId} onRated={() => { setRated(true); setShowRating(false); }} />
            )}
          </div>
        )}

        {/* Cancel button */}
        {isActive && ride.status !== 'ACTIVE' && (
          <button
            onClick={() => onCancel(ride.id)}
            disabled={cancelling === ride.id}
            style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(232,85,85,0.4)', background: cancelling === ride.id ? 'rgba(232,85,85,0.08)' : 'none', color: '#E85555', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s', marginTop: 10 }}
            onMouseEnter={e => e.target.style.background = 'rgba(232,85,85,0.12)'}
            onMouseLeave={e => e.target.style.background = cancelling === ride.id ? 'rgba(232,85,85,0.08)' : 'none'}>
            {cancelling === ride.id ? '⏳ Cancelling…' : '✕ Cancel Ride'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PassengerHistoryPanel() {
  const user       = JSON.parse(localStorage.getItem('zipride_user') || '{}');
  const passId     = user.passengerId || user.id || 1;

  const [rides,      setRides]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [filter,     setFilter]     = useState('ALL');
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollRef      = useRef(null);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/fare/rides');
      const all  = Array.isArray(data) ? data : [];
      const mine = all.filter(r => String(r.passengerId) === String(passId));
      mine.sort((a, b) => new Date(b.requestTime) - new Date(a.requestTime));
      setRides(mine);
      setLastUpdate(new Date());
    } catch {
      setRides([]);
    }
    setLoading(false);
  }, [passId]);

  useEffect(() => {
    fetchRides();
    pollRef.current = setInterval(fetchRides, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchRides]);

  const cancelRide = async (rideId) => {
    setCancelling(rideId);
    try {
      await api.patch(`/api/fare/rides/${rideId}/status?status=CANCELLED`);
    } catch {}
    setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'CANCELLED' } : r));
    setCancelling(null);
  };

  const filtered = filter === 'ALL' ? rides : rides.filter(r => r.status === filter);

  const counts = {
    ALL:       rides.length,
    PENDING:   rides.filter(r => r.status === 'PENDING').length,
    MATCHED:   rides.filter(r => r.status === 'MATCHED').length,
    ACTIVE:    rides.filter(r => r.status === 'ACTIVE').length,
    COMPLETED: rides.filter(r => r.status === 'COMPLETED').length,
    CANCELLED: rides.filter(r => r.status === 'CANCELLED').length,
  };

  const totalSpent = rides.filter(r => r.status === 'COMPLETED').reduce((s, r) => s + (r.finalFare || r.estimatedFare || 0), 0);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Rides',  value: rides.length,    color: 'var(--gold)' },
          { label: 'Completed',    value: counts.COMPLETED, color: '#4CAF82'    },
          { label: 'Pending',      value: counts.PENDING,   color: '#C9A84C'    },
          { label: 'Total Spent',  value: `₹${totalSpent.toFixed(0)}`, color: '#5B93E8' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontFamily: 'Playfair Display', fontSize: '1.8rem', fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>📋 My Ride History</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading && <span className="spinner" style={{ width: 13, height: 13 }} />}
            {lastUpdate && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Updated {lastUpdate.toLocaleTimeString()}</span>}
            <button className="btn-secondary" onClick={fetchRides} style={{ padding: '5px 10px', fontSize: 11 }}>↻</button>
          </div>
        </div>
        <div className="panel-body">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {['ALL', 'PENDING', 'MATCHED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(s => {
              const cfg = STATUS_CFG[s];
              const isAct = filter === s;
              return (
                <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: isAct ? `1px solid ${cfg?.color || 'var(--gold)'}` : '1px solid var(--border)', background: isAct ? (cfg?.bg || 'rgba(201,168,76,0.12)') : 'none', color: isAct ? (cfg?.color || 'var(--gold)') : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {s === 'ALL' ? 'All' : (cfg?.icon + ' ' + s)} {counts[s] > 0 && `(${counts[s]})`}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🚖</div>
              <div style={{ fontSize: 14 }}>{filter === 'ALL' ? 'No rides yet. Book your first ride!' : `No ${filter.toLowerCase()} rides.`}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {filtered.map(ride => (
                <RideCard key={ride.id} ride={ride} passengerId={passId} onCancel={cancelRide} cancelling={cancelling} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(201,168,76,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(201,168,76,0); }
          100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }
        }
      `}</style>
    </>
  );
}
