import React from 'react';
import { useLang } from '../../context/LangContext';

const safeJSON = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };

export default function ProfileModal({ userData, onClose, onHistory }) {
  const { t } = useLang();
  const name   = userData?.guestName || userData?.guest?.guest_name || 'Guest';
  const room   = userData?.guest?.guestRoomId || userData?.guest?.room || userData?.roomNumber || 'N/A';
  const outlet = safeJSON(localStorage.getItem('outlet'), {})?.name || '—';

  return (
    <div className="pm-overlay" onClick={e => { if (e.target.classList.contains('pm-overlay')) onClose(); }}>
      <div className="pm">
        <button className="pm__close" onClick={onClose}>✕</button>
        <div className="pm__hero">
          <div className="pm__av">{name.charAt(0).toUpperCase()}</div>
          <h2 className="pm__name">{name}</h2>
          <p className="pm__sub">{t('room')} {room}</p>
        </div>
        <div className="pm__rows">
          {[
            [t('guest_name'),    name],
            [t('room_no'),       room],
            [t('current_outlet'),outlet],
          ].map(([k, v]) => (
            <div key={k} className="pm__row">
              <span className="pm__lbl">{k}</span>
              <span className="pm__val">{v}</span>
            </div>
          ))}
        </div>
        <div className="pm__foot">
          <button className="pm__hist" onClick={onHistory}>📋 {t('order_history')}</button>
        </div>
      </div>
    </div>
  );
}
