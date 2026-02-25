import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Cursor, Flame } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type SpotlightCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
};

const SpotlightCard = memo(function SpotlightCard({ title, description, children, className }: SpotlightCardProps) {
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div className="group" onMouseMove={handleMove}>
      <div className={`relative overflow-hidden rounded-[28px] border border-white/6 bg-[#141414] p-8 ${className ?? ""}`}>
        <span className="spotlight absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {children}
      </div>
      <div className="mt-4">
        <div className="text-base font-semibold text-white">{title}</div>
        <div className="text-sm text-white/40">{description}</div>
      </div>
    </div>
  );
});

const RoutineShuffler = memo(function RoutineShuffler() {
  const [cards, setCards] = useState([
    "Supino — 4x8 — 80kg",
    "Corrida — 5km — 34min",
    "Hábito: Meditação — 7 dias",
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCards((prev) => {
        const next = [...prev];
        const last = next.pop();
        if (last) next.unshift(last);
        return next;
      });
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[220px]">
      {cards.map((text, index) => (
        <motion.div
          key={text}
          layout
          layoutId={text}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute left-0 right-0 rounded-[22px] border border-[#c1ff72]/15 bg-[#0f0f0f] p-4 text-sm text-white/80"
          style={{ top: 12 + index * 26, zIndex: 3 - index }}
        >
          {text}
        </motion.div>
      ))}
    </div>
  );
});

const FinanceTelemetry = memo(function FinanceTelemetry() {
  return (
    <div className="space-y-3 font-mono text-sm text-white/70">
      <div className="flex items-center justify-between"><span>Receitas</span><span className="text-[#c1ff72]">R$4.280</span></div>
      <div className="flex items-center justify-between"><span>Despesas</span><span>R$1.940</span></div>
      <div className="flex items-center justify-between"><span>Saldo</span><span className="text-[#c1ff72]">R$2.340</span></div>
      <div className="flex items-center gap-2 text-xs text-white/40">
        <span className="sync-dot h-2 w-2 rounded-full bg-[#c1ff72]" />
        Sincronizando<span className="cursor">|</span>
      </div>
    </div>
  );
});

const TaskProtocol = memo(function TaskProtocol() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const targetDayRef = useRef<HTMLDivElement>(null);
  const taskRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || !cursorRef.current || !targetDayRef.current || !taskRef.current || !buttonRef.current) return;

    const ctx = gsap.context(() => {
      const wrapper = wrapperRef.current!;
      const cursor = cursorRef.current!;
      const day = targetDayRef.current!;
      const task = taskRef.current!;
      const button = buttonRef.current!;

      const rect = wrapper.getBoundingClientRect();
      const toRelative = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 };
      };

      const dayPos = toRelative(day);
      const taskPos = toRelative(task);
      const buttonPos = toRelative(button);

      gsap.set(cursor, { x: 20, y: 20, opacity: 0 });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.2 });
      tl.to(cursor, { opacity: 1, duration: 0.3 })
        .to(cursor, { x: dayPos.x, y: dayPos.y, duration: 0.8, ease: "power2.out" })
        .to(day, { scale: 0.9, duration: 0.15, yoyo: true, repeat: 1 })
        .to(task, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
        .to(cursor, { x: buttonPos.x, y: buttonPos.y, duration: 0.8, ease: "power2.out" })
        .to(button, { scale: 0.92, duration: 0.12, yoyo: true, repeat: 1 })
        .to(cursor, { opacity: 0, duration: 0.3 });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-[220px]">
      <div className="grid grid-cols-7 gap-2 text-xs text-white/40">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <div key={d} ref={i === 2 ? targetDayRef : undefined} className="flex h-8 items-center justify-center rounded-full border border-white/10">{d}</div>
        ))}
      </div>
      <div ref={taskRef} className="mt-6 rounded-[16px] border border-white/10 bg-[#0f0f0f] p-3 text-xs text-white/70 opacity-0 translate-y-2">
        Revisar metas da semana
      </div>
      <button ref={buttonRef} type="button" className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">Salvar</button>
      <div ref={cursorRef} className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#0c0c0c]">
        <Cursor size={14} className="text-[#c1ff72]" />
      </div>
    </div>
  );
});

