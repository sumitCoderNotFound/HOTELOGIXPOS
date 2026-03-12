import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ThemeLangBar from '../components/ThemeLangBar';
import { useLang } from '../context/LangContext';
import './Cart.css';

// ── helpers (mirrors cart.js) ────────────────────────────────────────────────
const safeJSONParse = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };

function getCurrency() {
  try { return safeJSONParse(localStorage.getItem('userData'), {})?.guest?.currency_symbol || '₹'; }
  catch { return '₹'; }
}
function formatCurrency(n) { return `${getCurrency()} ${Number(n || 0).toFixed(2)}`; }

function getCartData() {
  const keys = ['cartData', 'CartData', 'cart', 'Cart', 'shoppingCart'];
  for (const k of keys) {
    const raw = localStorage.getItem(k)?.trim();
    if (!raw || raw === 'null' || raw === 'undefined') continue;
    const parsed = safeJSONParse(raw, []);
    if (Array.isArray(parsed)) return parsed;
  }
  return [];
}
function setCartData(arr) {
  localStorage.setItem('cartData', JSON.stringify(Array.isArray(arr) ? arr : []));
}

function sanitizeCart(items) {
  if (!Array.isArray(items)) return [];
  return items.map(it => ({
    id: it?.id ?? '',
    name: it?.name ?? 'Item',
    image: it?.image ?? '',
    description: it?.description ?? '',
    category: it?.category ?? '',
    quantity: Number(it?.quantity) || 1,
    price: Number(it?.price) || 0,
    customization: it?.customization || {},
    outlet: it?.outlet ?? '',
    outletName: it?.outletName ?? '',
    pos_id: it?.pos_id ?? '',
    requiresAdvancePayment: !!it?.requiresAdvancePayment,
    paymentStatus: it?.paymentStatus || '',
    paidAmount: Number(it?.paidAmount) || 0,
    taxes: Array.isArray(it?.taxes) ? it.taxes : []
  }));
}

function getCustomizationText(c) {
  if (!c) return '';
  const p = [];
  if (c.spiceLevel) p.push(`Spice: ${c.spiceLevel}`);
  if (c.specialInstructions) p.push(c.specialInstructions);
  if (c.additionalNotes) p.push(c.additionalNotes);
  return p.join(' • ');
}

function computeItemTaxAmounts(item) {
  const price = Number(item.price) || 0;
  const breakdown = (item.taxes || []).map(t => ({
    name: t?.taxName || t?.taxShortName || 'Tax',
    rate: Number(t?.modifiedTaxRate ?? t?.taxRate) || 0,
    amount: +(price * (Number(t?.modifiedTaxRate ?? t?.taxRate) || 0) / 100).toFixed(2)
  }));
  return { breakdown, total: +breakdown.reduce((s, x) => s + x.amount, 0).toFixed(2) };
}

function getCartTotals(cart) {
  let subtotal = 0;
  const taxMap = new Map();
  cart.forEach(item => {
    const qty = Number(item.quantity) || 1;
    subtotal += (Number(item.price) || 0) * qty;
    const { breakdown } = computeItemTaxAmounts(item);
    breakdown.forEach(t => {
      const key = `${t.name}|${t.rate}`;
      taxMap.set(key, +((taxMap.get(key) || 0) + t.amount * qty).toFixed(2));
    });
  });
  const taxesBreakdown = [...taxMap.entries()].map(([k, amount]) => {
    const [name, rateStr] = k.split('|');
    return { name, rate: Number(rateStr), amount };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const taxesTotal = +taxesBreakdown.reduce((s, x) => s + x.amount, 0).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), deliveryFee: 0, taxesTotal, total: +(subtotal + taxesTotal).toFixed(2), taxesBreakdown };
}

