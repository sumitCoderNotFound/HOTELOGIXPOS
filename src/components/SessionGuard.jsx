import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, logout } from '../utils/session';
import './SessionGuard.css';

/* ── Global session event ── */
export function triggerUnauthorized() {
  window.dispatchEvent(new CustomEvent('pos:unauthorized'));
}
export function triggerSessionExpired() {
  window.dispatchEvent(new CustomEvent('pos:session-expired'));
}

/* ── SessionGuard wraps the whole app ── */
export default function SessionGuard({ children }) {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // null | 'unauthorized' | 'expired'

  const handleUnauthorized = useCallback(() => setModal('unauthorized'), []);
  const handleExpired      = useCallback(() => setModal('expired'),      []);

  useEffect(() => {
    window.addEventListener('pos:unauthorized',   handleUnauthorized);
    window.addEventListener('pos:session-expired', handleExpired);
    return () => {
      window.removeEventListener('pos:unauthorized',   handleUnauthorized);
      window.removeEventListener('pos:session-expired', handleExpired);
    };
  }, [handleUnauthorized, handleExpired]);

  // Check session on route change
  useEffect(() => {
    const path = window.location.pathname;
    const publicRoutes = ['/', '/login', '/verify'];
    if (!publicRoutes.includes(path) && !isLoggedIn()) {
      setModal('expired');
    }
  }, []);

  function handleLogout() {
    setModal(null);
    logout(navigate);
  }

  function handleContinue() {
    setModal(null);
    navigate(-1);
  }

  return (
    <>
      {children}
      {modal && (
        <div className="sg-overlay">
          <div className="sg-modal">
            <div className="sg-icon">{modal === 'expired' ? '⏱️' : '🔒'}</div>
            <h2 className="sg-title">
              {modal === 'expired' ? 'Session Expired' : 'Access Denied'}
            </h2>
            <p className="sg-msg">
              {modal === 'expired'
                ? 'Your session has expired. Please log in again to continue.'
                : 'You are not authorized to access this page.'}
            </p>
            <div className="sg-actions">
              <button className="sg-btn sg-btn--primary" onClick={handleLogout}>
                🚪 Log In Again
              </button>
              {modal === 'unauthorized' && (
                <button className="sg-btn sg-btn--ghost" onClick={handleContinue}>
                  ← Go Back
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}