import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Check, Lock, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Logo } from "../components/shared/Logo";
import HeroMock from "./landing/HeroMock";
import BentoCards from "./landing/BentoCards";
import MagneticButton from "./landing/MagneticButton";
import MarqueeStrip from "./landing/MarqueeStrip";
import PhoneMockup from "./landing/PhoneMockup";
import AssistantMockup from "./landing/AssistantMockup";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 7, label: "módulos", sub: "em uma única visão" },
  { value: 3, label: "dias", sub: "para provar valor real" },
  { value: 100, label: "%", sub: "focado em reduzir ruído" },
];

const pricing = [
  {
    name: "Free",
    slug: "free",
    price: "Grátis",
    highlight: false,
    perks: [
      "Dashboard básico",
      "Até 3 treinos salvos",
      "Controle financeiro básico",
      "Até 5 hábitos",
      "Até 10 tarefas",
      "Calendário integrado",
    ],
    cta: "Criar Conta Grátis",
  },
  {
    name: "Pro",
    slug: "pro",
    price: "R$ 19,99/mês",
    highlight: false,
    perks: [
      "Dashboard inteligente",
      "Treinos e nutrição ilimitados",
      "Controle financeiro avançado",
      "Hábitos ilimitados",
      "Projetos e tarefas sem limites",
      "Calendário integrado",
      "Relatórios e metas",
      "Sem anúncios invasivos",
    ],
    cta: "Inicie sua transformação",
  },
  {
    name: "Elite",
    slug: "elite",
    price: "R$ 39,99/mês",
    highlight: true,
    perks: [
      "Tudo do Pro",
      "Assistente via WhatsApp",
      "Lembretes personalizados",
      "Suporte VIP",
    ],
    cta: "Para quem não tem tempo a perder",
  },
];

const steps = [
  {
    title: "Centralize sua rotina",
    desc: "Traga tarefas, hábitos e finanças para um único painel com clareza real.",
    meta: "Setup em 3 minutos",
  },
  {
    title: "Defina o foco do dia",
    desc: "O Corelys prioriza o que importa agora e reduz o ruído do resto.",
    meta: "Planejamento em 60 segundos",
  },
  {
    title: "Execute com segurança",
    desc: "Tudo rastreado, com dados protegidos e progresso visível em tempo real.",
    meta: "Sem cartão, sem risco",
  },
];

const testimonials = [
  {
    quote: "Em uma semana, minha rotina parou de brigar comigo. Hoje eu sei exatamente onde focar.",
    name: "Camila Torres",
    role: "Consultora de operações",
    image: "https://i.pravatar.cc/150?img=5",
  },
  {
    quote: "O painel diário virou minha primeira checagem da manhã. Ganhei tempo sem perder controle.",
    name: "Rafael Moreira",
    role: "Líder de produto",
    image: "https://i.pravatar.cc/150?img=11",
  },
  {
    quote: "Nada disperso. Tudo integrado. O Corelys virou o meu centro de comando.",
    name: "Bruna Azevedo",
    role: "Gestora de projetos",
    image: "https://i.pravatar.cc/150?img=9",
  },
];

const trustPoints = [
  {
    title: "Privacidade real",
    desc: "Seus dados permanecem seus. Criptografia de ponta a ponta e controle total.",
  },
  {
    title: "Tempo protegido",
    desc: "Configuração rápida, zero burocracia e cancelamento imediato quando você decidir.",
  },
  {
    title: "Transparência completa",
    desc: "Sem contrato, sem surpresa de cobrança e sem anúncios invasivos.",
  },
];

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const GrainOverlay = memo(function GrainOverlay() {
  return <div className="grain fixed inset-0 pointer-events-none" aria-hidden="true" />;
});

const HeroBadge = memo(function HeroBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60">
      <span className="pulse-dot h-2 w-2 rounded-full bg-[#c1ff72]" />
      Para quem precisa de resultado agora
    </div>
  );
});

