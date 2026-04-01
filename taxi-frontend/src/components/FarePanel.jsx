import React, { useState } from 'react';
import api from '../services/api';

const VEHICLE_TYPES = ['AUTO', 'MINI', 'SEDAN', 'SUV', 'LUXURY'];
const ZONES         = ['ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D'];

const emptyStop = () => ({ latitude: '', longitude: '', stopName: '' });

export default function FarePanel() {
  const [stops,       setStops]       = useState([emptyStop(), emptyStop()]);
  const [vehicleType, setVehicleType] = useState('SEDAN');
  const [surgeM,      setSurgeM]      = useState('1.0');
  const [promoCode,   setPromoCode]   = useState('');
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);

  const updateStop = (i, field, val) =>
    setStops(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const addStop = () => setStops(prev => [...prev, emptyStop()]);
  const removeStop = i => setStops(prev => prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev);

  const estimate = async e => {
    e.preventDefault(); setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/api/fare/estimate', {
        stops: stops.map(s => ({
          latitude:  parseFloat(s.latitude),
          longitude: parseFloat(s.longitude),
          stopName:  s.stopName || `Stop ${stops.indexOf(s) + 1}`,
        })),
        vehicleType,
        surgeMultiplier: parseFloat(surgeM) || 1.0,
        promoCode: promoCode.trim() || null,
      });
      setResult(data);
    } catch (err) {
      setResult({ message: err.response?.data?.message || 'Error estimating fare. Check all fields.' });
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <h3>₹ Fare Calculator</h3>
          <span className="badge">POST /api/fare/estimate</span>
        </div>
        <div className="panel-body">
          <form onSubmit={estimate}>
            {/* Stops */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  📍 Route Stops
                </label>
                <button type="button" className="btn-secondary" onClick={addStop}
                  style={{ padding: '4px 10px', fontSize: 11 }}>+ Add Stop</button>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {stops.map((stop, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 12, border: '1px solid var(--border)', position: 'relative' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#4CAF82' : i === stops.length - 1 ? '#E85555' : 'var(--gold)', marginBottom: 8, textTransform: 'uppercase' }}>
                      {i === 0 ? '📍 Pickup' : i === stops.length - 1 ? '🏁 Drop' : `📌 Stop ${i + 1}`}
                    </div>
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group">
                        <label>Stop Name</label>
                        <input placeholder="White Town, Puducherry" value={stop.stopName}
                          onChange={e => updateStop(i, 'stopName', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Latitude</label>
                        <input required type="number" step="any" placeholder="11.9416"
                          value={stop.latitude} onChange={e => updateStop(i, 'latitude', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Longitude</label>
                        <input required type="number" step="any" placeholder="79.8083"
                          value={stop.longitude} onChange={e => updateStop(i, 'longitude', e.target.value)} />
                      </div>
                    </div>
                    {stops.length > 2 && i !== 0 && i !== stops.length - 1 && (
                      <button type="button" onClick={() => removeStop(i)} style={{
                        position: 'absolute', top: 8, right: 10,
                        background: 'none', border: 'none', color: '#E85555',
                        cursor: 'pointer', fontSize: 14, fontWeight: 700,
                      }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="form-row">
              <div className="form-group">
                <label>Vehicle Type</label>
                <select value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                  {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>⚡ Surge Multiplier</label>
                <input type="number" step="0.1" min="1" max="3.5" value={surgeM}
                  onChange={e => setSurgeM(e.target.value)} />
              </div>
              <div className="form-group">
                <label>🎟 Promo Code</label>
                <input placeholder="SAVE20 (optional)" value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())} />
              </div>
            </div>

            <button className="btn-action" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? <><span className="spinner" /> Calculating…</> : '💰 Estimate Fare'}
            </button>
          </form>

          {result && (
            <div className="result-card" style={{ marginTop: 18 }}>
              {result.message && !result.totalFare && (
                <div className="alert alert-error">{result.message}</div>
              )}
              {result.totalFare !== undefined && (
                <>
                  {result.message && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{result.message}</div>
                  )}
                  <div style={{ display: 'grid', gap: 8 }}>
                    {[
                      ['📏 Total Distance', `${result.totalDistanceKm?.toFixed(2)} km`],
                      ['⏱ Est. Duration',   `${result.estimatedMinutes} min`],
                      ['Base Fare',          `₹${result.baseFare?.toFixed(2)}`],
                      ['Distance Fare',      `₹${result.distanceFare?.toFixed(2)}`],
                      ['Time Fare',          `₹${result.timeFare?.toFixed(2)}`],
                      result.nightSurcharge > 0 && ['🌙 Night Surcharge', `₹${result.nightSurcharge?.toFixed(2)}`],
                      result.peakHourSurcharge > 0 && ['⏰ Peak Surcharge', `₹${result.peakHourSurcharge?.toFixed(2)}`],
                      result.tollCharges > 0 && ['🛣 Toll Charges', `₹${result.tollCharges?.toFixed(2)}`],
                      ['🚗 Vehicle Multiplier', `${result.vehicleMultiplierApplied}×`],
                      result.surgeMultiplierApplied > 1 && ['⚡ Surge', `${result.surgeMultiplierApplied}×`],
                      result.discountAmount > 0 && ['🎟 Promo Discount', `-₹${result.discountAmount?.toFixed(2)}`],
                    ].filter(Boolean).map(([k, v]) => (
                      <div className="result-row" key={k}>
                        <span className="rk">{k}</span>
                        <span className={`rv ${k.includes('Discount') ? 'success' : ''}`}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, padding: '12px 16px', background: 'rgba(201,168,76,0.12)', borderRadius: 10, border: '1px solid rgba(201,168,76,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Total Fare</span>
                      <span style={{ fontFamily: 'Playfair Display', fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>
                        ₹{result.totalFare?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
