import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config';
import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';
import ThemeLangBar from '../components/ThemeLangBar';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { isDark } = useTheme();
  const [hotelId,    setHotelId]    = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [lastName,   setLastName]   = useState('');
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('hotel_id')) setHotelId(p.get('hotel_id'));
    if (p.get('room'))     setRoomNumber(p.get('room'));
  }, []);

  function redirectToPreferences(hid, room, hotelName) {
    const p = new URLSearchParams({ hotel_id: hid, room });
    if (hotelName) p.append('hotelName', hotelName);
    navigate(`/preferences?${p.toString()}`);
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!hotelId.trim())    { alert('Please enter Hotel ID');    return; }
    if (!roomNumber.trim()) { alert('Please enter Room Number'); return; }
    if (!lastName.trim())   { alert('Please enter Last Name');   return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/guests/qrlogin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomNumber.trim(), lastName: lastName.trim(), hotelId: hotelId.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      const token = data?.token || data?.authToken || data?.data?.token || data?.jwt;
      if (!token) throw new Error('Authentication failed.');

      const payload = { roomNumber: roomNumber.trim(), confirmationNumber: lastName.trim(), hotelId: hotelId.trim(), lastName: lastName.trim(), token, guestName: data.guestName || data.name || lastName.trim(), ...data };
      localStorage.setItem('userData',    JSON.stringify(payload));
      localStorage.setItem('hotel_id',    hotelId.trim());
      localStorage.setItem('roomNumber',  roomNumber.trim());
      localStorage.setItem('sessionData', JSON.stringify({ loginTime: new Date().toISOString(), lastActivity: new Date().toISOString() }));

      try {
        const hr   = await fetch(`${API_BASE}/api/orders/history?page=1&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
        const hraw = await hr.json().catch(() => null);
        const hist = (Array.isArray(hraw) && hraw) || hraw?.data || hraw?.orders || [];
        localStorage.setItem('orderHistory', JSON.stringify(hist));
      } catch(_) {}

      redirectToPreferences(hotelId.trim(), roomNumber.trim(), data?.guest?.hotel_name || data?.hotelName || 'Hotel');
    } catch(err) {
      alert(err.message || 'Login failed. Please check your details.');
    } finally { setLoading(false); }
  }

  return (
    <div className={`lgn-wrap ${isDark ? 'lgn-wrap--dark' : ''}`}>
      {/* Theme/Lang selector top-right */}
      <div className="lgn-topbar">
        <ThemeLangBar />
      </div>

      <div className="lgn-card">
        <div className="lgn-logo">
          <img src="https://www.hotelogix.com/wp-content/themes/hotelogix/images/hotelogix-logo.svg" alt="HotelOGIX" onError={e => e.target.style.display='none'} />
        </div>

        <h1 className="lgn-title">{t('order_online')}</h1>
        <p className="lgn-sub">{t('login_subtitle')}</p>

        <div className="lgn-form">
          <div className="lgn-group">
            <label>{t('hotel_id')} *</label>
            <input type="text" placeholder="e.g. HTL123" value={hotelId} onChange={e=>setHotelId(e.target.value)} disabled={loading} autoFocus={!hotelId} />
          </div>
          <div className="lgn-group">
            <label>{t('room_number')} *</label>
            <input type="text" placeholder="e.g. 204" value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} disabled={loading} />
          </div>
          <div className="lgn-group">
            <label>{t('last_name')} *</label>
            <input type="text" placeholder="e.g. Sharma" value={lastName} onChange={e=>setLastName(e.target.value)} disabled={loading} onKeyDown={e=>e.key==='Enter'&&handleLogin(e)} />
          </div>
          <button className="lgn-btn" onClick={handleLogin} disabled={loading}>
            {loading ? <><span className="lgn-spinner"/>Verifying…</> : t('login_btn')}
          </button>
        </div>

        <p className="lgn-support">
          {t('need_help')}{' '}
          <a href="#" onClick={e=>{e.preventDefault();alert('Support: +91 98765 43210');}}>
            {t('contact_support')}
          </a>
        </p>
      </div>
    </div>
  );
}
