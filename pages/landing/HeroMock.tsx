import React, { memo, useEffect, useState } from "react";
import { ChartDonut, Flame, TrendUp } from "@phosphor-icons/react";

type HeroMockProps = {
  onReady?: () => void;
};

const HeroMock = memo(function HeroMock({ onReady }: HeroMockProps) {
  const [finance, setFinance] = useState(0);

  useEffect(() => {
    let raf = 0;
    let start = 0;
    const duration = 1600;
    const target = 2340;

    const loop = (now: number) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      setFinance(Math.floor(progress * target));
      if (progress < 1) {
        raf = requestAnimationFrame(loop);
      }
    };

    const play = () => {
      start = 0;
      raf = requestAnimationFrame(loop);
    };

    play();
    const interval = window.setInterval(play, 3200);
    onReady?.();
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
  }, [onReady]);

  return (
    <div className="hero-mock relative w-full max-w-[520px] rounded-[32px] border border-white/10 bg-[#141414] p-6 shadow-[inset_0_1px_0_rgba(193,255,114,0.08)]">
      <div className="absolute -top-4 right-8 rounded-full border border-[#c1ff72]/20 bg-[#0c0c0c] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#c1ff72]">
        instrumento vivo
      </div>

      <div className="grid gap-4">
        <div className="rounded-[24px] border border-white/8 bg-[#101010] p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
            <span>Dashboard</span>
            <ChartDonut size={16} className="text-[#c1ff72]" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <svg className="h-16 w-16" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#c1ff72" />
                  <stop offset="1" stopColor="#c1ff72" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="46" stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
              <circle className="progress-ring" cx="60" cy="60" r="46" stroke="url(#ring)" strokeWidth="10" fill="none" strokeLinecap="round" />
            </svg>
            <div>
              <div className="text-2xl font-semibold text-white">78%</div>
              <div className="text-xs text-white/40">Ritmo da semana</div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#101010] p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
            <span>Hábitos</span>
            <Flame size={16} className="text-[#c1ff72]" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={`day-${i}`} className="streak-dot h-3 w-3 rounded-full bg-white/10" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <div className="mt-3 text-xs text-white/50">Sequência ativa: 12 dias</div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-[#101010] p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/40">
            <span>Finanças</span>
            <TrendUp size={16} className="text-[#c1ff72]" />
          </div>
          <div className="mt-4 font-mono text-2xl text-[#c1ff72]">
            R${finance.toLocaleString("pt-BR")}
          </div>
          <div className="mt-1 text-xs text-white/40">Saldo do mês</div>
        </div>
      </div>

      <style>{`
        .hero-mock { animation: mockFloat 4s ease-in-out infinite; }
        @keyframes mockFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .progress-ring { stroke-dasharray: 289; stroke-dashoffset: 220; transform-origin: 50% 50%; transform: rotate(-90deg); animation: ringPulse 4s ease-in-out infinite; }
        @keyframes ringPulse { 0% { stroke-dashoffset: 220; opacity: 0.6; } 50% { stroke-dashoffset: 120; opacity: 1; } 100% { stroke-dashoffset: 220; opacity: 0.6; } }
        .streak-dot { animation: streak 1.6s ease-in-out infinite; }
        @keyframes streak { 0%, 100% { background: rgba(255,255,255,0.1); transform: scale(1); } 50% { background: #c1ff72; transform: scale(1.1); } }
      `}</style>
    </div>
  );
});

export default HeroMock;
