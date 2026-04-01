import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ZONES = ['ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D'];

export default function SurgePanel() {
  const [form,       setForm]       = useState({ zone: 'ZONE_A', baseFare: '150' });
  const [result,     setResult]     = useState(null);
  const [zoneMap,    setZoneMap]    = useState({});
  const [loading,    setLoading]    = useState(false);
  const [zoneLoad,   setZoneLoad]   = useState(false);

  useEffect(() => { fetchZoneMap(); }, []);

  const fetchZoneMap = async () => {
    setZoneLoad(true);
    try {
      const { data } = await api.get('/api/surge/by-zone');
      setZoneMap(data || {});
    } catch { setZoneMap({}); }
    setZoneLoad(false);
  };

  const compute = async e => {
    e.preventDefault(); setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/api/surge/compute', {
        zone:     form.zone,
        baseFare: parseFloat(form.baseFare),
      });
      setResult(data);
      fetchZoneMap();
    } catch (err) {
      setResult({ message: err.response?.data?.message || 'Error computing surge.' });
    } finally { setLoading(false); }
  };

  const surgeColor = m =>
    m >= 2.0 ? '#E85555' : m >= 1.5 ? '#C9A84C' : m > 1.0 ? '#E8C97A' : '#4CAF82';

  return (
    <>
      {/* Zone Surge Overview */}
      <div className="panel">
        <div className="panel-header">
          <h3>⚡ Live Surge by Zone</h3>
          <button className="btn-secondary" onClick={fetchZoneMap}
            style={{ padding: '5px 12px', fontSize: 12 }} disabled={zoneLoad}>
            {zoneLoad ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '↻ Refresh'}
          </button>
        </div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {ZONES.map(zone => {
              const mult = zoneMap[zone] ?? 1.0;
              const color = surgeColor(mult);
              return (
                <div key={zone} style={{
                  padding: '16px 12px', borderRadius: 14, textAlign: 'center',
                  background: `${color}15`, border: `1px solid ${color}40`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                    📍 {zone}
                  </div>
                  <div style={{ fontFamily: 'Playfair Display', fontSize: 28, fontWeight: 700, color }}>
                    {mult.toFixed(1)}×
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4, color }}>
                    {mult >= 2.0 ? '🔴 Very High' : mult >= 1.5 ? '🟠 High' : mult > 1.0 ? '🟡 Moderate' : '🟢 Normal'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compute Surge */}
      <div className="panel">
        <div className="panel-header">
          <h3>🔢 Compute Surge Price</h3>
          <span className="badge">POST /api/surge/compute</span>
        </div>
        <div className="panel-body">
          <form onSubmit={compute}>
            <div className="form-row">
              <div className="form-group">
                <label>Zone</label>
                <select value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>
                  {ZONES.map(z => <option key={z}>{z}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Base Fare (₹)</label>
                <input type="number" min="1" value={form.baseFare}
                  onChange={e => setForm({ ...form, baseFare: e.target.value })} />
              </div>
            </div>
            <button className="btn-action" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Computing…</> : '⚡ Compute Surge'}
            </button>
          </form>

          {result && (
            <div className="result-card" style={{ marginTop: 16 }}>
              {result.message && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{result.message}</div>
              )}
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  ['Zone', result.zone],
                  ['Active Requests', result.activeRequestCount],
                  ['Available Drivers', result.availableDriverCount],
                  ['Supply-Demand Ratio', result.supplyDemandRatio?.toFixed(3)],
                  ['Surge Multiplier', `${result.surgeMultiplier?.toFixed(2)}×`],
                  ['Base Fare', `₹${result.baseFare?.toFixed(2)}`],
                  ['Surged Fare', `₹${result.surgedFare?.toFixed(2)}`],
                ].filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => (
                  <div key={k} className="result-row">
                    <span className="rk">{k}</span>
                    <span className="rv highlight">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
