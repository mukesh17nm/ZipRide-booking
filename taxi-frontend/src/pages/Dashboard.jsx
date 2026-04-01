import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../services/ThemeContext';
import DriverPanel from '../components/DriverPanel';
import SurgePanel from '../components/SurgePanel';
import FarePanel from '../components/FarePanel';
import RatingPanel from '../components/RatingPanel';
import CancellationPanel from '../components/CancellationPanel';
import PromoPanel from '../components/PromoPanel';
import BookingPanel from '../components/BookingPanel';
import DriverNotificationPanel from '../components/DriverNotificationPanel';
import PassengerHistoryPanel from '../components/PassengerHistoryPanel';
import DriverHistoryPanel from '../components/DriverHistoryPanel';
import AdminPanel from '../components/AdminPanel';

// Each nav item specifies which roles can see it
const NAV = [
  { id: 'overview',       icon: '◈',  label: 'Overview',             roles: ['ADMIN', 'DRIVER', 'PASSENGER'] },
  { id: 'book',           icon: '🗺️', label: 'Book a Ride',          roles: ['PASSENGER'] },
  { id: 'my-history',     icon: '📋', label: 'My Rides',             roles: ['PASSENGER'] },
  { id: 'notifications',  icon: '🔔', label: 'Ride Requests',        roles: ['DRIVER'] },
  { id: 'driver-history', icon: '📊', label: 'My History',           roles: ['DRIVER'] },
  { id: 'admin',          icon: '🛡️', label: 'Admin Dashboard',      roles: ['ADMIN'] },
  { id: 'drivers',        icon: '🚖', label: 'Driver Matching',      roles: ['ADMIN', 'PASSENGER'] },
  { id: 'surge',          icon: '⚡', label: 'Surge Pricing',        roles: ['ADMIN', 'DRIVER'] },
  { id: 'fare',           icon: '₹',  label: 'Fare Calculator',      roles: ['ADMIN', 'PASSENGER'] },
  { id: 'rating',         icon: '★',  label: 'Ratings & Incentives', roles: ['ADMIN', 'PASSENGER'] },
  { id: 'cancel',         icon: '✕',  label: 'Cancellation',         roles: ['ADMIN', 'DRIVER', 'PASSENGER'] },
  { id: 'promo',          icon: '%',  label: 'Promo Codes',          roles: ['ADMIN', 'PASSENGER'] },
];