function generateOrderId() {
  return `HX${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function groupItemsByOutlet(cart) {
  const grouped = {};
  cart.forEach(item => {
    const key = item.outlet || 'unknown';
    if (!grouped[key]) grouped[key] = { outletId: item.outlet, outletName: item.outletName || `Outlet ${item.outlet}`, pos_id: item.pos_id, items: [] };
    grouped[key].items.push(item);
  });
  return Object.values(grouped);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(sanitizeCart(getCartData()));
  }, []);

  function syncCart(newCart) {
    setCart(newCart);
    setCartData(newCart);
  }

  function updateQuantity(index, change) {
    const updated = [...cart];
    updated[index] = { ...updated[index], quantity: updated[index].quantity + change };
    if (updated[index].quantity <= 0) { removeFromCart(index); return; }
    syncCart(updated);
  }

  function removeFromCart(index) {
    const updated = cart.filter((_, i) => i !== index);
    syncCart(updated);
  }

  function clearCart() {
    if (!cart.length) { alert('Cart is already empty!'); return; }
    if (window.confirm('Are you sure you want to clear your cart?')) syncCart([]);
  }

  function placeOrder() {
    if (!cart.length) { alert('Your cart is empty!'); return; }
    const { subtotal, deliveryFee, taxesTotal, total, taxesBreakdown } = getCartTotals(cart);
    const userRaw = safeJSONParse(localStorage.getItem('userData'), {});
    const orderData = {
      orderId: generateOrderId(),
      items: [...cart],
      subtotal, deliveryFee,
      taxes: taxesTotal, taxesBreakdown,
      total, paymentMethod: 'none', payLaterAmount: 0, paidAmount: total,
      timestamp: new Date().toISOString(), status: 'pending',
      userData: {
        ...userRaw,
        selectedShift:  localStorage.getItem('selectedShift')  || '',
        selectedOutlet: localStorage.getItem('selectedOutlet') || '',
        hotelId:        localStorage.getItem('hotel_id')       || userRaw?.hotelId || '',
        roomNumber:     localStorage.getItem('roomNumber')     || '',
        roomId:         userRaw?.guest?.guestRoomId || userRaw?.guest?.room || localStorage.getItem('roomNumber') || '',
      }
    };
    localStorage.setItem('currentOrder', JSON.stringify(orderData));
    navigate('/success');
  }

  const totals = getCartTotals(cart);
  const outletGroups = groupItemsByOutlet(cart);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLang();

  return (
    <div className="container">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Header */}
      <div className="header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button className="page-hamburger" onClick={() => setSidebarOpen(true)}><span/><span/><span/></button>
          <button className="back-btn" onClick={() => navigate('/menu')}>←</button>
        </div>
        <img src="https://www.hotelogix.com/wp-content/themes/hotelogix/images/hotelogix-logo.svg" alt="HotelOGIX" className="header-logo" style={{ width:46 }} />
        <div className="nav-icons">
          <ThemeLangBar compact={true} />
          <button className="nav-icon" onClick={() => navigate('/history')} title="History">📋</button>
        </div>
      </div>

      <div className="cart-page">
        <h2 className="page-title">{t('my_cart')}</h2>

        {/* Cart Items */}
        <div className="cart-items-container">
          {!cart.length ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add some delicious items to get started!</p>
              <button className="continue-shopping-btn" onClick={() => navigate('/menu')}>Continue Shopping</button>
            </div>
          ) : (
            outletGroups.map(group => (
              <div key={group.outletId}>
                <div className="outlet-section-header">
                  <div className="outlet-header-content">
                    <h3>📍 {group.outletName}</h3>
                    <span className="outlet-item-count">{group.items.length} item(s)</span>
                  </div>
                </div>
                <div className="outlet-items-container">
                  {group.items.map(item => {
                    const idx = cart.indexOf(item);
                    const customText = getCustomizationText(item.customization);
                    const { breakdown, total: perUnitTax } = computeItemTaxAmounts(item);
                    const qty = Number(item.quantity) || 1;

                    return (
                      <div key={`${item.id}-${idx}`} className={`cart-item ${item.requiresAdvancePayment ? 'advance-payment-item' : ''}`}>
                        <div className="cart-item-image" style={{ backgroundImage: `url('${item.image || ''}')` }} />
                        <div className="cart-item-details">
                          <div className="cart-item-name">{item.name}</div>
                          <div className="cart-item-price">{formatCurrency(item.price)} each</div>
                          {customText && <div className="cart-item-customization">{customText}</div>}
                          {breakdown.length > 0 && (
                            <div className="cart-item-taxes">
                              <div style={{ fontWeight: 600, marginTop: 6 }}>Taxes</div>
                              {breakdown.map((t, ti) => (
                                <div key={ti} className="cart-item-tax-row">
                                  <span>{t.name} ({t.rate}%)</span>
                                  <span>{getCurrency()} {(t.amount * qty).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="cart-item-tax-total">
                                <span>Total Tax</span>
                                <span>{getCurrency()} {(perUnitTax * qty).toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="cart-item-controls">
                          <div className="quantity-controls">
                            <button className="quantity-btn" onClick={() => updateQuantity(idx, -1)} disabled={item.quantity <= 1}>-</button>
                            <span className="quantity-display">{item.quantity}</span>
                            <button className="quantity-btn" onClick={() => updateQuantity(idx, 1)}>+</button>
                          </div>
                          <button className="remove-btn" onClick={() => removeFromCart(idx)}>Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        {cart.length > 0 && (
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
            {totals.taxesBreakdown.map((tb, i) => (
              <div key={i} className="summary-row" style={{ fontSize: '0.95rem' }}>
                <span>{tb.name} ({tb.rate}%)</span>
                <span>{formatCurrency(tb.amount)}</span>
              </div>
            ))}
            {!totals.taxesBreakdown.length && <div className="summary-row"><span>Taxes</span><span>{formatCurrency(0)}</span></div>}
            <div className="summary-row"><span>Delivery Fee</span><span>{formatCurrency(0)}</span></div>
            <div className="summary-row" style={{ fontWeight: 600 }}><span>Total Taxes</span><span>{formatCurrency(totals.taxesTotal)}</span></div>
            <div className="summary-row total"><span>Total Amount</span><span>{formatCurrency(totals.total)}</span></div>

            <button className="place-order-btn" onClick={placeOrder}>
              Place Order — {formatCurrency(totals.total)}
            </button>

            <div className="order-actions">
              <button className="action-btn secondary" onClick={() => navigate('/preferences')}>🛒 Continue Shopping</button>
              <button className="action-btn secondary" onClick={clearCart}>🗑️ Clear Cart</button>
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      <div className="loading-overlay" id="loadingOverlay" style={{ display: 'none' }}>
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>Processing...</p>
        </div>
      </div>
    </div>
  );
}
