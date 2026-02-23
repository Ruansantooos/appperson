import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/shared/Logo';
import { redirectToCheckout, STRIPE_PRO_LINK, STRIPE_ELITE_LINK } from '../lib/stripe';
import { Check, Crown, LogOut } from 'lucide-react';

const Paywall: React.FC = () => {
    const { user, signOut } = useAuth();
    const email = user?.email || '';

    const plans = [
        {
            name: 'Pro',
            price: 'R$ 19,99/mês',
            highlight: false,
            link: STRIPE_PRO_LINK,
            perks: [
                'Dashboard inteligente',
                'Treinos e nutrição ilimitados',
                'Controle financeiro avançado',
                'Hábitos ilimitados',
                'Projetos e tarefas sem limites',
                'Calendário integrado',
                'Relatórios e metas',
                'Sem anúncios',
            ],
        },
        {
            name: 'Elite',
            price: 'R$ 39,99/mês',
            highlight: true,
            link: STRIPE_ELITE_LINK,
            perks: [
                'Tudo do Pro',
                'Assistente via WhatsApp',
                'Lembretes personalizados',
                'Suporte VIP',
            ],
        },
    ];

    return (
        <div className="flex min-h-screen bg-[#0c0c0c] items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="mb-4">
                        <Logo size={48} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Escolha seu plano</h1>
                    <p className="text-white/40 text-sm">
                        Para acessar o Corelys, assine um dos planos abaixo.
                        <br />
                        <span className="text-[#c1ff72]">3 dias grátis para testar</span>
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={
                                plan.highlight
                                    ? 'relative rounded-2xl border border-[#c1ff72]/25 bg-[#161616] p-8'
                                    : 'rounded-2xl border border-white/8 bg-[#161616] p-8'
                            }
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-6 rounded-full border border-[#c1ff72]/40 bg-[#0c0c0c] px-3 py-1 text-xs font-semibold text-[#c1ff72] flex items-center gap-1">
                                    <Crown size={12} /> Mais Popular
                                </div>
                            )}
                            <div className="text-lg font-semibold text-white">{plan.name}</div>
                            <div className="mt-2 font-mono text-2xl text-[#c1ff72]">{plan.price}</div>
                            <div className="mt-6 space-y-3 text-sm text-white/70">
                                {plan.perks.map((perk) => (
                                    <div key={perk} className="flex items-start gap-2">
                                        <Check size={16} className="text-[#c1ff72] mt-0.5 shrink-0" />
                                        <span>{perk}</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => redirectToCheckout(plan.link, email)}
                                className={
                                    plan.highlight
                                        ? 'mt-8 w-full bg-[#c1ff72] hover:bg-[#b0e666] text-black font-bold py-3.5 rounded-xl transition-all'
                                        : 'mt-8 w-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-all'
                                }
                            >
                                Começar 3 Dias Grátis
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={signOut}
                        className="text-sm text-white/30 hover:text-white/60 transition-colors inline-flex items-center gap-2"
                    >
                        <LogOut size={14} />
                        Sair da conta
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Paywall;
