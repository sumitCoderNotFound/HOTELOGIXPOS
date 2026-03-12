import React from 'react';

export const NUTRI = [
  { key:'calories', keys:['calories','calorie','kcal'],               emoji:'🔥', label:'cal',     bg:'#fef9c3', border:'#fde047', text:'#92400e' },
  { key:'protein',  keys:['protein_g','protein','proteins'],          emoji:'💪', label:'protein', bg:'#dcfce7', border:'#86efac', text:'#166534' },
  { key:'carbs',    keys:['carbs_g','carbs','carbohydrates','carb'],  emoji:'🍞', label:'carbs',   bg:'#ffedd5', border:'#fdba74', text:'#9a3412' },
  { key:'fat',      keys:['fat_g','fat','fats','total_fat'],          emoji:'🥑', label:'fat',     bg:'#f3e8ff', border:'#d8b4fe', text:'#6b21a8' },
  { key:'fiber',    keys:['fiber_g','fiber','dietary_fiber'],         emoji:'🌿', label:'fiber',   bg:'#dcfce7', border:'#4ade80', text:'#14532d' },
  { key:'sodium',   keys:['sodium_mg','sodium'],                      emoji:'🧂', label:'Na mg',   bg:'#e0f2fe', border:'#7dd3fc', text:'#0c4a6e' },
  { key:'sugar',    keys:['sugar_g','sugar'],                         emoji:'🍬', label:'sugar',   bg:'#ffe4e6', border:'#fda4af', text:'#9f1239' },
];

export const getNV = (item, n) => {
  for (const k of n.keys) { if (item[k] != null) return item[k]; }
  return null;
};

export default function NutriPills({ item, animate }) {
  const visible = NUTRI.filter(n => getNV(item, n) != null);
  if (!visible.length) return null;
  return (
    <div className={`nutri-row${animate ? ' nutri-row--anim' : ''}`}>
      {visible.map((n, i) => {
        const val = getNV(item, n);
        return (
          <div key={n.key} className="nutri-pill"
            style={{ background: n.bg, borderColor: n.border, animationDelay: `${i * 55}ms` }}>
            <span>{n.emoji}</span>
            <span className="np__val" style={{ color: n.text }}>
              {val}{n.label === 'cal' || n.label === 'Na mg' ? '' : 'g'}
            </span>
            <span className="np__lbl" style={{ color: n.text }}>{n.label}</span>
          </div>
        );
      })}
    </div>
  );
}
