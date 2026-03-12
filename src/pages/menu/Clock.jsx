import React, { useState, useEffect } from 'react';

export default function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div className="clock-pill">
      <span className="clock-time">
        {now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}
      </span>
      <span className="clock-date">
        {days[now.getDay()]} {now.getDate()} {months[now.getMonth()]}
      </span>
    </div>
  );
}
