import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/LayoutComponents';
import { Lock, Mail, Loader2, AlertCircle, CheckCircle, User } from 'lucide-react';
import { Logo } from '../components/shared/Logo';
import { redirectToCheckout, STRIPE_PRO_LINK, STRIPE_ELITE_LINK } from '../lib/stripe';

const Register: React.FC = () => {
    const [searchParams] = useSearchParams();
    const selectedPlan = searchParams.get('plan') || 'pro';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });

            if (error) throw error;

            // Create initial profile
            if (data.user) {
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    email: email,
                    full_name: name,
                    plan: 'free',
                    updated_at: new Date().toISOString()
                });
            }

            setSuccess(true);
        } catch (err: any) {
            if (err.message === 'User already registered') {
                setError('Este email já está cadastrado. Tente fazer login.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen bg-[#0c0c0c] items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-[#161616] border border-[#c1ff72]/10 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-[#c1ff72]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={32} className="text-[#c1ff72]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Conta criada!</h2>
                        <p className="text-white/50 mb-2">
                            Enviamos um link de confirmação para:
                        </p>
                        <p className="text-[#c1ff72] font-bold mb-6">{email}</p>
                        <p className="text-white/30 text-sm mb-8">
                            Abra seu email e clique no link para ativar sua conta. Depois faça login para assinar seu plano.
                        </p>
                        <Link
                            to={`/login?plan=${selectedPlan}`}
                            className="inline-block w-full bg-[#c1ff72] hover:bg-[#b0e666] text-black font-bold py-3.5 rounded-xl transition-all text-center"
                        >
                            Ir para Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#0c0c0c] items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="mb-4">
                        <Logo size={48} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Corelys</h1>
                    <p className="opacity-40">
                        {selectedPlan === 'elite' ? 'Plano Elite — R$ 39,99/mês' : 'Plano Pro — R$ 19,99/mês'}
                        <span className="block text-[#c1ff72] text-xs mt-1">3 dias grátis para testar</span>
                    </p>
                </div>

                <div className="bg-[#161616] border border-[#c1ff72]/10 rounded-2xl p-8">
                    <form onSubmit={handleRegister} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                                <AlertCircle size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Nome</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-[#c1ff72]/50 focus:bg-white/10 transition-all"
                                    placeholder="Seu nome"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Email</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-[#c1ff72]/50 focus:bg-white/10 transition-all"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Senha</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-[#c1ff72]/50 focus:bg-white/10 transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Confirmar Senha</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-[#c1ff72]/50 focus:bg-white/10 transition-all"
                                    placeholder="Repita a senha"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#c1ff72] hover:bg-[#b0e666] text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                'Criar Conta'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-white/30">
                            Já tem uma conta?{' '}
                            <Link
                                to="/login"
                                className="text-[#c1ff72] font-bold hover:underline"
                            >
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
