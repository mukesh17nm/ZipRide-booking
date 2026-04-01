import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function PromoPanel() {
  const user    = JSON.parse(localStorage.getItem('zipride_user') || '{}');
  const role    = (user.role || 'PASSENGER').toUpperCase();
  const isAdmin = role === 'ADMIN';

  const now = new Date();
  const formatDT = d => d.toISOString().slice(0, 16);
  const oneMonth = new Date(now); oneMonth.setMonth(oneMonth.getMonth() + 1);

  const [createForm, setCreateForm] = useState({
    code: '', description: '', discountType: 'PERCENTAGE', discountValue: '20',
    maxDiscountAmount: '100', minFareRequired: '50', maxUsageCount: '100',
    validFrom: formatDT(now), validUntil: formatDT(oneMonth), status: 'ACTIVE'
  });
  const [applyForm,    setApplyForm]    = useState({ promoCode: '', passengerId: String(user.id || 1), originalFare: '200' });
  const [createResult, setCreateResult] = useState(null);
  const [applyResult,  setApplyResult]  = useState(null);
  const [allPromos,    setAllPromos]    = useState(null);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    // Auto-load active promos for passengers
    if (!isAdmin) fetchActive();
  }, []);

  const createPromo = async e => {
    e.preventDefault(); setCreateResult(null);
    try {
      const payload = {
        code:              createForm.code.toUpperCase(),
        description:       createForm.description,
        discountType:      createForm.discountType,
        discountValue:     parseFloat(createForm.discountValue),
        minFareRequired:   parseFloat(createForm.minFareRequired),
        maxUsageCount:     parseInt(createForm.maxUsageCount),
        validFrom:         createForm.validFrom + ':00',
        validUntil:        createForm.validUntil + ':00',
        status:            createForm.status,
      };
      if (createForm.discountType === 'PERCENTAGE') {
        payload.maxDiscountAmount = parseFloat(createForm.maxDiscountAmount);
      }
      const { data } = await api.post('/api/promo/create', payload);
      setCreateResult({ success: true, data });
      fetchAll();
    } catch (err) {
      setCreateResult({ success: false, message: err.response?.data?.message || 'Error creating promo.' });
    }
  };

  const applyPromo = async e => {
    e.preventDefault(); setLoading(true); setApplyResult(null);
    try {
      const { data } = await api.post('/api/promo/apply', {
        promoCode:    applyForm.promoCode.trim().toUpperCase(),
        passengerId:  parseInt(applyForm.passengerId),
        originalFare: parseFloat(applyForm.originalFare),
      });
      setApplyResult(data);
    } catch (err) {
      setApplyResult({ valid: false, message: err.response?.data?.message || 'Invalid promo code.' });
    } finally { setLoading(false); }
  };

  const fetchAll    = async () => {
    try { const { data } = await api.get('/api/promo/all');    setAllPromos(Array.isArray(data) ? data : []); } catch {}
  };
  const fetchActive = async () => {
    try { const { data } = await api.get('/api/promo/active'); setAllPromos(Array.isArray(data) ? data : []); } catch {}
  };

  return (
    <>
      {/* ── ADMIN: Create Promo ──────────────────────────────────── */}
      {isAdmin && (
        <div className="panel">
          <div className="panel-header">
            <h3>🎟 Create Promo Code</h3>
            <span className="badge">ADMIN · POST /api/promo/create</span>
          </div>
          <div className="panel-body">
            {createResult && (
              <div className={`alert ${createResult.success ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 14 }}>
                {createResult.success
                  ? `✓ Promo "${createResult.data.code}" created successfully!`
                  : `✗ ${createResult.message}`}
              </div>
            )}
            <form onSubmit={createPromo}>
              <div className="form-row">
                <div className="form-group">
                  <label>Promo Code *</label>
                  <input required placeholder="SAVE20" value={createForm.code}
                    onChange={e => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input placeholder="20% off your ride" value={createForm.description}
                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type</label>
                  <select value={createForm.discountType}
                    onChange={e => setCreateForm({ ...createForm, discountType: e.target.value })}>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input required type="number" min="0" placeholder="20" value={createForm.discountValue}
                    onChange={e => setCreateForm({ ...createForm, discountValue: e.target.value })} />
                </div>
                {createForm.discountType === 'PERCENTAGE' && (
                  <div className="form-group">
                    <label>Max Cap (₹)</label>
                    <input type="number" min="0" placeholder="100" value={createForm.maxDiscountAmount}
                      onChange={e => setCreateForm({ ...createForm, maxDiscountAmount: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Min Fare (₹)</label>
                  <input type="number" min="0" placeholder="50" value={createForm.minFareRequired}
                    onChange={e => setCreateForm({ ...createForm, minFareRequired: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Max Usage</label>
                  <input type="number" min="1" placeholder="100" value={createForm.maxUsageCount}
                    onChange={e => setCreateForm({ ...createForm, maxUsageCount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={createForm.status} onChange={e => setCreateForm({ ...createForm, status: e.target.value })}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Valid From</label>
                  <input type="datetime-local" value={createForm.validFrom}
                    onChange={e => setCreateForm({ ...createForm, validFrom: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Valid Until</label>
                  <input type="datetime-local" value={createForm.validUntil}
                    onChange={e => setCreateForm({ ...createForm, validUntil: e.target.value })} />
                </div>
              </div>
              <button className="btn-action" type="submit">+ Create Promo Code</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Apply Promo ──────────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>✅ Apply Promo Code</h3>
          <span className="badge">POST /api/promo/apply</span>
        </div>
        <div className="panel-body">
          <form onSubmit={applyPromo}>
            <div className="form-row">
              <div className="form-group">
                <label>Promo Code *</label>
                <input required placeholder="SAVE20" value={applyForm.promoCode}
                  onChange={e => setApplyForm({ ...applyForm, promoCode: e.target.value.toUpperCase() })} />
              </div>
              <div className="form-group">
                <label>Original Fare (₹)</label>
                <input required type="number" min="0" placeholder="200" value={applyForm.originalFare}
                  onChange={e => setApplyForm({ ...applyForm, originalFare: e.target.value })} />
              </div>
            </div>
            <button className="btn-action" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Applying…</> : '✅ Apply Promo'}
            </button>
          </form>

          {applyResult && (
            <div className="result-card" style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, marginBottom: 10, color: applyResult.valid ? '#4CAF82' : '#E85555' }}>
                {applyResult.valid ? `✓ ${applyResult.message}` : `✗ ${applyResult.message}`}
              </div>
              {applyResult.valid && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div className="result-row">
                    <span className="rk">Original Fare</span>
                    <span className="rv">₹{applyResult.originalFare?.toFixed(2)}</span>
                  </div>
                  <div className="result-row">
                    <span className="rk">Discount Saved</span>
                    <span className="rv success">−₹{applyResult.discountAmount?.toFixed(2)}</span>
                  </div>
                  <div className="result-row">
                    <span className="rk">Final Fare</span>
                    <span className="rv highlight" style={{ fontSize: 16 }}>₹{applyResult.finalFare?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── All Promo Codes ──────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-header">
          <h3>📋 {isAdmin ? 'All Promo Codes' : 'Available Promos'}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={fetchActive} style={{ padding: '5px 12px', fontSize: 11 }}>
              Active
            </button>
            {isAdmin && (
              <button className="btn-secondary" onClick={fetchAll} style={{ padding: '5px 12px', fontSize: 11 }}>
                All
              </button>
            )}
          </div>
        </div>
        <div className="panel-body">
          {allPromos === null ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              Click "Active" to load promo codes.
            </div>
          ) : allPromos.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
              No promo codes found.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {allPromos.map(p => (
                <div key={p.id} style={{
                  padding: '14px 16px', background: 'var(--bg-3)',
                  borderRadius: 12, border: p.status === 'ACTIVE' ? '1px solid rgba(76,175,130,0.3)' : '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 16 }}>{p.code}</div>
                    <span style={{
                      padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: p.status === 'ACTIVE' ? 'rgba(76,175,130,0.15)' : 'var(--bg-4)',
                      color: p.status === 'ACTIVE' ? '#4CAF82' : 'var(--text-muted)',
                    }}>
                      {p.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{p.description}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
                      {p.discountType === 'PERCENTAGE' ? `${p.discountValue}% off` : `₹${p.discountValue} off`}
                      {p.maxDiscountAmount ? ` (max ₹${p.maxDiscountAmount})` : ''}
                    </span>
                    <span>Min ₹{p.minFareRequired}</span>
                    <span>Used: {p.usageCount || 0}/{p.maxUsageCount}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Valid: {new Date(p.validFrom).toLocaleDateString()} – {new Date(p.validUntil).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
