import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button, Input, Card } from '../components/ui/LayoutComponents';
import { User, Activity, Dumbbell, Calendar, Ruler, Mail, Save, LogOut } from 'lucide-react';
import { Profile as ProfileType, GymStats } from '../types';

const ProfilePage: React.FC = () => {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileType | null>(null);
    const [stats, setStats] = useState<GymStats | null>(null);

    // Edit State
    const [formData, setFormData] = useState({
        fullName: '',
        gender: '',
        birthDate: '',
        height: '',
        activityLevel: '',
        goal: ''
    });

    useEffect(() => {
        if (user) {
            fetchProfileData();
        }
    }, [user]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);

            // Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') throw profileError;

            // Fetch Stats
            const { data: statsData, error: statsError } = await supabase
                .from('gym_stats')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (statsError && statsError.code !== 'PGRST116') throw statsError;

            if (profileData) {
                setProfile(profileData);
                setFormData({
                    fullName: profileData.full_name || '',
                    gender: profileData.gender || '',
                    birthDate: profileData.birth_date || '',
                    height: profileData.height?.toString() || '',
                    activityLevel: profileData.activity_level || '',
                    goal: profileData.goal || ''
                });
            }

            if (statsData) {
                setStats(statsData);
            }

        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            // Update Profile
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
                    updated_at: new Date()
                });

            if (profileError) throw profileError;

            alert('Perfil atualizado com sucesso!');
            fetchProfileData();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Erro ao atualizar perfil.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
    };

    if (loading) return <div className="text-center p-10 text-white/50">Carregando perfil...</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Meu Perfil</h1>
                    <p className="text-white/40">Gerencie suas informações pessoais</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                    <LogOut size={18} className="mr-2" /> Sair
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info Card */}
                <Card className="lg:col-span-2 p-8 space-y-8">
                    <div className="flex items-center gap-6 pb-8 border-b border-white/5">
                        <div className="w-20 h-20 rounded-full bg-[#c1ff72] text-black flex items-center justify-center text-3xl font-bold">
                            {formData.fullName.charAt(0) || user?.email?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{formData.fullName || 'Usuário'}</h2>
                            <div className="flex items-center gap-2 text-white/40 text-sm mt-1">
                                <Mail size={14} /> {user?.email}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <Input
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    className="pl-12 bg-[#161616]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Data de Nascimento</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <Input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="pl-12 bg-[#161616]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Gênero</label>
                            <select
                                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff72] outline-none"
                                value={formData.gender}
                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="">Selecione</option>
                                <option value="Male">Masculino</option>
                                <option value="Female">Feminino</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Altura (cm)</label>
                            <div className="relative">
                                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <Input
                                    type="number"
                                    value={formData.height}
                                    onChange={e => setFormData({ ...formData, height: e.target.value })}
                                    className="pl-12 bg-[#161616]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto px-8">
                            {saving ? 'Salvando...' : <><Save size={18} className="mr-2" /> Salvar Alterações</>}
                        </Button>
                    </div>
                </Card>

                {/* Stats & Goals Side Card */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Activity className="text-[#c1ff72]" size={20} /> Metas
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Nível de Atividade</label>
                                <select
                                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#c1ff72] outline-none"
                                    value={formData.activityLevel}
                                    onChange={e => setFormData({ ...formData, activityLevel: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="Sedentário">Sedentário</option>
                                    <option value="Levemente Ativo">Levemente Ativo</option>
                                    <option value="Moderadamente Ativo">Moderadamente Ativo</option>
                                    <option value="Muito Ativo">Muito Ativo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Objetivo Principal</label>
                                <select
                                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#c1ff72] outline-none"
                                    value={formData.goal}
                                    onChange={e => setFormData({ ...formData, goal: e.target.value })}
                                >
                                    <option value="">Selecione</option>
                                    <option value="Perder Peso">Perder Peso</option>
                                    <option value="Ganhar Massa Muscular">Ganhar Massa Muscular</option>
                                    <option value="Manter Peso">Manter Peso</option>
                                    <option value="Saúde Geral">Saúde Geral</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Dumbbell className="text-[#c1ff72]" size={20} /> Dados Físicos
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#161616] p-4 rounded-xl text-center">
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Peso Atual</p>
                                <p className="text-xl font-bold">{stats?.weight || '-'} <span className="text-sm text-white/40">kg</span></p>
                            </div>
                            <div className="bg-[#161616] p-4 rounded-xl text-center">
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Meta</p>
                                <p className="text-xl font-bold">{stats?.targetWeight || '-'} <span className="text-sm text-white/40">kg</span></p>
                            </div>
                            <div className="bg-[#161616] p-4 rounded-xl text-center">
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Gordura</p>
                                <p className="text-xl font-bold">{stats?.bodyFat || '-'} <span className="text-sm text-white/40">%</span></p>
                            </div>
                            <div className="bg-[#161616] p-4 rounded-xl text-center">
                                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Massa Magra</p>
                                <p className="text-xl font-bold">{stats?.muscleMass || '-'} <span className="text-sm text-white/40">kg</span></p>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-xs text-white/30 italic">Para atualizar o peso, use a aba "Academia".</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
