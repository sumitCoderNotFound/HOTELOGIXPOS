import React, { useState } from 'react';
import NutriPills, { NUTRI, getNV } from './NutriPills';

export default function ItemModal({ item, onClose, onAdd, inCart, currency }) {
  const [adding, setAdding] = useState(false);
  const [spice,  setSpice]  = useState('');
  const [notes,  setNotes]  = useState('');

  if (!item) return null;

  const spiceOptions = [
    { id: 'mild',      label: '🟢 Mild'      },
    { id: 'medium',    label: '🟡 Medium'    },
    { id: 'hot',       label: '🔴 Hot'       },
    { id: 'extra-hot', label: '🌶️ Extra Hot' },
  ];

  function handleAdd() {
    setAdding(true);
    onAdd(item.id, { spice, notes });
    setTimeout(() => { setAdding(false); onClose(); }, 500);
  }

  return (
    <div className="imdl-overlay" onClick={e => { if (e.target.classList.contains('imdl-overlay')) onClose(); }}>
      <div className="imdl">
        {/* Image */}
        <div className="imdl__img" style={{ backgroundImage: item.image ? `url('${item.image}')` : 'none' }}>
          <button className="imdl__close" onClick={onClose}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          {item.is_popular    && <span className="imdl__badge imdl__badge--hot">🔥 Popular</span>}
          {item.is_bestseller && <span className="imdl__badge imdl__badge--star">⭐ Bestseller</span>}
          {item.discount      && <span className="imdl__badge imdl__badge--off">{item.discount}% OFF</span>}
        </div>

        <div className="imdl__body">
          {/* Tags */}
          {item.tags?.length > 0 && (
            <div className="imdl__tags">
              {item.tags.map(tg => (
                <span key={tg} className={`tag ${tg.toLowerCase().includes('veg') ? 'veg' : tg.toLowerCase().includes('spicy') ? 'spicy' : ''}`}>
                  {tg}
                </span>
              ))}
            </div>
          )}

          <h2 className="imdl__name">{item.name}</h2>
          {item.cook_time && <p className="imdl__meta">⏱ {item.cook_time} · {item.category || ''}</p>}
          <p className="imdl__desc">{item.long_description || item.description || 'No description available.'}</p>

          {/* Nutrition */}
          {NUTRI.some(n => getNV(item, n) != null) && (
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
                {item.allergens.map(a => (
                  <span key={a.id} className="imdl__allergen" style={{ background: a.color || '#ef4444' }}>
                    {a.icon} {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Customize (inline) */}
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
                  <button key={s.id} type="button"
                    className={`imdl__spice-btn ${spice === s.id ? 'imdl__spice-btn--on' : ''}`}
                    onClick={() => setSpice(spice === s.id ? '' : s.id)}>
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
              ? <button className={`imdl__add${adding ? ' imdl__add--adding' : ''}`} onClick={handleAdd}>
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
