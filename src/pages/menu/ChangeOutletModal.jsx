import React from 'react';
import { useLang } from '../../context/LangContext';

export default function ChangeOutletModal({ onClose, onChangeOutlet, onChangeCategory }) {
  const { t } = useLang();
  return (
    <div className="co-overlay" onClick={e => { if (e.target.className === 'co-overlay') onClose(); }}>
      <div className="co-modal">
        <h3 className="co-title">{t('change_selection')}</h3>
        <button className="co-btn co-btn--blue" onClick={onChangeOutlet}>
          🏨 {t('change_outlet')}
        </button>
        <button className="co-btn co-btn--green" onClick={onChangeCategory}>
          📋 {t('change_category')}
        </button>
      </div>
    </div>
  );
}