const Navbar = memo(function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-6 z-50 flex justify-center">
      <div
        className={`flex w-[92%] max-w-[900px] items-center justify-between rounded-full px-6 py-3 transition-all duration-300 ${
          scrolled
            ? "border border-white/8 bg-white/5 backdrop-blur-xl"
            : "border border-transparent bg-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <span className="text-sm font-semibold tracking-tight text-white">Corelys</span>
        </div>
        <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/60 md:flex">
          <button type="button" onClick={() => smoothScrollTo("features")}>Funcionalidades</button>
          <button type="button" onClick={() => smoothScrollTo("pricing")}>Preços</button>
          <a href="#/login">Entrar</a>
        </nav>
        <div className="hidden md:block">
          <MagneticButton label="Teste Grátis 3 Dias" href="#/register" />
        </div>
        <button type="button" className="md:hidden" onClick={() => setOpen((prev) => !prev)} aria-label="Menu">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10">
            <div className="space-y-1">
              <span className="block h-[2px] w-4 bg-white" />
              <span className="block h-[2px] w-4 bg-white/60" />
            </div>
          </div>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute top-16 w-[92%] max-w-[900px] rounded-[24px] border border-white/10 bg-[#101010] px-6 py-5 backdrop-blur"
          >
            <div className="flex flex-col gap-4 text-sm text-white/70">
              <button type="button" onClick={() => { smoothScrollTo("features"); setOpen(false); }}>Funcionalidades</button>
              <button type="button" onClick={() => { smoothScrollTo("pricing"); setOpen(false); }}>Preços</button>
              <a href="#/login">Entrar</a>
              <MagneticButton label="Teste Grátis 3 Dias" href="#/register" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
});

const Hero = memo(function Hero() {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };
  const item = {
    hidden: { y: 40, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6 } },
  };

  return (
    <section className="relative min-h-[100dvh] overflow-hidden pt-28">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#c1ff72]/5 blur-[200px]" />
      </div>
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 py-12 md:grid-cols-[1.1fr_0.9fr] md:px-8">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
          <motion.div variants={item}><HeroBadge /></motion.div>
          <div className="space-y-2">
            <motion.h1 variants={item} className="text-6xl font-black tracking-tighter text-[#f5f5f5] md:text-8xl">Pare de sobreviver</motion.h1>
            <motion.h1 variants={item} className="text-6xl font-black tracking-tighter text-[#f5f5f5] md:text-8xl">ao dia.</motion.h1>
            <motion.h1 variants={item} className="text-6xl font-black italic tracking-tighter text-[#c1ff72] md:text-8xl">Comece a dominá-lo.</motion.h1>
          </div>
          <motion.p variants={item} className="max-w-[45ch] text-lg text-white/40">
            Corelys coloca sua rotina no trilho em minutos. Você vê o que importa, executa e acompanha o resultado.
          </motion.p>
          <motion.div variants={item} className="flex flex-wrap items-center gap-4">
            <MagneticButton label="Desbloquear Meus 3 Dias Grátis" href="#/register" />
            <a href="#/login" className="text-sm text-white/60 hover:text-white">Já tenho conta →</a>
          </motion.div>
          <motion.div variants={item} className="flex flex-col gap-3">
            <div className="flex -space-x-3">
              {[
                "/avatars/hero_1.png",
                "/avatars/hero_2.png",
                "/avatars/hero_3.png",
                "/avatars/hero_4.png",
              ].map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Avatar ${i}`}
                  className="h-10 w-10 rounded-full border-2 border-[#0c0c0c] bg-[#141414] object-cover"
                />
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0c0c0c] bg-[#141414] text-xs text-white/70">
                +2k
              </div>
            </div>
            <div className="text-sm text-white/50">
              <span className="text-[#c1ff72]">⭐⭐⭐⭐⭐</span> Junte-se a operacionais de alta performance.
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/40 mt-2">
              sem cartão · cancele quando quiser
            </div>
          </motion.div>
        </motion.div>
        <div className="flex justify-center md:justify-end">
          <HeroMock />
        </div>
      </div>
    </section>
  );
});

const StatsSection = memo(function StatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="grid gap-8 border-y border-white/8 py-10 md:grid-cols-3 md:gap-12">
        {stats.map((stat) => (
          <StatCounter key={stat.label} value={stat.value} label={stat.label} sub={stat.sub} />
        ))}
      </div>
    </section>
  );
});

type StatCounterProps = { value: number; label: string; sub: string };

