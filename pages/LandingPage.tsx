import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/shared/Logo';
import {
  Dumbbell,
  CheckSquare,
  Layers,
  Wallet,
  Zap,
  CalendarDays,
  LayoutDashboard,
  Check,
  Shield,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  MessageCircle,
  Crown,
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const features = [
    {
      icon: Dumbbell,
      title: 'Treinos & Fitness',
      description: 'Monte seus treinos, acompanhe cargas, séries e evolução. Seu personal trainer digital.',
    },
    {
      icon: CheckSquare,
      title: 'Tarefas',
      description: 'Organize o que precisa ser feito com prioridades, datas e status. Nada escapa.',
    },
    {
      icon: Layers,
      title: 'Projetos',
      description: 'Gerencie projetos complexos com etapas, progresso e visão geral clara.',
    },
    {
      icon: Wallet,
      title: 'Finanças',
      description: 'Controle receitas, despesas, cartões e contas. Saiba exatamente para onde vai seu dinheiro.',
    },
    {
      icon: Zap,
      title: 'Hábitos com Streaks',
      description: 'Construa hábitos que duram. Acompanhe sequências e nunca quebre a corrente.',
    },
    {
      icon: CalendarDays,
      title: 'Calendário',
      description: 'Visualize tudo no calendário. Treinos, tarefas, hábitos — tudo em um só lugar.',
    },
    {
      icon: LayoutDashboard,
      title: 'Dashboard Inteligente',
      description: 'Visão completa do seu dia, semana e progresso. Dados que te movem para frente.',
    },
  ];

  const proFeatures = [
    'Dashboard inteligente completo',
    'Treinos e nutrição ilimitados',
    'Controle financeiro avançado',
    'Hábitos ilimitados com streaks',
    'Projetos e tarefas sem limites',
    'Calendário integrado',
    'Relatórios e metas personalizadas',
    'Sem anúncios',
  ];

  const eliteFeatures = [
    'Tudo do plano Pro',
    'Assistente via WhatsApp',
    'Lembretes personalizados',
    'Suporte prioritário VIP',
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-[#0c0c0c]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-lg font-bold">Corelys</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo(featuresRef)} className="text-sm text-white/50 hover:text-white transition-colors">
              Funcionalidades
            </button>
            <button onClick={() => scrollTo(pricingRef)} className="text-sm text-white/50 hover:text-white transition-colors">
              Preços
            </button>
            <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors font-medium">
              Entrar
            </Link>
            <Link
              to="/register"
              className="bg-[#c1ff72] hover:bg-[#b0e666] text-black text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              Teste Grátis 3 Dias
            </Link>
          </div>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-3">
            <Link
              to="/register"
              className="bg-[#c1ff72] hover:bg-[#b0e666] text-black text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              Teste Grátis
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white/50 p-1">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0c0c0c]/95 backdrop-blur-xl border-t border-white/5 px-4 py-4 space-y-3">
            <button onClick={() => scrollTo(featuresRef)} className="block w-full text-left text-sm text-white/50 hover:text-white py-2">
              Funcionalidades
            </button>
            <button onClick={() => scrollTo(pricingRef)} className="block w-full text-left text-sm text-white/50 hover:text-white py-2">
              Preços
            </button>
            <Link to="/login" className="block text-sm text-white/70 hover:text-white py-2 font-medium">
              Entrar
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c1ff72]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <Sparkles size={14} className="text-[#c1ff72]" />
            <span className="text-xs text-white/60 font-medium">Usado por quem leva a rotina a sério</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            Pare de sobreviver ao dia.{' '}
            <span className="text-[#c1ff72]">Comece a dominar ele.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Treinos, finanças, hábitos, tarefas e projetos — tudo organizado em um único app. O Corelys é o sistema que faltava na sua rotina.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              to="/register"
              className="bg-[#c1ff72] hover:bg-[#b0e666] text-black font-bold px-8 py-4 rounded-2xl text-lg transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(193,255,114,0.2)]"
            >
              Começar Teste Grátis
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="text-white/50 hover:text-white font-medium px-6 py-4 transition-colors"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="text-sm text-white/30">3 dias grátis. Cancele quando quiser. Sem surpresas.</p>
        </div>
      </section>

      {/* Problema → Solução */}
      <section className="px-4 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 leading-tight">
            Você já tentou organizar sua vida<br className="hidden sm:block" /> com{' '}
            <span className="text-[#c1ff72]">5 apps diferentes?</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {[
              'Planilha de treino no Google Sheets',
              'App de finanças que nunca abre',
              'Lista de tarefas no bloco de notas',
              'Hábitos anotados no calendário do celular',
            ].map((problem, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <X size={16} className="text-red-400" />
                </div>
                <span className="text-white/60 text-sm">{problem}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-[#c1ff72]/10 border border-[#c1ff72]/20 rounded-2xl px-6 py-4">
              <Check size={20} className="text-[#c1ff72]" />
              <span className="text-[#c1ff72] font-bold">O Corelys resolve tudo isso em um lugar só.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section ref={featuresRef} className="px-4 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que você precisa.{' '}
              <span className="text-white/30">Nada que você não precisa.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-[#161616] border border-white/5 rounded-[28px] p-8 hover:border-[#c1ff72]/10 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-[#c1ff72]/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#c1ff72]/15 transition-colors">
                  <feature.icon size={22} className="text-[#c1ff72]" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Prova Social */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Layers, value: '7 Módulos', label: 'Tudo integrado em um app' },
              { icon: Shield, value: '100% Seguro', label: 'Dados criptografados' },
              { icon: Sparkles, value: 'Design Premium', label: 'Interface que dá prazer de usar' },
            ].map((stat, i) => (
              <div key={i} className="text-center bg-[#161616] border border-white/5 rounded-3xl p-8">
                <div className="w-12 h-12 bg-[#c1ff72]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon size={22} className="text-[#c1ff72]" />
                </div>
                <div className="text-2xl font-black mb-1">{stat.value}</div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} className="px-4 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            Um investimento que cabe no bolso e{' '}
            <span className="text-[#c1ff72]">transforma sua rotina</span>
          </h2>
          <p className="text-white/40 mb-12">Escolha o plano ideal para você. 3 dias grátis em ambos.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Pro Plan */}
            <div className="relative bg-[#161616] border border-white/10 rounded-[32px] p-8 text-left">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Pro</h3>
                <p className="text-sm text-white/40">Para quem quer dominar a rotina</p>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm text-white/40">R$</span>
                <span className="text-4xl font-black">19,99</span>
                <span className="text-white/40">/mês</span>
              </div>

              <div className="space-y-3 mb-8">
                {proFeatures.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#c1ff72]/15 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-[#c1ff72]" />
                    </div>
                    <span className="text-sm text-white/70">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/register?plan=pro"
                className="block w-full bg-white/10 hover:bg-white/15 text-white font-bold py-4 rounded-2xl text-center transition-all"
              >
                Começar 3 Dias Grátis
              </Link>
            </div>

            {/* Elite Plan */}
            <div className="relative bg-[#161616] border-2 border-[#c1ff72]/30 rounded-[32px] p-8 text-left shadow-[0_0_60px_rgba(193,255,114,0.08)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#c1ff72] text-black text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Crown size={12} />
                Mais Popular
              </div>

              <div className="mb-6 pt-2">
                <h3 className="text-xl font-bold mb-1">Elite</h3>
                <p className="text-sm text-white/40">Para quem quer ir além</p>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm text-white/40">R$</span>
                <span className="text-4xl font-black text-[#c1ff72]">39,99</span>
                <span className="text-white/40">/mês</span>
              </div>

              <div className="space-y-3 mb-8">
                {eliteFeatures.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#c1ff72]/15 flex items-center justify-center shrink-0">
                      {item === 'Assistente via WhatsApp' ? (
                        <MessageCircle size={12} className="text-[#c1ff72]" />
                      ) : (
                        <Check size={12} className="text-[#c1ff72]" />
                      )}
                    </div>
                    <span className="text-sm text-white/70">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/register?plan=elite"
                className="block w-full bg-[#c1ff72] hover:bg-[#b0e666] text-black font-bold py-4 rounded-2xl text-center text-lg transition-all shadow-[0_0_30px_rgba(193,255,114,0.15)]"
              >
                Começar 3 Dias Grátis
              </Link>
            </div>
          </div>

          <p className="text-xs text-white/30 mt-6">Cancele a qualquer momento. Sem compromisso.</p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-4 py-20 sm:py-28">
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#c1ff72]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Sua rotina não vai se organizar sozinha.
            </h2>
            <p className="text-lg text-white/40 mb-10">
              Comece hoje com 3 dias grátis e veja a diferença.
            </p>

            <div className="flex flex-col items-center gap-4">
              <Link
                to="/register"
                className="bg-[#c1ff72] hover:bg-[#b0e666] text-black font-bold px-8 py-4 rounded-2xl text-lg transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(193,255,114,0.2)]"
              >
                Quero Testar Grátis
                <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="text-sm text-white/40 hover:text-white transition-colors">
                Já tem conta? Fazer login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-4 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={22} />
            <span className="text-sm text-white/40">Corelys — Sua rotina, dominada.</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/30">
            <button onClick={() => scrollTo(featuresRef)} className="hover:text-white transition-colors">Produto</button>
            <button onClick={() => scrollTo(pricingRef)} className="hover:text-white transition-colors">Preços</button>
            <a href="mailto:suporte@corelys.online" className="hover:text-white transition-colors">Suporte</a>
          </div>

          <p className="text-xs text-white/20">© 2026 Corelys</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
