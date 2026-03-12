import React, { useState } from 'react';

export default function CustomizeModal({ item, onClose, onSave }) {
  const [spice, setSpice] = useState('');
  const [notes, setNotes] = useState('');

  if (!item) return null;

  const spiceOptions = [
    { id: 'mild',      label: '🟢 Mild'      },
    { id: 'medium',    label: '🟡 Medium'    },
    { id: 'hot',       label: '🔴 Hot'       },
    { id: 'extra-hot', label: '🌶️ Extra Hot' },
  ];

  return (
    <div className="cust-overlay" onClick={e => { if (e.target.classList.contains('cust-overlay')) onClose(); }}>
      <div className="cust-modal">
        <div className="cust-header">
          <h2 className="cust-title">Customize Your Order</h2>
          <button className="cust-close" onClick={onClose}>✕</button>
        </div>
        <div className="cust-body">
          <div className="cust-section">
            <label className="cust-label">Special Instructions</label>
            <input
              type="text"
              className="cust-input"
              placeholder="Any special requests?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div className="cust-section">
            <label className="cust-label">Spice Level</label>
            <div className="cust-spice-grid">
              {spiceOptions.map(s => (
                <button key={s.id}
                  className={`cust-spice-btn ${spice === s.id ? 'cust-spice-btn--on' : ''}`}
                  onClick={() => setSpice(spice === s.id ? '' : s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="cust-section">
            <label className="cust-label">Additional Notes</label>
            <textarea
              className="cust-textarea"
              placeholder="Any other preferences?"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="cust-footer">
          <button className="cust-cancel" onClick={onClose}>Cancel</button>
          <button className="cust-save" onClick={() => { onSave(item.id, { spice, notes }); onClose(); }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
