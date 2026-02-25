import React, { memo } from "react";

const modules = [
  "Treinos & Fitness",
  "Tarefas",
  "Projetos",
  "Finanças",
  "Hábitos com Streaks",
  "Calendário",
  "Dashboard Inteligente",
];

const MarqueeStrip = memo(function MarqueeStrip() {
  return (
    <div className="marquee border-y border-white/5">
      <div className="marquee-track">
        {[...modules, ...modules].map((label, index) => (
          <div key={`${label}-${index}`} className="marquee-item">
            <span>{label}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="#c1ff72" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
});

export default MarqueeStrip;