const StatCounter = memo(function StatCounter({ value, label, sub }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCurrent(Math.floor(progress * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <div ref={ref} className="space-y-3 border-white/8 md:border-r md:last:border-r-0">
      <div className="font-mono text-5xl font-black text-[#c1ff72] md:text-7xl">{current} {label}</div>
      <div className="text-xs uppercase tracking-[0.3em] text-white/30">{sub}</div>
    </div>
  );
});

const Manifesto = memo(function Manifesto() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardOneRef = useRef<HTMLDivElement>(null);
  const cardTwoRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);

  const words = useMemo(() => "Você tem apps de treino. Apps de finanças. Apps de tarefas.".split(" "), []);

  useEffect(() => {
    const container = containerRef.current;
    const cardOne = cardOneRef.current;
    const cardTwo = cardTwoRef.current;
    const split = splitRef.current;
    if (!container || !cardOne || !cardTwo || !split) return;

    const ctx = gsap.context(() => {
      gsap.set(cardTwo, { y: 80, opacity: 0 });
      gsap.timeline({
        scrollTrigger: { trigger: container, start: "top top", end: "bottom top", scrub: true },
      })
        .to(cardOne, { scale: 0.92, opacity: 0.6 })
        .to(cardTwo, { y: 0, opacity: 1 }, 0.2);

      gsap.fromTo(
        split.querySelectorAll("span"),
        { y: 24, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.06, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: split, start: "top 80%" },
        }
      );
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="relative h-[110vh]">
          <div className="sticky top-24 grid gap-6">
            <div ref={cardOneRef} className="rounded-[36px] border border-white/6 bg-[#0c0c0c] p-10">
              <div className="text-sm uppercase tracking-[0.3em] text-white/40">Manifesto</div>
              <div ref={splitRef} className="mt-6 flex flex-wrap gap-x-2 text-3xl md:text-5xl font-semibold text-white/60">
                {words.map((word, i) => (<span key={`${word}-${i}`} className="inline-block">{word}</span>))}
              </div>
              <div className="mt-6 text-5xl font-black text-[#c1ff72] md:text-6xl">Mas eles não se falam.</div>
            </div>
            <div ref={cardTwoRef} className="rounded-[36px] border border-white/6 bg-[#141414] p-10">
              <div className="text-sm uppercase tracking-[0.3em] text-white/40">Corelys</div>
              <div className="mt-6 text-4xl md:text-6xl font-black text-white">O Corelys é o sistema operacional da sua rotina.</div>
              <div className="mt-4 text-sm text-white/40">Tudo conectado. Tudo inteligente. Tudo seu.</div>
              <div className="relative mt-10 h-48">
                <div className="absolute left-8 top-10 h-28 w-28 rounded-full border border-[#c1ff72]/30 bg-[#c1ff72]/10" />
                <div className="absolute left-20 top-6 h-28 w-28 rounded-full border border-[#c1ff72]/30 bg-[#c1ff72]/10" />
                <div className="absolute left-14 top-20 h-28 w-28 rounded-full border border-[#c1ff72]/30 bg-[#c1ff72]/10" />
                <div className="absolute left-8 top-10 h-28 w-28 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-white/70">Corpo</div>
                <div className="absolute left-20 top-6 h-28 w-28 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-white/70">Mente</div>
                <div className="absolute left-14 top-20 h-28 w-28 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-white/70">Finanças</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

const StepsSection = memo(function StepsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-10">
        <div className="text-sm uppercase tracking-[0.2em] text-white/40">Como funciona</div>
        <div className="text-3xl md:text-4xl font-semibold text-white">Ganhe tempo em 3 passos</div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-[28px] border border-white/6 bg-[#141414] p-6">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">Passo</div>
              <div className="font-mono text-lg text-[#c1ff72]">0{index + 1}</div>
            </div>
            <div className="mt-4 text-lg font-semibold text-white">{step.title}</div>
            <div className="mt-2 text-sm text-white/40">{step.desc}</div>
            <div className="mt-6 text-xs uppercase tracking-[0.2em] text-white/50">{step.meta}</div>
          </div>
        ))}
      </div>
    </section>
  );
});

