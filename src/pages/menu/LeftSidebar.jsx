import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../../context/LangContext';

const safeJSON = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };

const SBIcons = {
  Menu:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Cart:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Track:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>,
  Hist:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  Profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  Support: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  ChevL:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="15,18 9,12 15,6"/></svg>,
  ChevR:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="9,18 15,12 9,6"/></svg>,
};

export default function LeftSidebar({ cart, navigate, userData, onProfile }) {
  const location    = useLocation();
  const { t }       = useLang();
  const [collapsed, setCollapsed] = useState(false);

  const guestName = userData?.guestName || userData?.guest?.guest_name || userData?.name || 'Guest';
  const room      = userData?.guest?.guestRoomId || userData?.guest?.room || userData?.roomNumber || 'N/A';
  const loginTime = safeJSON(localStorage.getItem('sessionData'), {})?.loginTime;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal  = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax       = Math.round(subtotal * 0.118);

  const fmtLogin = ts => {
    if (!ts) return '—';
    const d = new Date(ts);
    const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const h = d.getHours(), m = d.getMinutes();
    return `${days[d.getDay()]}. ${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()} (${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'})`;
  };

  const nav = [
    { label: t('browse_menu'),   path: '/menu',         icon: SBIcons.Menu,    section: 'MENU' },
    { label: t('my_cart'),       path: '/cart',          icon: SBIcons.Cart,    badge: cartCount || null },
    { label: t('track_order'),   path: '/order-status',  icon: SBIcons.Track,   section: 'ORDERS', dot: true },
    { label: t('order_history'), path: '/history',       icon: SBIcons.Hist },
    { label: t('my_profile'),    path: 'PROFILE',        icon: SBIcons.Profile, section: 'ACCOUNT' },
    { label: t('support'),       path: null,             icon: SBIcons.Support },
  ];

  function handleNav(path) {
    if (path === 'PROFILE') { onProfile(); return; }
    if (!path) { alert('Support: +91 98765 43210'); return; }
    navigate(path);
  }

  return (
    <aside className={`lsb ${collapsed ? 'lsb--collapsed' : ''}`}>

      {/* Toggle button — outside inner so it's not clipped */}
      <button
        className="lsb__toggle"
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="lsb__toggle-icon">
          {collapsed ? SBIcons.ChevR : SBIcons.ChevL}
        </span>
      </button>

      {/* All content inside inner wrapper (clips text overflow during animation) */}
      <div className="lsb__inner">

        {/* Brand */}
        <div className="lsb__brand">
          <div className="lsb__brand-icon">🏨</div>
          <div className="lsb__brand-text">
            <div className="lsb__brand-name">HotelOGIX</div>
            <div className="lsb__brand-sub">ROOM DINING</div>
          </div>
        </div>

        {/* Guest chip */}
        <div className="lsb__guest">
          <div className="lsb__guest-av">{guestName.charAt(0).toUpperCase()}</div>
          <div className="lsb__guest-text">
            <div className="lsb__guest-name">{guestName}</div>
            <div className="lsb__guest-room">{t('room')} {room}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="lsb__nav">
          {nav.map(({ label, path, icon, badge, section, dot }) => {
            const active = path && path !== 'PROFILE' && location.pathname === path;
            return (
              <React.Fragment key={label}>
                {section && !collapsed && <div className="lsb__section">{section}</div>}
                <button
                  className={`lsb__item ${active ? 'lsb__item--active' : ''}`}
                  onClick={() => handleNav(path)}
                  title={collapsed ? label : ''}
                >
                  {active && <span className="lsb__bar" />}
                  <span className="lsb__icon">{icon}</span>
                  <span className="lsb__label">{label}</span>
                  {badge ? <span className="lsb__badge">{badge}</span> : null}
                  {dot && !badge ? <span className="lsb__dot" /> : null}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Last login */}
        <div className="lsb__last-login">
          <span className="lsb__ll-icon">{SBIcons.Refresh}</span>
          <div className="lsb__ll-text">
            <p className="lsb__ll-title">Last Login:</p>
            <p className="lsb__ll-time">{fmtLogin(loginTime)}</p>
          </div>
        </div>

        {/* Order summary */}
        <div className="lsb__summary">
          <div className="lsb__sum-row"><span>{t('items')}</span><span>{cartCount} {t('items')}</span></div>
          <div className="lsb__sum-row"><span>{t('subtotal')}</span><span>₹ {subtotal.toLocaleString('en-IN')}</span></div>
          <div className="lsb__sum-row lsb__sum-total">
            <span>{t('total')}</span>
            <span>₹ {(subtotal + tax).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button className="lsb__order-btn" onClick={() => navigate('/cart')} title={collapsed ? t('place_order') : ''}>
          <span className="lsb__order-icon">🛒</span>
          <span className="lsb__order-text">{t('place_order')} →</span>
        </button>

      </div>{/* end lsb__inner */}
    </aside>
  );
}