export default function Dashboard() {
  const navigate         = useNavigate();
  const { isDark, toggle } = useTheme();
  const [tab, setTab]    = useState('overview');
  const user             = JSON.parse(localStorage.getItem('zipride_user') || '{}');
  const role             = (user.role || 'PASSENGER').toUpperCase();

  const visibleNav = NAV.filter(n => n.roles.includes(role));

  const logout = () => { localStorage.removeItem('zipride_user'); navigate('/login'); };
  const initials = (user.fullName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon-sm">🚖</div>
            <span>Zip<em>Ride</em></span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-name">{user.fullName || 'Guest'}</div>
          <div className="user-role-tag" data-role={role}>{role}</div>
        </div>

        <nav className="sidebar-nav">
          {visibleNav.map(n => (
            <button key={n.id}
              className={`nav-item${tab === n.id ? ' active' : ''}`}
              onClick={() => setTab(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-theme-toggle">
            <span>{isDark ? '🌙 Dark' : '☀️ Light'}</span>
            <div className={'toggle-switch' + (isDark ? ' on' : '')} onClick={toggle}>
              <div className={'toggle-knob' + (isDark ? ' on' : '')}>{isDark ? '🌙' : '☀️'}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>↩ Sign Out</button>
        </div>
      </aside>

      <main className="dash-content">
        <div className="dash-topbar">
          <h2>{visibleNav.find(n => n.id === tab)?.label || 'Dashboard'}</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="topbar-tag" data-role={role}>{role}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{user.email}</span>
          </div>
        </div>

        <div className="dash-body">
          {tab === 'overview'       && <Overview setTab={setTab} user={user} role={role} />}
          {tab === 'book'           && <BookingPanel />}
          {tab === 'my-history'     && <PassengerHistoryPanel />}
          {tab === 'notifications'  && <DriverNotificationPanel />}
          {tab === 'driver-history' && <DriverHistoryPanel />}
          {tab === 'admin'          && <AdminPanel />}
          {tab === 'drivers'        && <DriverPanel />}
          {tab === 'surge'          && <SurgePanel />}
          {tab === 'fare'           && <FarePanel />}
          {tab === 'rating'         && <RatingPanel />}
          {tab === 'cancel'         && <CancellationPanel />}
          {tab === 'promo'          && <PromoPanel />}
        </div>
      </main>
    </div>
  );
}

// ── Role-specific feature descriptions ─────────────────────────────────────
const ROLE_FEATURES = {
  PASSENGER: [
    { id: 'book',       icon: '🗺️', title: 'Book a Ride',         desc: 'Tap on a live map to set pickup & drop. Get fare estimate then book. Drivers are notified instantly.',   tag: '✨ Live' },
    { id: 'my-history', icon: '📋', title: 'My Rides',             desc: 'See all your bookings — pending, waiting for driver, active and completed. Cancel rides from here.',     tag: '✨ Live' },
    { id: 'drivers',    icon: '🚖', title: 'Driver Matching',      desc: 'Find nearest available drivers. See distance, ETA and vehicle type.',                                    tag: 'Feature 1' },
    { id: 'fare',       icon: '₹',  title: 'Fare Calculator',      desc: 'Enter pickup & drop → instant fare estimate with promo code support.',                                   tag: 'Feature 3' },
    { id: 'rating',     icon: '★',  title: 'Ratings & Incentives', desc: 'Rate your driver. Rolling 10-trip average with incentive tracking.',                                     tag: 'Feature 4' },
    { id: 'cancel',     icon: '✕',  title: 'Cancellation',         desc: 'Cancel within 2-min free window or pay time-based penalty fee.',                                         tag: 'Feature 5' },
    { id: 'promo',      icon: '%',  title: 'Promo Codes',          desc: 'Apply SAVE20, FLAT50 and other discount codes to your fare.',                                            tag: 'Feature 6' },
  ],
  DRIVER: [
    { id: 'notifications',  icon: '🔔', title: 'Ride Requests',  desc: 'Every passenger booking is broadcast to all drivers. Accept within 30s to get the ride.',       tag: '✨ Live' },
    { id: 'driver-history', icon: '📊', title: 'My History',     desc: 'All your accepted & completed rides. Track daily earnings and start/complete active rides.',    tag: '✨ Live' },
    { id: 'surge',          icon: '⚡', title: 'Surge Pricing',  desc: 'View live supply-demand surge in your zone. Know when fares are higher.',                       tag: 'Feature 2' },
    { id: 'cancel',         icon: '✕',  title: 'Cancellation',   desc: 'Track cancellation history. Avoid flags that reduce your match priority.',                      tag: 'Feature 5' },
  ],
  ADMIN: [
    { id: 'admin',         icon: '🛡️', title: 'Admin Dashboard',      desc: 'Full control: manage all rides, users, and drivers. View system stats.',                    tag: '✨ New' },
    { id: 'notifications', icon: '🔔', title: 'All Ride Requests',     desc: 'Monitor all pending ride requests in real-time across the platform.',                      tag: '✨ Live' },
    { id: 'drivers',       icon: '🚖', title: 'Driver Matching',       desc: 'Register drivers, view all statuses, and run driver matching.',                            tag: 'Feature 1' },
    { id: 'surge',         icon: '⚡', title: 'Surge Pricing',         desc: 'Zone-level supply-demand surge control.',                                                  tag: 'Feature 2' },
    { id: 'fare',          icon: '₹',  title: 'Fare Calculator',       desc: 'Multi-stop fare with toll, night/peak surcharges.',                                        tag: 'Feature 3' },
    { id: 'rating',        icon: '★',  title: 'Ratings & Incentives',  desc: 'Driver rating engine with bonus payouts and warning flags.',                               tag: 'Feature 4' },
    { id: 'cancel',        icon: '✕',  title: 'Cancellation',          desc: 'Full cancellation analytics and penalty management.',                                       tag: 'Feature 5' },
    { id: 'promo',         icon: '%',  title: 'Promo Codes',           desc: 'Create, manage and view all promo codes.',                                                 tag: 'Feature 6' },
  ],
};

const ROLE_BADGE = {
  ADMIN:     { bg: 'rgba(232,85,85,0.15)',   color: '#F08080', border: 'rgba(232,85,85,0.3)',    desc: 'Full platform access' },
  DRIVER:    { bg: 'rgba(76,175,130,0.15)',  color: '#6DD4A8', border: 'rgba(76,175,130,0.3)',   desc: 'Accept rides & track earnings' },
  PASSENGER: { bg: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: 'rgba(201,168,76,0.3)',   desc: 'Book rides, fares, promos & ratings' },
};

function Overview({ setTab, user, role }) {
  const rb       = ROLE_BADGE[role] || ROLE_BADGE.PASSENGER;
  const features = ROLE_FEATURES[role] || ROLE_FEATURES.PASSENGER;

  return (
    <>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, marginBottom: 6 }}>
            Welcome, {user.fullName?.split(' ')[0] || 'there'} 👋
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>
          </p>
        </div>
        <div style={{ padding: '12px 20px', borderRadius: 14, background: rb.bg, border: `1px solid ${rb.border}` }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your Role</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Playfair Display', color: rb.color }}>{role}</div>
          <div style={{ fontSize: 12, marginTop: 2, color: rb.color, opacity: 0.8 }}>{rb.desc}</div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'Playfair Display', fontSize: 17, color: 'var(--text-secondary)', marginBottom: 4 }}>
          Your Features
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {role === 'ADMIN'     && 'Full platform access — manage rides, users, drivers and all 6 features.'}
          {role === 'DRIVER'    && 'Accept passenger ride requests, track your earnings and manage surge & cancellations.'}
          {role === 'PASSENGER' && 'Book rides, estimate fares, apply promos and rate your driver.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {features.map(f => (
          <div key={f.id} className="panel feature-card"
            style={{ cursor: 'pointer', marginBottom: 0 }}
            onClick={() => setTab(f.id)}>
            <div className="panel-header">
              <h3>{f.icon} {f.title}</h3>
              <span className="badge">{f.tag}</span>
            </div>
            <div className="panel-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.65 }}>{f.desc}</p>
              <div style={{ marginTop: 14, color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>Open →</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
