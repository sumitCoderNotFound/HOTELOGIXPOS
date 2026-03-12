import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE from '../../config';
import ThemeLangBar from '../../components/ThemeLangBar';
import { useLang } from '../../context/LangContext';
import { useTheme } from '../../context/ThemeContext';
import './Menu.css';

/* ─── helpers ──────────────────────────────────────────────── */
const safeJSON = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };
const getCurrency = () => { try { const u = safeJSON(localStorage.getItem('userData'),{}); return u?.guest?.currency_symbol||u?.currency_symbol||'₹'; } catch { return '₹'; }};
const getCartRaw  = () => { for(const k of ['cartData','CartData','cart']){const r=localStorage.getItem(k)?.trim(); if(r&&r!=='null'){const p=safeJSON(r,[]); if(Array.isArray(p)) return p;}} return []; };
const saveCart    = arr => localStorage.setItem('cartData', JSON.stringify(arr));
const authFetch   = (url, opts={}) => { const t=safeJSON(localStorage.getItem('userData'),{}).token; if(!t) throw new Error('No authentication token found'); return fetch(url,{...opts,headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`,...(opts.headers||{})}}); };

/* ─── Clock ─────────────────────────────────────────────────── */
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div className="clock-pill">
      <span className="clock-time">{now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}</span>
      <span className="clock-date">{days[now.getDay()]} {now.getDate()} {months[now.getMonth()]}</span>
    </div>
  );
}

/* ─── Nutrient chips ─────────────────────────────────────────── */
const NUTRI = [
  { key:'calories', keys:['calories','calorie','kcal'],                          emoji:'🔥', label:'cal',    bg:'#fef9c3', border:'#fde047', text:'#92400e' },
  { key:'protein',  keys:['protein_g','protein','proteins'],                     emoji:'💪', label:'protein',bg:'#dcfce7', border:'#86efac', text:'#166534' },
  { key:'carbs',    keys:['carbs_g','carbs','carbohydrates','carb'],             emoji:'🍞', label:'carbs',  bg:'#ffedd5', border:'#fdba74', text:'#9a3412' },
  { key:'fat',      keys:['fat_g','fat','fats','total_fat'],                     emoji:'🥑', label:'fat',    bg:'#f3e8ff', border:'#d8b4fe', text:'#6b21a8' },
  { key:'fiber',    keys:['fiber_g','fiber','dietary_fiber'],                    emoji:'🌿', label:'fiber',  bg:'#dcfce7', border:'#4ade80', text:'#14532d' },
  { key:'sodium',   keys:['sodium_mg','sodium'],                                 emoji:'🧂', label:'Na',     bg:'#e0f2fe', border:'#7dd3fc', text:'#0c4a6e' },
  { key:'sugar',    keys:['sugar_g','sugar'],                                    emoji:'🍬', label:'sugar',  bg:'#ffe4e6', border:'#fda4af', text:'#9f1239' },
];

// Gets nutrient value — checks top-level AND nested nutrition{} object
// Also strips trailing 'g'/'mg' from string values like "25g"
const getNV = (item, n) => {
  const src = [item, item?.nutrition, item?.nutritional_info, item?.nutrients].filter(Boolean);
  for (const obj of src) {
    for (const k of n.keys) {
      if (obj[k] != null) {
        const raw = obj[k];
        // Parse "25g" → 25, "500" → 500
        const num = typeof raw === 'string' ? parseFloat(raw) : raw;
        return isNaN(num) ? raw : num;
      }
    }
  }
  return null;
};

// Format display value — don't add 'g' if already a whole number for calories
const fmtNV = (val, label) => {
  if (val == null) return '';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (label === 'cal') return isNaN(num) ? val : Math.round(num);
  if (label === 'Na')  return isNaN(num) ? val : `${Math.round(num)}mg`;
  return isNaN(num) ? val : `${num}g`;
};

function NutriPills({ item, animate }) {
  const visible = NUTRI.filter(n => getNV(item,n) != null);
  if (!visible.length) return null;
  return (
    <div className={`nutri-row${animate?' nutri-row--anim':''}`}>
      {visible.map((n, i) => {
        const val = getNV(item, n);
        return (
          <div key={n.key} className="nutri-pill"
            style={{ background:n.bg, borderColor:n.border, animationDelay:`${i*55}ms` }}>
            <span>{n.emoji}</span>
            <span className="np__val" style={{color:n.text}}>{fmtNV(val, n.label)}</span>
            <span className="np__lbl" style={{color:n.text}}>{n.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Left Sidebar ───────────────────────────────────────────── */
const SBIcons = {
  Menu:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Cart:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Track:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>,
  Hist:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  Profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  Support: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

function LeftSidebar({ cart, navigate, t, userData, onProfile, isOpen, onToggle }) {
  const location  = useLocation();
  const guestName = userData?.guestName || userData?.guest?.guest_name || userData?.name || 'Guest';
  const room      = userData?.guest?.guestRoomId || userData?.guest?.room || userData?.roomNumber || 'N/A';
  const loginTime = safeJSON(localStorage.getItem('sessionData'),{})?.loginTime;
  const cartCount = cart.reduce((s,i) => s+i.quantity, 0);
  const subtotal  = cart.reduce((s,i) => s+i.price*i.quantity, 0);
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
    { label: t('browse_menu'),   path:'/menu',         icon: SBIcons.Menu,    section: 'MENU' },
    { label: t('my_cart'),       path:'/cart',          icon: SBIcons.Cart,    badge: cartCount||null },
    { label: t('track_order'),   path:'/order-status',  icon: SBIcons.Track,   section: 'ORDERS', dot: true },
    { label: t('order_history'), path:'/history',       icon: SBIcons.Hist    },
    { label: t('my_profile'),    path:'PROFILE',        icon: SBIcons.Profile, section: 'ACCOUNT' },
    { label: t('support'),       path: null,            icon: SBIcons.Support },
  ];

  function handleNav(path) {
    if (path === 'PROFILE') { onProfile(); return; }
    if (!path) { alert('Support: +91 98765 43210'); return; }
    navigate(path);
  }

  return (
    <aside className={`lsb ${!isOpen ? 'lsb--collapsed' : ''}`}>
      {/* Toggle button */}
      <button className="lsb__toggle" onClick={onToggle} title={isOpen ? 'Collapse' : 'Expand'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
          {isOpen ? <polyline points="15,18 9,12 15,6"/> : <polyline points="9,18 15,12 9,6"/>}
        </svg>
      </button>
      <div className="lsb__inner">
      <div className="lsb__brand">
        <div className="lsb__brand-icon">🏨</div>
        <div>
          <div className="lsb__brand-name">HotelOGIX</div>
          <div className="lsb__brand-sub">ROOM DINING</div>
        </div>
      </div>

      <div className="lsb__guest">
        <div className="lsb__guest-av">{guestName.charAt(0).toUpperCase()}</div>
        <div>
          <div className="lsb__guest-name">{guestName}</div>
          <div className="lsb__guest-room">{t('room')} {room}</div>
        </div>
      </div>

      <nav className="lsb__nav">
        {nav.map(({label, path, icon, badge, section, dot}) => {
          const active = path && path !== 'PROFILE' && location.pathname === path;
          return (
            <React.Fragment key={label}>
              {section && <div className="lsb__section">{section}</div>}
              <button className={`lsb__item ${active ? 'lsb__item--active' : ''}`} onClick={() => handleNav(path)}>
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

      <div className="lsb__last-login">
        <span className="lsb__ll-icon">{SBIcons.Refresh}</span>
        <div>
          <p className="lsb__ll-title">Last Login:</p>
          <p className="lsb__ll-time">{fmtLogin(loginTime)}</p>
        </div>
      </div>

      <div className="lsb__summary">
        <div className="lsb__sum-row"><span>{t('items')}</span><span>{cartCount} {t('items')}</span></div>
        <div className="lsb__sum-row"><span>{t('subtotal')}</span><span>₹ {subtotal.toLocaleString('en-IN')}</span></div>
        <div className="lsb__sum-row lsb__sum-total"><span>{t('total')}</span><span>₹ {(subtotal+tax).toLocaleString('en-IN')}</span></div>
      </div>

      <button className="lsb__order-btn" onClick={() => navigate('/cart')}>
        <span className="lsb__order-icon">🛒</span>
        <span className="lsb__order-text">{t('place_order')} →</span>
      </button>
      </div>{/* end lsb__inner */}
    </aside>
  );
}

/* ─── Right Order Panel ──────────────────────────────────────── */
function RightCart({ cart, setCart, currency, navigate, t, isOpen, onToggle, cartCount: cartCountProp }) {
  const cartCount = cartCountProp ?? cart.reduce((s,i) => s+i.quantity, 0);
  const cartTotal = cart.reduce((s,i) => s+i.price*i.quantity, 0);

  function changeQty(id, delta) {
    const idx = cart.findIndex(c => String(c.id) === String(id));
    if (idx === -1) return;
    const nc = cart.map((c, i) =>
      i === idx ? { ...c, quantity: c.quantity + delta } : c
    ).filter(c => c.quantity > 0);
    setCart(nc);
    saveCart(nc);
  }

  return (
    <aside className={`rcp ${!isOpen ? 'rcp--hidden' : ''}`}>
      {/* Toggle button */}
      <button className="rcp__toggle" onClick={onToggle} title={isOpen ? 'Hide Order Panel' : 'Show Order Panel'}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
          {isOpen ? <polyline points="9,18 15,12 9,6"/> : <polyline points="15,18 9,12 15,6"/>}
        </svg>
        {!isOpen && cartCount > 0 && <span className="rcp__toggle-badge">{cartCount}</span>}
      </button>
      <div className="rcp__header">
        <span className="rcp__title">{t('your_order')}</span>
        {cartCount > 0 && <span className="rcp__badge">{cartCount} {t('items')}</span>}
      </div>
      <div className="rcp__items">
        {cart.length === 0 ? (
          <div className="rcp__empty">
            <div className="rcp__empty-icon">🛒</div>
            <p>{t('cart_empty')}</p>
            <small>{t('add_something')}</small>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="rcp__item">
              <div className="rcp__item-info">
                <div className="rcp__item-name">{item.name}</div>
                <div className="rcp__item-price">{currency} {item.price}</div>
                {item.customization?.notes && (
                  <div className="rcp__item-note">📝 {item.customization.notes}</div>
                )}
                {item.customization?.spice && (
                  <div className="rcp__item-note">🌶 {item.customization.spice}</div>
                )}
              </div>
              <div className="rcp__item-controls">
                <button className="rcp__ctrl" onClick={() => changeQty(item.id, -1)}>−</button>
                <span className="rcp__qty">{item.quantity}</span>
                <button className="rcp__ctrl" onClick={() => changeQty(item.id, 1)}>+</button>
                <button className="rcp__del" onClick={() => changeQty(item.id, -999)}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
      {cart.length > 0 && (
        <div className="rcp__footer">
          <div className="rcp__total-row">
            <span>{t('total')}</span>
            <span className="rcp__total-val">{currency} {cartTotal.toLocaleString('en-IN')}</span>
          </div>
          <button className="rcp__place-btn" onClick={() => navigate('/cart')}>
            {t('place_order')}
          </button>
        </div>
      )}
    </aside>
  );
}

/* ─── Change Selection Modal ─────────────────────────────────── */
function ChangeSelectionModal({ onClose, onChangeOutlet, onChangeCategory }) {
  const { t } = useLang();
  return (
    <div className="co-overlay" onClick={e => { if(e.target.classList.contains('co-overlay')) onClose(); }}>
      <div className="co-modal">
        <button className="co-close" onClick={onClose}>✕</button>
        <h3 className="co-title">{t('change_selection')}</h3>
        <button className="co-btn co-btn--blue" onClick={onChangeOutlet}>
          <span>🏨</span> {t('change_outlet')}
        </button>
        <button className="co-btn co-btn--green" onClick={onChangeCategory}>
          <span>📋</span> {t('change_category')}
        </button>
      </div>
    </div>
  );
}

/* ─── Hero Carousel ──────────────────────────────────────────── */
function HeroCarousel({ outletData }) {
  const [slide, setSlide] = useState(0);
  const slides = outletData?.images?.length ? outletData.images
    : ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80',
       'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=80',
       'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1400&q=80'];
  const total = slides.length;
  useEffect(() => { const tm = setInterval(() => setSlide(s => (s+1)%total), 5000); return () => clearInterval(tm); }, [total]);
  const hotelName = safeJSON(localStorage.getItem('userData'),{})?.guest?.hotel_name || 'Hotel';
  return (
    <div className="hero">
      {slides.map((src, i) => (
        <div key={i} className={`hero__slide ${i===slide?'hero__slide--on':''}`}
          style={{ backgroundImage:`url('${typeof src==='string'?src:src.url||''}')` }} />
      ))}
      <div className="hero__overlay" />
      <div className="hero__content">
        <h1 className="hero__hotel">{hotelName}</h1>
        <p className="hero__outlet">{outletData?.name||'Restaurant'}</p>
        <p className="hero__timing">{outletData?.timing||'6:00 AM – 11:00 PM'}</p>
      </div>
      <button className="hero__arr hero__arr--l" onClick={() => setSlide(s=>(s-1+total)%total)}>‹</button>
      <button className="hero__arr hero__arr--r" onClick={() => setSlide(s=>(s+1)%total)}>›</button>
      <div className="hero__dots">
        {slides.map((_,i) => <span key={i} className={`hero__dot ${i===slide?'hero__dot--on':''}`} onClick={() => setSlide(i)} />)}
      </div>
    </div>
  );
}

/* ─── Item Modal — with inline customization ─────────────────── */
function ItemModal({ item, onClose, onAdd, inCart, currency }) {
  const [adding, setAdding] = useState(false);
  const [spice,  setSpice]  = useState('');
  const [notes,  setNotes]  = useState('');
  if (!item) return null;

  const spiceOptions = [
    { id:'mild',      label:'🟢 Mild'      },
    { id:'medium',    label:'🟡 Medium'    },
    { id:'hot',       label:'🔴 Hot'       },
    { id:'extra-hot', label:'🌶️ Extra Hot' },
  ];

  function handleAdd() {
    setAdding(true);
    onAdd(item.id, { spice, notes });
    setTimeout(() => { setAdding(false); onClose(); }, 500);
  }

  return (
    <div className="imdl-overlay" onClick={e => { if(e.target.classList.contains('imdl-overlay')) onClose(); }}>
      <div className="imdl">
        {/* Image */}
        <div className="imdl__img" style={{ backgroundImage: item.image ? `url('${item.image}')` : 'none' }}>
          <button className="imdl__close" onClick={onClose}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          {item.is_popular    && <span className="imdl__badge imdl__badge--hot">🔥 Popular</span>}
          {item.is_bestseller && <span className="imdl__badge imdl__badge--star">⭐ Bestseller</span>}
          {item.discount      && <span className="imdl__badge imdl__badge--off">{item.discount}% OFF</span>}
        </div>

        <div className="imdl__body">
          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="imdl__tags">
              {item.tags.map(tg => <span key={tg} className={`tag ${tg.toLowerCase().includes('veg')?'veg':tg.toLowerCase().includes('spicy')?'spicy':''}`}>{tg}</span>)}
            </div>
          )}

          <h2 className="imdl__name">{item.name}</h2>
          {item.cook_time && <p className="imdl__meta">⏱ {item.cook_time} · {item.category||''}</p>}
          <p className="imdl__desc">{item.long_description||item.description||'No description available.'}</p>

          {/* Nutrition */}
          {NUTRI.some(n => getNV(item,n) != null) && (
            <div className="imdl__section">
              <h4 className="imdl__section-title">📊 Nutrition Facts</h4>
              <NutriPills item={item} animate={true} />
            </div>
          )}

          {/* Allergens */}
          {item.allergens?.length > 0 && (
            <div className="imdl__section">
              <h4 className="imdl__section-title">⚠️ Allergens</h4>
              <div className="imdl__allergens">
                {item.allergens.map(a => <span key={a.id} className="imdl__allergen" style={{background:a.color||'#ef4444'}}>{a.icon} {a.name}</span>)}
              </div>
            </div>
          )}

          {/* ── Customize (inline, always visible) ── */}
          <div className="imdl__section imdl__customize">
            <h4 className="imdl__section-title">✏️ Customize Your Order</h4>
            <div className="imdl__cust-field">
              <label className="imdl__cust-label">Special Instructions</label>
              <input
                type="text"
                className="imdl__cust-input"
                placeholder="e.g. Less sugar, extra ice, no onions…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <div className="imdl__cust-field">
              <label className="imdl__cust-label">
                Spice Level <span className="imdl__cust-optional">(optional)</span>
              </label>
              <div className="imdl__spice-row">
                {spiceOptions.map(s => (
                  <button key={s.id}
                    className={`imdl__spice-btn ${spice===s.id?'imdl__spice-btn--on':''}`}
                    onClick={() => setSpice(spice===s.id ? '' : s.id)}
                    type="button">
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="imdl__footer">
            <div className="imdl__price-block">
              <span className="imdl__price">{currency}{item.price}</span>
              {item.originalPrice && <span className="imdl__orig">{currency}{item.originalPrice}</span>}
            </div>
            {!inCart
              ? <button className={`imdl__add${adding?' imdl__add--adding':''}`} onClick={handleAdd}>
                  {adding ? '✓ Adding…' : '+ Add to Cart'}
                </button>
              : <button className="imdl__added" disabled>✓ Added to Cart</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Menu Card (no separate customize button) ───────────────── */
function MenuCard({ item, inCart, cartQty, onAdd, onOpen, onCustomize, onChangeQty, currency }) {
  const [pulse, setPulse] = useState(false);

  function handleAdd(e) {
    e.stopPropagation();
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
    onAdd(item.id);
  }
  function handleCustomize(e) {
    e.stopPropagation();
    onCustomize(item);
  }
  function handleQty(e, delta) {
    e.stopPropagation();
    onChangeQty(item.id, delta);
  }

  const hasNutri = NUTRI.some(n => getNV(item,n) != null);

  return (
    <div className={`mc ${inCart?'mc--in':''}`} onClick={() => onOpen(item)}>
      <div className="mc__img" style={{ backgroundImage:`url('${item.image||''}')` }}>
        {!item.image && <div className="mc__ph">🍽️</div>}
        {item.is_bestseller && <div className="mc__ribbon mc__ribbon--star">⭐ Best</div>}
        {item.is_popular    && <div className="mc__ribbon mc__ribbon--hot">🔥 Hot</div>}
        {item.discount      && <div className="mc__ribbon mc__ribbon--off">{item.discount}% OFF</div>}
        {item.tags?.some(tg=>tg.toLowerCase().includes('veg')) && <div className="mc__ribbon mc__ribbon--veg">Veg</div>}
        {inCart && <span className="mc__qty-badge">{cartQty}</span>}
      </div>
      <div className="mc__body">
        <h3 className="mc__name">{item.name}</h3>
        {item.description && <p className="mc__desc">{item.description}</p>}
        {hasNutri && <NutriPills item={item} />}
        {item.allergens?.length > 0 && (
          <div className="mc__allergens">
            {item.allergens.slice(0,4).map(a => <span key={a.id} className="mc__allergen" style={{background:a.color||'#ef4444'}} title={a.name}>{a.icon} {a.code}</span>)}
          </div>
        )}
        <div className="mc__footer">
          <div className="mc__price-wrap">
            <span className="mc__price">{currency}{item.price}</span>
            {item.originalPrice && <span className="mc__orig">{currency}{item.originalPrice}</span>}
          </div>
          <div className="mc__actions">
            {/* Customize button — always visible */}
            <button className="mc__cust-btn" onClick={handleCustomize} title="Customize">
              ✏️
            </button>
            {/* Qty controls when in cart, + button when not */}
            {inCart ? (
              <div className="mc__qty-ctrl" onClick={e => e.stopPropagation()}>
                <button className="mc__qty-btn mc__qty-btn--minus" onClick={e => handleQty(e, -1)}>−</button>
                <span className="mc__qty-num">{cartQty}</span>
                <button className={`mc__qty-btn mc__qty-btn--plus ${pulse?'mc__btn--pulse':''}`} onClick={e => { e.stopPropagation(); setPulse(true); setTimeout(()=>setPulse(false),500); onAdd(item.id); }}>+</button>
              </div>
            ) : (
              <button className={`mc__btn ${pulse?'mc__btn--pulse':''}`} onClick={handleAdd}>+</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Customize Modal ─────────────────────────────────────────── */
function CustomizeModal({ item, onClose, onSave }) {
  const [spice, setSpice] = useState('');
  const [notes, setNotes] = useState('');
  if (!item) return null;
  const spiceOptions = [
    { id:'mild',      label:'🟢 Mild'      },
    { id:'medium',    label:'🟡 Medium'    },
    { id:'hot',       label:'🔴 Hot'       },
    { id:'extra-hot', label:'🌶️ Extra Hot' },
  ];
  return (
    <div className="cust-overlay" onClick={e => { if(e.target.classList.contains('cust-overlay')) onClose(); }}>
      <div className="cust-modal">
        <div className="cust-header">
          <div>
            <h2 className="cust-title">Customize</h2>
            <p className="cust-subtitle">{item.name}</p>
          </div>
          <button className="cust-close" onClick={onClose}>✕</button>
        </div>
        <div className="cust-body">
          <div className="cust-section">
            <label className="cust-label">🌶️ Spice Level</label>
            <div className="cust-spice-grid">
              {spiceOptions.map(s => (
                <button key={s.id}
                  className={`cust-spice-btn ${spice===s.id?'cust-spice-btn--on':''}`}
                  onClick={() => setSpice(spice===s.id?'':s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="cust-section">
            <label className="cust-label">📝 Special Instructions</label>
            <textarea className="cust-textarea"
              placeholder="e.g. No onions, extra sauce, less spicy..."
              rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>
        </div>
        <div className="cust-footer">
          <button className="cust-cancel" onClick={onClose}>Cancel</button>
          <button className="cust-save" onClick={() => { onSave(item.id,{spice,notes}); onClose(); }}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}


function ProfileModal({ userData, onClose, onHistory }) {
  const { t, lang, setLanguage, LANGS } = useLang();
  const name   = userData?.guestName || userData?.guest?.guest_name || 'Guest';
  const room   = userData?.guest?.guestRoomId || userData?.guest?.room || userData?.roomNumber || 'N/A';
  const outlet = safeJSON(localStorage.getItem('outlet'),{})?.name || '—';
  return (
    <div className="pm-overlay" onClick={e => { if(e.target.classList.contains('pm-overlay')) onClose(); }}>
      <div className="pm">
        <button className="pm__close" onClick={onClose}>✕</button>
        <div className="pm__hero">
          <div className="pm__av">{name.charAt(0).toUpperCase()}</div>
          <h2 className="pm__name">{name}</h2>
          <p className="pm__sub">{t('room')} {room}</p>
        </div>
        <div className="pm__rows">
          {[[t('guest_name'),name],[t('room_no'),room],[t('current_outlet'),outlet]].map(([k,v]) => (
            <div key={k} className="pm__row"><span className="pm__lbl">{k}</span><span className="pm__val">{v}</span></div>
          ))}
          {/* Language selector row — shown on all screens, extra useful on mobile */}
          <div className="pm__row">
            <span className="pm__lbl">🌐 Language</span>
            <div className="pm__lang-btns">
              {Object.entries(LANGS).map(([code, { label }]) => (
                <button key={code}
                  className={`pm__lang-btn ${lang === code ? 'pm__lang-btn--on' : ''}`}
                  onClick={() => setLanguage(code)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="pm__foot">
          <button className="pm__hist" onClick={onHistory}>📋 {t('order_history')}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN MENU PAGE ─────────────────────────────────────────── */
export default function Menu() {
  const navigate   = useNavigate();
  const { t }      = useLang();
  const { isDark } = useTheme();

  const [menuItems, setMenuItems]     = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [cart, setCart]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [outlet, setOutlet]           = useState({});
  const [category, setCategory]       = useState('all');
  const [categories, setCategories]   = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [activeShift, setActiveShift] = useState(() => localStorage.getItem('selectedShift') || '');
  const [search, setSearch]           = useState('');
  const [priceF, setPriceF]           = useState('');
  const [sortF, setSortF]             = useState('');
  const [grid, setGrid]               = useState(5);
  const [page, setPage]               = useState(1);
  const PER_PAGE = 20;
  const [showProfile, setShowProfile]     = useState(false);
  const [leftOpen, setLeftOpen]           = useState(false); // default collapsed
  const [rightOpen, setRightOpen]         = useState(false); // default collapsed
  const [selItem, setSelItem]         = useState(null);
  const [customizeItem, setCustomizeItem] = useState(null);
  const [toast, setToast]             = useState(null);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const notifTimer = useRef(null);
  const searchRef  = useRef(null);

  const selOutlet = localStorage.getItem('selectedOutlet');
  const selShift  = localStorage.getItem('selectedShift');
  const hotelId   = localStorage.getItem('hotel_id');
  const userData  = safeJSON(localStorage.getItem('userData'), {});
  const currency  = getCurrency();

  // Helper — get encoded room id for navigation
  const getRoomParam = () =>
    userData?.guest?.guestRoomId || userData?.guest?.room ||
    localStorage.getItem('roomNumber') || '';

  useEffect(() => {
    if (!selOutlet || !selShift) { navigate('/preferences'); return; }
    setCart(getCartRaw());
    loadMenu();
  }, []);

  useEffect(() => {
    let items = [...menuItems];
    if (category !== 'all') items = items.filter(i => i.category?.includes(category));
    if (search) { const q = search.toLowerCase(); items = items.filter(i => i.name.toLowerCase().includes(q)||(i.description||'').toLowerCase().includes(q)); }
    if (priceF) {
      let min=0, max=Infinity;
      if (priceF.endsWith('+')) min = parseInt(priceF);
      else if (priceF.includes('-')) [min,max] = priceF.split('-').map(Number);
      items = items.filter(i => i.price>=min && i.price<=max);
    }
    if (sortF==='price-low')  items.sort((a,b) => a.price-b.price);
    if (sortF==='price-high') items.sort((a,b) => b.price-a.price);
    if (sortF==='popular')    items.sort((a,b) => (b.is_popular?1:0)-(a.is_popular?1:0));
    setFiltered(items); setPage(1);
  }, [menuItems, category, search, priceF, sortF]);

  async function loadMenu(shiftId) {
    const currentShift = shiftId || localStorage.getItem('selectedShift');
    setLoading(true);
    try {
      const resp = await authFetch(`${API_BASE}/api/app/outlets/${selOutlet}/categories/${currentShift}/menu?hotel_id=${hotelId}&_t=${Date.now()}`);
      const data = await resp.json();
      const o = data[Object.keys(data)[0]];
      if (o?.menuItems) {
        const storedOutlet = safeJSON(localStorage.getItem('outlet'), {});
        const mergedOutlet = {
          ...storedOutlet,
          ...o,
          pos_id: o.pos_id || storedOutlet.pos_id || selOutlet,
        };
        setOutlet(mergedOutlet);
        setMenuItems(o.menuItems);
        setFiltered(o.menuItems);
        setCategories([...new Set(o.menuItems.flatMap(i => i.category||[]))]);
        const prefs = storedOutlet?.preferences || o?.preferences || [];
        setPreferences(prefs.filter(p => p.itemCount > 0));
        localStorage.setItem('outlet', JSON.stringify(mergedOutlet));
        setCart(getCartRaw());
      }
    } catch(err) { if(err.message.includes('authentication')) { localStorage.clear(); navigate('/preferences'); } }
    finally { setLoading(false); }
  }

  function addToCart(itemId, customization = {}) {
    const item = menuItems.find(m => String(m.id)===String(itemId));
    if (!item) return;
    const o     = safeJSON(localStorage.getItem('outlet'),{});
    const posId = o.pos_id || outlet.pos_id || '';
    setCart(prev => {
      const existing = prev.find(c => String(c.id)===String(itemId));
      let nc;
      if (existing) {
        nc = prev.map(c =>
          String(c.id)===String(itemId)
            ? { ...c, quantity: c.quantity + 1, ...(customization.notes||customization.spice ? {customization} : {}) }
            : c
        );
      } else {
        nc = [...prev, {
          id: item.id, name: item.name, price: item.price, image: item.image,
          quantity: 1, customization,
          outlet: selOutlet, outletName: o.name||outlet.name||'',
          pos_id: posId,
          requiresAdvancePayment: item.requiresAdvancePayment || false,
          taxes: item.taxes
        }];
      }
      saveCart(nc);
      return nc;
    });
    showToastMsg(`🛒 ${item.name} added!`);
  }

  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  function showToastMsg(msg) {
    setToast(msg);
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function changeMobileQty(id, delta) {
    setCart(prev => {
      const idx = prev.findIndex(c => String(c.id) === String(id));
      if (idx === -1) return prev;
      const nc = prev.map((c, i) =>
        i === idx ? { ...c, quantity: c.quantity + delta } : c
      ).filter(c => c.quantity > 0);
      saveCart(nc);
      return nc;
    });
  }

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const cartCount  = cart.reduce((s,i) => s+i.quantity, 0);
  const cartTotal  = cart.reduce((s,i) => s+i.price*i.quantity, 0);

  return (
    <div className={`app-shell ${isDark ? 'dark' : ''}`}>

      {/* ══ LEFT SIDEBAR ══ */}
      <LeftSidebar cart={cart} navigate={navigate} t={t} userData={userData} onProfile={() => setShowProfile(true)} isOpen={leftOpen} onToggle={() => setLeftOpen(o => !o)} />

      {/* ══ CENTER ══ */}
      <div className="center-col">

        {/* TOP BAR */}
        <header className="topbar">
          {/* ── Main row: Outlet + [Desktop Search] + Icons ── */}
          <div className="tb-main-row">
            {/* Left sidebar toggle */}
            <button className="tb-sidebar-toggle" onClick={() => setLeftOpen(o => !o)} title="Toggle Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                {leftOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                }
              </svg>
            </button>
            <button className="tb-outlet" onClick={() => setShowChangeModal(true)}>
              <img
                src="https://www.hotelogix.com/wp-content/themes/hotelogix/images/hotelogix-logo.svg"
                alt="HotelOGIX" className="tb-logo-inline"
                onError={e => { e.target.style.display='none'; }}
              />
              <span className="tb-outlet-icon">🍴</span>
              <div className="tb-outlet-info">
                <span className="tb-outlet-name">{outlet.name || 'Restaurant'}</span>
                <span className="tb-outlet-time">{outlet.timing || '6 AM – 11 PM'}</span>
              </div>
              <span className="tb-outlet-arrow">▾</span>
            </button>

            {/* Search — visible on desktop only here */}
            <div className="tb-search-wrap tb-search-desktop">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input ref={searchRef} className="tb-search" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} />
              {search && <button className="tb-search-clr" onClick={() => setSearch('')}>✕</button>}
            </div>

            <div className="tb-right">
              <Clock />
              <button className="tb-icon-btn tb-notif">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </button>
              {/* Cart panel toggle — desktop only */}
              <button className="tb-icon-btn tb-cart-panel-toggle tb-cart-btn" onClick={() => setRightOpen(o => !o)} title="Your Order">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                {cartCount > 0 && <span className="tb-cart-badge">{cartCount}</span>}
              </button>
              <button className="tb-icon-btn" title="Allergens">🛡️</button>
              <ThemeLangBar compact={true} />
              <button className="tb-avatar" onClick={() => setShowProfile(true)}>
                {(userData?.guestName||userData?.guest?.guest_name||'G').charAt(0).toUpperCase()}
              </button>
              <button className="tb-logout" onClick={() => { localStorage.clear(); navigate('/'); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          </div>

          {/* ── Mobile search row — only on mobile ── */}
          <div className="tb-mobile-search">
            <div className="tb-search-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input className="tb-search" placeholder={t('search_placeholder')} value={search} onChange={e=>setSearch(e.target.value)} />
              {search && <button className="tb-search-clr" onClick={() => setSearch('')}>✕</button>}
            </div>
          </div>
        </header>

        {/* CATEGORY STRIP */}
        <div className="cat-strip">
          <button className={`cat-btn ${category==='all'?'cat-btn--on':''}`} onClick={() => setCategory('all')}>
            {t('all')} <span className="cat-count">{menuItems.length}</span>
          </button>
          {categories.map(cat => (
            <button key={cat} className={`cat-btn ${category===cat?'cat-btn--on':''}`} onClick={() => setCategory(cat)}>
              {cat} <span className="cat-count">{menuItems.filter(i=>i.category?.includes(cat)).length}</span>
            </button>
          ))}
        </div>

        {/* FILTER BAR */}
        <div className="filter-bar">
          <div className="filter-bar__left">
            <select value={priceF} onChange={e=>setPriceF(e.target.value)} className="flt-sel">
              <option value="">{t('all_prices')}</option>
              <option value="0-300">{currency}0–300</option>
              <option value="300-500">{currency}300–500</option>
              <option value="500-800">{currency}500–800</option>
              <option value="800+">{currency}800+</option>
            </select>
            <select value={sortF} onChange={e=>setSortF(e.target.value)} className="flt-sel">
              <option value="">{t('sort_by')}</option>
              <option value="price-low">{t('price_low')}</option>
              <option value="price-high">{t('price_high')}</option>
              <option value="popular">{t('popular')}</option>
            </select>
            <div className="flt-grid-btns">
              {[5,4,3,2].map(n => (
                <button key={n} className={`flt-grid-btn ${grid===n?'flt-grid-btn--on':''}`} onClick={() => setGrid(n)}>{n}×</button>
              ))}
            </div>
            {(search||priceF||sortF||category!=='all') && (
              <button className="flt-clear" onClick={() => { setSearch(''); setPriceF(''); setSortF(''); setCategory('all'); }}>{t('clear')}</button>
            )}
          </div>
          <span className="flt-count">{filtered.length} {t('items')}</span>
        </div>

        {/* SCROLL AREA */}
        <div className="scroll-area">
          {toast && <div className="mp-toast">{toast}</div>}

          {/* HERO */}
          {!loading && <HeroCarousel outletData={outlet} />}

          {/* PREFERENCE BAR */}
          {preferences.length > 0 && (
            <div className="pref-bar">
              <span className="pref-bar__label">Preference:</span>
              <div className="pref-bar__tabs">
                {preferences.map(pref => (
                  <button key={pref.id}
                    className={`pref-tab ${String(pref.id)===activeShift?'pref-tab--on':''}`}
                    onClick={() => {
                      localStorage.setItem('selectedShift', pref.id);
                      setActiveShift(String(pref.id));
                      loadMenu(pref.id);
                    }}>
                    {pref.icon && <span className="pref-tab__icon">{pref.icon}</span>}
                    {pref.title} {pref.itemCount > 0 && <span className="pref-tab__count">({pref.itemCount})</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MENU GRID */}
          {loading ? (
            <div className="skl-grid" style={{ gridTemplateColumns:`repeat(${grid},1fr)` }}>
              {[...Array(8)].map((_,i) => (
                <div key={i} className="skl-card">
                  <div className="skl-img" />
                  <div className="skl-body">
                    <div className="skl-line skl-line--lg" />
                    <div className="skl-line skl-line--md" />
                    <div className="skl-line skl-line--sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : pageItems.length === 0 ? (
            <div className="mp__empty">
              <div className="mp__empty-icon">🍽️</div>
              <h3>{t('no_items')}</h3>
              <p>{t('clear_filters')}</p>
              <button onClick={() => { setSearch(''); setPriceF(''); setCategory('all'); }}>{t('clear_filters')}</button>
            </div>
          ) : (
            <>
              <div className="section-hdr">
                <h2 className="section-title">{category==='all'?t('all'):category}</h2>
                <span className="section-count">{filtered.length} {t('items')}</span>
              </div>
              <div className="menu-grid" style={{ gridTemplateColumns:`repeat(${grid},1fr)` }}>
                {pageItems.map(item => (
                  <MenuCard key={item.id} item={item}
                    inCart={!!cart.find(c => String(c.id)===String(item.id))}
                    cartQty={cart.find(c => String(c.id)===String(item.id))?.quantity || 0}
                    onAdd={addToCart} onOpen={setSelItem}
                    onCustomize={setCustomizeItem}
                    onChangeQty={(id, delta) => {
                      setCart(prev => {
                        const idx = prev.findIndex(c => String(c.id)===String(id));
                        if (idx === -1) { if (delta > 0) addToCart(id); return prev; }
                        const nc = prev.map((c, i) =>
                          i === idx ? { ...c, quantity: c.quantity + delta } : c
                        ).filter(c => c.quantity > 0);
                        saveCart(nc);
                        return nc;
                      });
                    }}
                    currency={currency} />
                ))}
              </div>
            </>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="mp__pg">
              <button className="pg__btn" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
              {[...Array(Math.min(totalPages,7))].map((_,i) => (
                <button key={i+1} className={`pg__btn ${page===i+1?'pg__btn--on':''}`} onClick={() => setPage(i+1)}>{i+1}</button>
              ))}
              {totalPages > 7 && <span className="pg__sep">…</span>}
              <button className="pg__btn" onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT CART PANEL ══ */}
      <RightCart cart={cart} setCart={setCart} currency={currency} navigate={navigate} t={t} isOpen={rightOpen} onToggle={() => setRightOpen(o => !o)} cartCount={cartCount} />

      {/* ══ MODALS ══ */}
      {showChangeModal && (
        <ChangeSelectionModal
          onClose={() => setShowChangeModal(false)}
          onChangeOutlet={() => {
            setShowChangeModal(false);
            localStorage.removeItem('selectedOutlet');
            localStorage.removeItem('selectedShift');
            navigate(`/preferences?hotel_id=${hotelId}&room=${getRoomParam()}`);
          }}
          onChangeCategory={() => {
            setShowChangeModal(false);
            localStorage.removeItem('selectedShift');
            navigate(`/preferences?hotel_id=${hotelId}&outlet=${selOutlet}&room=${getRoomParam()}`);
          }}
        />
      )}

      {selItem && (
        <ItemModal item={selItem} onClose={() => setSelItem(null)}
          onAdd={addToCart} inCart={!!cart.find(c=>String(c.id)===String(selItem.id))} currency={currency} />
      )}

      {customizeItem && (
        <CustomizeModal
          item={customizeItem}
          onClose={() => setCustomizeItem(null)}
          onSave={(id, custom) => { addToCart(id, custom); setCustomizeItem(null); }}
        />
      )}

      {showProfile && (
        <ProfileModal userData={userData} onClose={() => setShowProfile(false)}
          onHistory={() => { setShowProfile(false); navigate('/history'); }} />
      )}

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <nav className="mobile-bottom-nav">
        <button className="mbn-item active" onClick={() => navigate('/menu')}>
          <span className="mbn-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </span>
          Menu
        </button>
        <button className="mbn-item" onClick={() => setMobileCartOpen(true)}>
          <span className="mbn-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </span>
          {cartCount > 0 && <span className="mbn-badge">{cartCount}</span>}
          Cart
        </button>
        <button className="mbn-item" onClick={() => navigate('/history')}>
          <span className="mbn-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
          </span>
          Orders
        </button>
        <button className="mbn-item" onClick={() => navigate('/order-status')}>
          <span className="mbn-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </span>
          Track
        </button>
        <button className="mbn-item" onClick={() => setShowProfile(true)}>
          <span className="mbn-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </span>
          Profile
        </button>
      </nav>

      {/* ══ MOBILE CART DRAWER ══ */}
      <div className={`mobile-cart-backdrop ${mobileCartOpen ? 'open' : ''}`} onClick={() => setMobileCartOpen(false)} />
      <div className={`mobile-cart-drawer ${mobileCartOpen ? 'open' : ''}`}>
        <div className="mcd-handle"><div className="mcd-handle-bar" /></div>
        <div className="mcd-header">
          <span className="mcd-title">Your Order</span>
          {cartCount > 0 && <span className="mcd-badge">{cartCount} items</span>}
          <button className="mcd-close" onClick={() => setMobileCartOpen(false)}>✕</button>
        </div>
        <div className="mcd-items">
          {cart.length === 0 ? (
            <div className="mcd-empty">
              <div className="mcd-empty-icon">🛒</div>
              <p>Your cart is empty</p>
              <small style={{color:'var(--txt3)',fontSize:12}}>Add something delicious!</small>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="mcd-item">
                <div className="mcd-item-img" style={{ backgroundImage: `url('${item.image||''}')` }} />
                <div className="mcd-item-info">
                  <div className="mcd-item-name">{item.name}</div>
                  <div className="mcd-item-price">{currency} {item.price}</div>
                </div>
                <div className="mcd-item-controls">
                  <button className="mcd-ctrl" onClick={() => changeMobileQty(item.id, -1)}>−</button>
                  <span className="mcd-qty">{item.quantity}</span>
                  <button className="mcd-ctrl" onClick={() => changeMobileQty(item.id, 1)}>+</button>
                  <button className="mcd-del" onClick={() => changeMobileQty(item.id, -999)}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="mcd-footer">
            <div className="mcd-total-row">
              <span className="mcd-total-label">Total</span>
              <span className="mcd-total-val">{currency} {cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <button className="mcd-place-btn" onClick={() => { setMobileCartOpen(false); navigate('/cart'); }}>
              Review & Place Order
            </button>
          </div>
        )}
      </div>

    </div>
  );
}