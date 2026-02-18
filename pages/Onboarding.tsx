import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button, Input, Card } from '../components/ui/LayoutComponents';
import { ArrowRight, Check, User, Activity, Dumbbell, Calendar, Ruler } from 'lucide-react';

const Onboarding: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        gender: '',
        birthDate: '',
        height: '',
        weight: '',
        activityLevel: '',
        goal: ''
    });

    useEffect(() => {
        if (user) {
            checkProfile();
        }
    }, [user]);

    const checkProfile = async () => {
        // Check if user already has a complete profile
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single();

        if (data && data.full_name && data.gender && data.birth_date) {
            // Already onboarded? Maybe check gym_stats too?
            // For now, if they are here, we assume they need to complete it or are editing.
            // But usually onboarding is one-time. 
            // If we navigate here manually, pre-fill data.
            setFormData(prev => ({
                ...prev,
                fullName: data.full_name || '',
                gender: data.gender || '',
                birthDate: data.birth_date || '',
                height: data.height?.toString() || '',
                activityLevel: data.activity_level || '',
                goal: data.goal || ''
            }));
        }
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const updateForm = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: formData.fullName,
                    gender: formData.gender,
                    birth_date: formData.birthDate,
                    height: parseFloat(formData.height),
                    activity_level: formData.activityLevel,
                    goal: formData.goal,
                    email: user.email, // Ensure email is there
                    updated_at: new Date()
                });

            if (profileError) throw profileError;

            // 2. Update Gym Stats (Weight)
            // Check if stats exist
            const { data: statsData } = await supabase
                .from('gym_stats')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (statsData) {
                await supabase
                    .from('gym_stats')
                    .update({
                        weight: parseFloat(formData.weight),
                        updated_at: new Date()
                    })
                    .eq('user_id', user.id);
            } else {
                await supabase
                    .from('gym_stats')
                    .insert({
                        user_id: user.id,
                        weight: parseFloat(formData.weight),
                        updated_at: new Date()
                    });
            }

            // Success
            navigate('/');
        } catch (error) {
            console.error('Onboarding error:', error);
            alert('Erro ao salvar dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl p-8 border-[#c1ff72]/20">

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#c1ff72]' : 'bg-white/10'}`} />
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold">Bem-vindo(a)!</h1>
                            <p className="opacity-40">Vamos configurar seu perfil para personalizar sua experiência.</p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Seu Nome</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={20} />
                                    <Input
                                        placeholder="Como gostaria de ser chamado?"
                                        className="pl-12 h-14 bg-[#161616] border-white/5"
                                        value={formData.fullName}
                                        onChange={e => updateForm('fullName', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 mt-8 text-black font-bold text-lg"
                            onClick={handleNext}
                            disabled={!formData.fullName}
                        >
                            Começar <ArrowRight className="ml-2" />
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Sobre Você</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Gênero</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Masculino', 'Feminino'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => updateForm('gender', g === 'Masculino' ? 'Male' : 'Female')}
                                            className={`h-14 rounded-xl border flex items-center justify-center font-bold transition-all ${(formData.gender === 'Male' && g === 'Masculino') || (formData.gender === 'Female' && g === 'Feminino')
                                                ? 'bg-[#c1ff72] text-black border-[#c1ff72]'
                                                : 'border-[var(--card-border)] hover:border-[var(--foreground)]/30 opacity-60'
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Data de Nascimento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={20} />
                                    <Input
                                        type="date"
                                        className="pl-12 h-14 bg-[#161616] border-white/5"
                                        value={formData.birthDate}
                                        onChange={e => updateForm('birthDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <Button variant="outline" className="flex-1 h-14" onClick={handleBack}>Voltar</Button>
                            <Button
                                className="flex-1 h-14 text-black font-bold"
                                onClick={handleNext}
                                disabled={!formData.gender || !formData.birthDate}
                            >
                                Próximo
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Medidas Físicas</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Altura (cm)</label>
                                <div className="relative">
                                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={20} />
                                    <Input
                                        type="number"
                                        placeholder="Ex: 175"
                                        className="pl-12 h-14 bg-[#161616] border-white/5"
                                        value={formData.height}
                                        onChange={e => updateForm('height', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Peso Atual (kg)</label>
                                <div className="relative">
                                    <Dumbbell className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={20} />
                                    <Input
                                        type="number"
                                        placeholder="Ex: 70.5"
                                        className="pl-12 h-14 bg-[#161616] border-white/5"
                                        value={formData.weight}
                                        onChange={e => updateForm('weight', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <Button variant="outline" className="flex-1 h-14" onClick={handleBack}>Voltar</Button>
                            <Button
                                className="flex-1 h-14 text-black font-bold"
                                onClick={handleNext}
                                disabled={!formData.height || !formData.weight}
                            >
                                Próximo
                            </Button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Objetivo</h2>

                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase tracking-widest opacity-40">Qual seu nível de atividade?</label>
                            <div className="grid grid-cols-1 gap-3">
                                {['Sedentário', 'Levemente Ativo', 'Moderadamente Ativo', 'Muito Ativo'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => updateForm('activityLevel', level)}
                                        className={`p-4 rounded-xl border text-left transition-all ${formData.activityLevel === level
                                            ? 'bg-[#c1ff72]/10 border-[#c1ff72] text-[#c1ff72]'
                                            : 'border-[var(--card-border)] hover:border-[var(--foreground)]/20 opacity-60'
                                            }`}
                                    >
                                        <span className="font-bold block">{level}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <label className="block text-xs font-bold uppercase tracking-widest opacity-40">Qual seu principal objetivo?</label>
                            <div className="grid grid-cols-1 gap-3">
                                {['Perder Peso', 'Ganhar Massa Muscular', 'Manter Peso', 'Saúde Geral'].map(goal => (
                                    <button
                                        key={goal}
                                        onClick={() => updateForm('goal', goal)}
                                        className={`p-4 rounded-xl border text-left transition-all ${formData.goal === goal
                                            ? 'bg-[#c1ff72]/10 border-[#c1ff72] text-[#c1ff72]'
                                            : 'border-white/5 hover:border-white/20 text-white/60'
                                            }`}
                                    >
                                        <span className="font-bold block">{goal}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <Button variant="outline" className="flex-1 h-14" onClick={handleBack}>Voltar</Button>
                            <Button
                                className="flex-1 h-14 text-black font-bold"
                                onClick={handleSubmit}
                                disabled={!formData.activityLevel || !formData.goal}
                            >
                                {loading ? 'Salvando...' : 'Finalizar & Ir para Dashboard'}
                            </Button>
                        </div>
                    </div>
                )}

            </Card>
        </div>
    );
};

export default Onboarding;
