import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/LayoutComponents';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { Logo } from '../components/shared/Logo';
import { redirectToCheckout, STRIPE_PRO_LINK, STRIPE_ELITE_LINK } from '../lib/stripe';

const Login: React.FC = () => {
    const [searchParams] = useSearchParams();
    const planParam = searchParams.get('plan');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            // If user has a pending plan selection, redirect to checkout
            if (planParam) {
                const link = planParam === 'elite' ? STRIPE_ELITE_LINK : STRIPE_PRO_LINK;
                redirectToCheckout(link, email);
                return;
            }

            navigate('/dashboard');
        } catch (err: any) {
            if (err.message === 'Invalid login credentials') {
                setError('Email ou senha incorretos.');
            } else if (err.message === 'Email not confirmed') {
                setError('Confirme seu email antes de fazer login. Verifique sua caixa de entrada.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#0c0c0c] items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="mb-4">
                        <Logo size={48} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Corelys</h1>
                    <p className="opacity-40">Entre na sua conta para continuar</p>
                </div>

                <Card className="p-8 border-[#c1ff72]/10">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                                <AlertCircle size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-40">Email</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#c1ff72]/50 focus:bg-white/10 transition-all"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-40">Senha</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#c1ff72]/50 focus:bg-white/10 transition-all"
                                    placeholder="********"
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
                                'Entrar'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm opacity-30">
                            Ainda não tem uma conta?{' '}
                            <Link
                                to="/register"
                                className="text-[#c1ff72] font-bold hover:underline"
                            >
                                Criar conta
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Login;