const StreakDashboard = memo(function StreakDashboard() {
  const rows = useMemo(() => ["Treino", "Leitura", "Água", "Sono", "Foco", "Respiração"], []);

  return (
    <div className="space-y-4">
      {rows.map((label, rowIndex) => (
        <div key={label} className="relative">
          <div className="mb-2 flex items-center gap-2 text-xs text-white/50">
            <Flame size={14} className="text-[#c1ff72]" />
            {label}
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={`${label}-${i}`} className="streak-cell h-2 w-2 rounded-full bg-white/10" style={{ animationDelay: `${(i + rowIndex) * 0.05}s` }} />
            ))}
          </div>
          <span className="streak-shimmer" />
        </div>
      ))}
      <div className="mt-4 font-mono text-sm text-white/70">
        <span className="text-[#c1ff72]">23 dias</span> sem quebrar o ritmo
      </div>
    </div>
  );
});

const InsightFeed = memo(function InsightFeed() {
  const messages = useMemo(() => [
    "Analisando sua semana...",
    "Você completou 6 de 7 hábitos.",
    "Meta financeira: 87% atingida.",
    "Treino de hoje: Superiores às 18h.",
  ], []);
  const [display, setDisplay] = useState("");
  const [index, setIndex] = useState(0);
  const [char, setChar] = useState(0);

  useEffect(() => {
    const current = messages[index];
    const timeout = window.setTimeout(() => {
      if (char < current.length) {
        setDisplay(current.slice(0, char + 1));
        setChar((c) => c + 1);
      } else {
        setTimeout(() => {
          setChar(0);
          setIndex((i) => (i + 1) % messages.length);
          setDisplay("");
        }, 1200);
      }
    }, 40);
    return () => window.clearTimeout(timeout);
  }, [char, index, messages]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <span className="sync-dot h-2 w-2 rounded-full bg-[#c1ff72]" />
        Dashboard ao vivo
      </div>
      <div className="font-mono text-sm text-white/70">
        {display}<span className="cursor">|</span>
      </div>
    </div>
  );
});

const BentoCards = memo(function BentoCards() {
  const container = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="space-y-6">
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <motion.div variants={item}>
          <SpotlightCard title="Intelligent Routine Shuffler" description="Treinos e hábitos se reorganizando em tempo real.">
            <RoutineShuffler />
          </SpotlightCard>
        </motion.div>
        <motion.div variants={item}>
          <SpotlightCard title="Live Finance Telemetry" description="Finanças ao vivo, sem ruído.">
            <FinanceTelemetry />
          </SpotlightCard>
        </motion.div>
        <motion.div variants={item} className="md:col-span-2">
          <div className="grid gap-6 md:grid-cols-[1fr_2fr_1fr]">
            <SpotlightCard title="Task Protocol Scheduler" description="Tarefas e projetos em sequência.">
              <TaskProtocol />
            </SpotlightCard>
            <SpotlightCard title="Streak Dashboard" description="Hábitos que viram consistência real.">
              <StreakDashboard />
            </SpotlightCard>
            <SpotlightCard title="AI Insight Feed" description="Dashboard inteligente com alertas precisos.">
              <InsightFeed />
            </SpotlightCard>
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .spotlight { background: radial-gradient(320px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(193,255,114,0.18), transparent 50%); pointer-events: none; }
        .cursor { animation: blink 1s steps(2, start) infinite; color: #c1ff72; }
        .sync-dot { animation: pulse 2s ease-in-out infinite; }
        .streak-cell { animation: streakFill 2.4s ease-in-out infinite; }
        .streak-shimmer { position: absolute; left: 0; right: 0; top: 20px; height: 10px; background: linear-gradient(90deg, transparent, rgba(193,255,114,0.25), transparent); opacity: 0.6; animation: shimmer 2.6s linear infinite; }
        @keyframes blink { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.6); opacity: 1; } }
        @keyframes streakFill { 0%, 100% { background: rgba(255,255,255,0.08); } 50% { background: #c1ff72; } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
});

export default BentoCards;
