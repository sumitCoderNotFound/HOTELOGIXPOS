import React, { useState, useEffect } from 'react';

const safeJSON = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };

export default function HeroCarousel({ outletData }) {
  const [slide, setSlide] = useState(0);

  const slides = outletData?.images?.length
    ? outletData.images
    : [
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=80',
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1400&q=80',
      ];

  const total = slides.length;

  useEffect(() => {
    const tm = setInterval(() => setSlide(s => (s + 1) % total), 5000);
    return () => clearInterval(tm);
  }, [total]);

  const hotelName = safeJSON(localStorage.getItem('userData'), {})?.guest?.hotel_name || 'Hotel';

  return (
    <div className="hero">
      {slides.map((src, i) => (
        <div key={i}
          className={`hero__slide ${i === slide ? 'hero__slide--on' : ''}`}
          style={{ backgroundImage: `url('${typeof src === 'string' ? src : src.url || ''}')` }}
        />
      ))}
      <div className="hero__overlay" />
      <div className="hero__content">
        <h1 className="hero__hotel">{hotelName}</h1>
        <p className="hero__outlet">{outletData?.name || 'Restaurant'}</p>
        <p className="hero__timing">{outletData?.timing || '6:00 AM – 11:00 PM'}</p>
      </div>
      <button className="hero__arr hero__arr--l" onClick={() => setSlide(s => (s - 1 + total) % total)}>‹</button>
      <button className="hero__arr hero__arr--r" onClick={() => setSlide(s => (s + 1) % total)}>›</button>
      <div className="hero__dots">
        {slides.map((_, i) => (
          <span key={i} className={`hero__dot ${i === slide ? 'hero__dot--on' : ''}`} onClick={() => setSlide(i)} />
        ))}
      </div>
    </div>
  );
}