const TrustSection = memo(function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="grid gap-8 rounded-[36px] border border-[#c1ff72]/20 bg-[#141414] px-6 py-10 md:grid-cols-[1.2fr_1fr] md:px-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c1ff72]/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="text-sm uppercase tracking-[0.2em] text-[#c1ff72]/70 flex items-center gap-2">
            <ShieldCheck size={16} /> 100% Livre de Risco
          </div>
          <div className="mt-3 text-3xl md:text-5xl font-semibold text-white leading-tight">
            Se sua semana não virar o jogo em 3 dias, a gente não merece você.
          </div>
          <p className="mt-6 text-base text-white/40 max-w-md">
            Experimente o Corelys sem amarras. Você ganha acesso premium imediatamente e se não amar os resultados, é só ignorar. Cancele com 1 clique, sem dor de cabeça.
          </p>
        </div>
        <div className="space-y-4 relative z-10">
          {trustPoints.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-white/6 bg-[#0c0c0c] p-5">
              <div className="text-sm font-semibold text-white">{item.title}</div>
              <div className="mt-2 text-sm text-white/40">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

const TestimonialsSection = memo(function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-10">
        <div className="text-sm uppercase tracking-[0.2em] text-white/40">Prova real</div>
        <div className="text-3xl md:text-4xl font-semibold text-white">Resultados reais, sem promessa vazia</div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((item) => (
          <div key={item.name} className="rounded-[28px] border border-white/6 bg-[#141414] p-6 flex flex-col justify-between">
            <div className="text-sm text-white/70 italic mb-6">"{item.quote}"</div>
            <div className="flex items-center gap-3">
              <img src={item.image} alt={item.name} className="h-10 w-10 rounded-full border border-white/10 object-cover" />
              <div>
                <div className="text-sm font-semibold text-white">{item.name}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">{item.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

const PricingSection = memo(function PricingSection() {
  const container = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.12 } },
  };
  const item = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } },
  };

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-10">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/40">
          <span className="h-[2px] w-8 bg-[#c1ff72]" />
          Planos
        </div>
        <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-white">Escolha seu ritmo</h2>
      </div>
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="mx-auto grid max-w-[1100px] gap-6 md:grid-cols-3">
        {pricing.map((plan) => (
          <motion.div
            key={plan.name}
            variants={item}
            className={plan.highlight
              ? "relative rounded-[32px] border border-[#c1ff72]/25 bg-[#141414] p-10 backdrop-blur-sm shadow-[0_0_80px_rgba(193,255,114,0.06),inset_0_1px_0_rgba(193,255,114,0.08)]"
              : "rounded-[32px] border border-white/8 bg-[#141414] p-10"
            }
          >
            {plan.highlight && (
              <motion.div
                className="absolute -top-4 left-8 rounded-full border border-[#c1ff72]/40 bg-[#0c0c0c] px-4 py-1 text-xs font-semibold text-[#c1ff72]"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                Mais Popular
              </motion.div>
            )}
            <div className="text-lg font-semibold text-white">{plan.name}</div>
            <div className="mt-2 font-mono text-2xl text-[#c1ff72]">{plan.price}</div>
            <div className="mt-6 space-y-3 text-sm text-white/70">
              {plan.perks.map((perk) => (
                <div key={perk} className="flex items-start gap-2">
                  <Check size={18} className="text-[#c1ff72]" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              {plan.highlight ? (
                <MagneticButton label={plan.cta} href={`#/register?plan=${plan.slug}`} />
              ) : (
                <a
                  href={`#/register?plan=${plan.slug}`}
                  className="block w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 text-center"
                >
                  {plan.cta}
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
      <div className="mt-8 text-center text-sm text-white/40">Sem contrato. Sem letra miúda. Sem pegadinha.</div>
    </section>
  );
});

const FinalCTA = memo(function FinalCTA() {
  return (
    <section className="relative min-h-[60vh] overflow-hidden py-20">
      <div className="mesh absolute inset-0" />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 md:px-8">
        <h2 className="text-4xl md:text-6xl font-black text-white">Sua rotina não vai se organizar sozinha.</h2>
        <p className="text-sm text-white/40">Comece hoje. 3 dias grátis. Sem cartão.</p>
        <MagneticButton label="Começar Teste Grátis" href="#/register" />
        <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/50">
          <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-[#c1ff72]" /> Sem anúncios invasivos</span>
          <span className="inline-flex items-center gap-2"><Lock size={16} className="text-[#c1ff72]" /> Dados criptografados de ponta a ponta</span>
          <span className="inline-flex items-center gap-2"><Sparkle size={16} className="text-[#c1ff72]" /> Cancele quando quiser, sem fricção</span>
        </div>
      </div>
    </section>
  );
});

const Footer = memo(function Footer() {
  return (
    <footer className="rounded-t-[40px] border-t border-white/5 bg-[#0c0c0c]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3 md:px-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-lg font-semibold text-white">Corelys</span>
          </div>
          <div className="text-sm text-white/50">Sua rotina, dominada.</div>
        </div>
        <div className="space-y-2 text-sm text-white/60">
          <button type="button" onClick={() => smoothScrollTo("features")}>Funcionalidades</button>
          <br />
          <button type="button" onClick={() => smoothScrollTo("pricing")}>Preços</button>
          <br />
          <a href="#/login">Entrar</a>
        </div>
        <div className="space-y-2 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <span className="pulse-dot h-2 w-2 rounded-full bg-[#c1ff72]" />
            Sistema Operacional: Online
          </div>
          <div>&copy; 2026 Corelys — Sua rotina, dominada.</div>
        </div>
      </div>
    </footer>
  );
});

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0c0c0c] text-white">
      <GrainOverlay />
      <Navbar />
      <main>
        <Hero />
        <MarqueeStrip />
        <section id="features" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <div className="mb-10">
            <div className="text-sm uppercase tracking-[0.2em] text-white/40">Tudo que você precisa.</div>
            <div className="text-3xl md:text-4xl font-semibold text-white">Nada que roube seu tempo.</div>
          </div>
          <div className="grid gap-12 lg:grid-cols-[1fr_320px] items-center">
            <BentoCards />
            <div className="flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* --- Seção Assistente Pessoal WhatsApp --- */}
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <div className="grid gap-12 rounded-[40px] border border-white/5 bg-[#0a0a0a] px-6 py-16 md:grid-cols-2 md:items-center md:px-16 overflow-hidden relative">
            <div className="absolute top-0 right-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 rounded-full bg-[#25d366] opacity-5 blur-[120px] pointer-events-none" />
            <div className="space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/20 bg-[#25D366]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#25D366]">
                Na palma da sua mão
              </div>
              <h2 className="text-4xl font-black text-white md:text-5xl">
                Não é só um app.<br />É sua assistente.
              </h2>
              <p className="text-lg text-white/40 max-w-md">
                Precisa remarcar um treino? Adicionar um gasto? Criar um lembrete? Mande um WhatsApp. A IA do Corelys organiza tudo no seu dashboard enquanto você continua focado.
              </p>
              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5">
                    <Check size={14} className="text-[#25D366]" />
                  </div>
                  Zero fricção de abrir o app
                </li>
                <li className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5">
                    <Check size={14} className="text-[#25D366]" />
                  </div>
                  Respostas imediatas
                </li>
              </ul>
            </div>
            <div className="flex justify-center md:justify-end relative z-10">
              <AssistantMockup />
            </div>
          </div>
        </section>

        <StepsSection />
        <TrustSection />
        <TestimonialsSection />
        <StatsSection />
        <Manifesto />
        <PricingSection />
        <FinalCTA />
      </main>
      <Footer />

      <style>{`
        .grain::before { content: ""; position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 50; }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }
        .marquee { overflow: hidden; padding: 1.2rem 0; }
        .marquee-track { display: flex; gap: 2.4rem; align-items: center; width: max-content; animation: marquee 26s linear infinite; }
        .marquee:hover .marquee-track { animation-duration: 40s; }
        .marquee-item { display: inline-flex; gap: 1.4rem; align-items: center; color: rgba(255,255,255,0.2); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700; }
        .mesh { background-image: radial-gradient(circle at 20% 20%, rgba(193,255,114,0.08), transparent 45%), radial-gradient(circle at 70% 10%, rgba(193,255,114,0.05), transparent 40%), radial-gradient(circle at 40% 80%, rgba(193,255,114,0.06), transparent 45%); animation: meshShift 18s ease-in-out infinite; }
        @keyframes meshShift { 0% { background-position: 0% 0%; } 50% { background-position: 100% 60%; } 100% { background-position: 0% 0%; } }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.5); opacity: 1; } }
      `}</style>
    </div>
  );
}
