import React from 'react';

const saveCart = arr => localStorage.setItem('cartData', JSON.stringify(arr));

export default function RightCart({ cart, setCart, currency, navigate, t }) {
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  function changeQty(id, delta) {
    const nc  = [...cart];
    const idx = nc.findIndex(c => String(c.id) === String(id));
    if (idx === -1) return;
    nc[idx].quantity += delta;
    if (nc[idx].quantity <= 0) nc.splice(idx, 1);
    setCart(nc);
    saveCart(nc);
  }

  return (
    <aside className="rcp">
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
                <button className="rcp__ctrl rcp__ctrl--plus" onClick={() => changeQty(item.id, 1)}>+</button>
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
