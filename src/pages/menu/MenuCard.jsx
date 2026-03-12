import React, { useState } from 'react';
import NutriPills, { NUTRI, getNV } from './NutriPills';

export default function MenuCard({ item, inCart, onAdd, onOpen, onCustomize, currency }) {
  const [pulse, setPulse] = useState(false);

  function handleAdd(e) {
    e.stopPropagation();
    if (inCart) return;
    setPulse(true);
    setTimeout(() => setPulse(false), 500);
    onAdd(item.id);
  }

  function handleCustomize(e) {
    e.stopPropagation();
    onCustomize(item);
  }

  const hasNutri = NUTRI.some(n => getNV(item, n) != null);

  return (
    <div className={`mc ${inCart ? 'mc--in' : ''}`} onClick={() => onOpen(item)}>
      {/* Image */}
      <div className="mc__img" style={{ backgroundImage: `url('${item.image || ''}')` }}>
        {!item.image && <div className="mc__ph">🍽️</div>}
        {item.is_bestseller && <div className="mc__ribbon mc__ribbon--star">⭐ Best</div>}
        {item.is_popular    && <div className="mc__ribbon mc__ribbon--hot">🔥 Hot</div>}
        {item.discount      && <div className="mc__ribbon mc__ribbon--off">{item.discount}% OFF</div>}
        {item.tags?.some(tg => tg.toLowerCase().includes('veg')) && (
          <div className="mc__ribbon mc__ribbon--veg">Veg</div>
        )}
        {inCart && <div className="mc__check">✓</div>}
      </div>

      {/* Body */}
      <div className="mc__body">
        <h3 className="mc__name">{item.name}</h3>
        {item.description && <p className="mc__desc">{item.description}</p>}
        {hasNutri && <NutriPills item={item} />}
        {item.allergens?.length > 0 && (
          <div className="mc__allergens">
            {item.allergens.slice(0, 4).map(a => (
              <span key={a.id} className="mc__allergen"
                style={{ background: a.color || '#ef4444' }} title={a.name}>
                {a.icon} {a.code}
              </span>
            ))}
          </div>
        )}
        <div className="mc__footer">
          <div>
            <span className="mc__price">{currency}{item.price}</span>
            {item.originalPrice && <span className="mc__orig">{currency}{item.originalPrice}</span>}
          </div>
          <div className="mc__actions">
            <button className="mc__cust-btn" onClick={handleCustomize} title="Customize">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
            <button
              className={`mc__btn ${inCart ? 'mc__btn--in' : ''} ${pulse ? 'mc__btn--pulse' : ''}`}
              onClick={handleAdd}
              disabled={inCart}
            >
              {inCart ? '✓' : '+'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
