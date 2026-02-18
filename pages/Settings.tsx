
import React from 'react';
import { Card, Button, Input, Badge } from '../components/ui/LayoutComponents';
import { User, Bell, CreditCard, ChevronRight, Camera, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';

const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('Perfil');
  const [weight, setWeight] = React.useState<number>(0);
  const [userPlan, setUserPlan] = React.useState<string>('premium');
  const [planExpires, setPlanExpires] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Partial<Profile>>({
    fullName: '',
    email: '',
    gender: 'Other',
    birthDate: '',
    height: 0,
    activityLevel: '',
    goal: ''
  });

  const [notifications, setNotifications] = React.useState({
    habits: true,
    tasks: true,
    finance: false,
    gym: true,
  });

  React.useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile({
          fullName: data.full_name || '',
          email: data.email || user?.email || '',
          gender: data.gender || 'Other',
          birthDate: data.birth_date || '',
          height: data.height || 0,
          activityLevel: data.activity_level || '',
          goal: data.goal || ''
        });
        setUserPlan(data.plan || 'premium');
        setPlanExpires(data.plan_expires_at || null);
      } else {
        setProfile(prev => ({ ...prev, email: user?.email || '' }));
      }

      // Fetch weight from gym_stats
      const { data: gymData } = await supabase
        .from('gym_stats')
        .select('weight')
        .eq('user_id', user?.id)
        .single();

      if (gymData?.weight) {
        setWeight(gymData.weight);
      }
    } catch (error) {
      // silently fail - profile might not exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updateData = {
        id: user.id,
        full_name: profile.fullName || null,
        gender: profile.gender || null,
        birth_date: profile.birthDate || null,
        height: profile.height && profile.height > 0 ? profile.height : null,
        activity_level: profile.activityLevel || null,
        goal: profile.goal || null,
        email: profile.email || user.email,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updateData, { onConflict: 'id' })
        .select();

      if (error) throw error;

      // Save weight to gym_stats
      if (weight > 0) {
        const { data: existingStats } = await supabase
          .from('gym_stats')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingStats) {
          await supabase
            .from('gym_stats')
            .update({ weight, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('gym_stats')
            .insert({ user_id: user.id, weight, updated_at: new Date().toISOString() });
        }
      }

      alert('Configurações salvas com sucesso!');
      await fetchProfile();
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      alert('Link para redefinir senha enviado para seu email!');
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Tem certeza que deseja deletar sua conta? Esta ação é irreversível.')) {
      alert('Para deletar sua conta, entre em contato com o suporte.');
    }
  };

  if (loading && !profile.email) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#c1ff72]" size={32} />
      </div>
    );
  }

  const tabs = [
    { label: 'Perfil', icon: User },
    { label: 'Notificações', icon: Bell },
    { label: 'Faturamento', icon: CreditCard },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3">
          <Card className="p-4 bg-white/[0.02] border-white/5 space-y-2">
            {tabs.map(item => (
              <button
                key={item.label}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === item.label
                  ? 'bg-[#c1ff72] text-black shadow-[0_0_15px_rgba(193,255,114,0.2)]'
                  : 'opacity-40 hover:bg-[var(--foreground)]/5 hover:opacity-100 transition-all'
                  }`}
                onClick={() => setActiveTab(item.label)}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={18} />
                  {item.label}
                </div>
                {activeTab === item.label && <ChevronRight size={14} />}
              </button>
            ))}
            <div className="pt-4 border-t border-white/5 mt-4">
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={18} /> Sair da conta
              </button>
            </div>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">

          {/* ===== PERFIL TAB ===== */}
          {activeTab === 'Perfil' && (
            <>
              <Card className="p-10">
                <h3 className="text-2xl font-bold mb-10">Configurações de Perfil</h3>

                <div className="flex flex-col sm:flex-row items-center gap-10 mb-12">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[40px] bg-[#c1ff72] text-black flex items-center justify-center text-4xl font-bold shadow-2xl border-4 border-white/5">
                      {profile.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="text-2xl font-bold">{profile.fullName || 'Usuário'}</h4>
                    <p className="text-sm opacity-30 mt-1">{profile.email}</p>
                    <div className="flex gap-2 mt-4 justify-center sm:justify-start">
                      <Badge variant="success">Ativo</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em]">Nome Completo</label>
                    <Input
                      value={profile.fullName}
                      onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                      className="h-14 bg-[#161616] border-white/5"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em]">Email Principal</label>
                    <Input
                      value={profile.email}
                      disabled
                      className="h-14 bg-[#161616] border-white/5 opacity-50 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em]">Gênero</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Masculino', value: 'Male' },
                        { label: 'Feminino', value: 'Female' },
                        { label: 'Outro', value: 'Other' },
                      ].map(g => (
                        <button
                          key={g.value}
                          onClick={() => setProfile({ ...profile, gender: g.value as any })}
                          className={`h-14 rounded-xl border flex items-center justify-center text-sm font-bold transition-all ${profile.gender === g.value
                            ? 'bg-[#c1ff72] text-black border-[#c1ff72]'
                            : 'border-[var(--card-border)] hover:border-[var(--foreground)]/30 opacity-60'
                            }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em]">Data de Nascimento</label>
                    <Input
                      type="date"
                      value={profile.birthDate}
                      onChange={e => setProfile({ ...profile, birthDate: e.target.value })}
                      className="h-14 bg-[#161616] border-white/5"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em]">Altura (cm)</label>
                    <Input
                      type="number"
                      value={profile.height}
                      onChange={e => setProfile({ ...profile, height: parseFloat(e.target.value) })}
                      className="h-14 bg-[#161616] border-white/5"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em]">Peso Atual (kg)</label>
                    <Input
                      type="number"
                      value={weight}
                      onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                      className="h-14 bg-[#161616] border-white/5"
                      placeholder="Ex: 70.5"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em]">Nível de Atividade</label>
                    <select
                      value={profile.activityLevel}
                      onChange={e => setProfile({ ...profile, activityLevel: e.target.value })}
                      className="w-full h-14 bg-[#161616] border border-white/5 rounded-xl px-4 text-white focus:outline-none focus:border-[#c1ff72]/50 transition-all appearance-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="Sedentário">Sedentário</option>
                      <option value="Levemente Ativo">Levemente Ativo</option>
                      <option value="Moderadamente Ativo">Moderadamente Ativo</option>
                      <option value="Muito Ativo">Muito Ativo</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em]">Objetivo</label>
                    <select
                      value={profile.goal}
                      onChange={e => setProfile({ ...profile, goal: e.target.value })}
                      className="w-full h-14 bg-[#161616] border border-white/5 rounded-xl px-4 text-white focus:outline-none focus:border-[#c1ff72]/50 transition-all appearance-none"
                    >
                      <option value="">Selecione...</option>
                      <option value="Perder Peso">Perder Peso</option>
                      <option value="Ganhar Massa Muscular">Ganhar Massa Muscular</option>
                      <option value="Manter Peso">Manter Peso</option>
                      <option value="Saúde Geral">Saúde Geral</option>
                    </select>
                  </div>
                </div>

                <div className="mt-12 flex flex-col sm:flex-row justify-between gap-4">
                  <Button
                    variant="outline"
                    className="h-12 border-white/10 hover:bg-white/5"
                    onClick={handleChangePassword}
                  >
                    Alterar Senha
                  </Button>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="h-12 border-white/10 hover:bg-white/5"
                      onClick={fetchProfile}
                    >
                      Descartar
                    </Button>
                    <Button
                      className="h-12 px-10"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Alterações'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-red-500/10 bg-red-500/[0.02]">
                <h3 className="text-lg font-bold text-red-400 mb-2">Zona Crítica</h3>
                <p className="text-xs opacity-30 mb-6 leading-relaxed">Remover sua conta irá deletar permanentemente todos os seus dados e históricos.</p>
                <Button
                  variant="danger"
                  className="w-full sm:w-auto h-12 bg-red-600/20 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                  onClick={handleDeleteAccount}
                >
                  Deletar Minha Conta
                </Button>
              </Card>
            </>
          )}

          {/* ===== NOTIFICAÇÕES TAB ===== */}
          {activeTab === 'Notificações' && (
            <Card className="p-10">
              <h3 className="text-2xl font-bold mb-2">Notificações</h3>
              <p className="opacity-40 text-sm mb-10">Escolha quais notificações você deseja receber.</p>

              <div className="space-y-4">
                {[
                  { key: 'habits', label: 'Hábitos', desc: 'Lembrete diário para completar seus hábitos' },
                  { key: 'tasks', label: 'Tarefas', desc: 'Avisos de tarefas com prazo próximo' },
                  { key: 'finance', label: 'Finanças', desc: 'Resumo semanal dos seus gastos' },
                  { key: 'gym', label: 'Academia', desc: 'Lembrete dos seus dias de treino' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div>
                      <h4 className="font-bold text-sm">{item.label}</h4>
                      <p className="text-xs opacity-30 mt-1">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                      className={`w-14 h-8 rounded-full transition-all relative ${notifications[item.key as keyof typeof notifications]
                        ? 'bg-[#c1ff72]'
                        : 'bg-white/10'
                        }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-md ${notifications[item.key as keyof typeof notifications]
                        ? 'left-7'
                        : 'left-1'
                        }`} />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs opacity-20 mt-8">As notificações serão enviadas por email para {profile.email || user?.email}.</p>
            </Card>
          )}

          {/* ===== FATURAMENTO TAB ===== */}
          {activeTab === 'Faturamento' && (
            <div className="space-y-6">
              <Card className="p-10">
                <h3 className="text-2xl font-bold mb-2">Seu Plano</h3>
                <p className="opacity-40 text-sm mb-10">Gerencie sua assinatura do Corelys.</p>

                <div className="p-8 bg-gradient-to-br from-[#c1ff72]/10 to-[#c1ff72]/5 border border-[#c1ff72]/20 rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold">
                          {userPlan === 'premium' ? 'Plano Premium' : 'Plano Gratuito'}
                        </h4>
                        <Badge variant="success">Ativo</Badge>
                      </div>
                      <p className="opacity-40 text-sm">
                        {userPlan === 'premium'
                          ? 'Acesso completo a todas as funcionalidades'
                          : 'Acesso a funcionalidades básicas'}
                      </p>
                      {planExpires && (
                        <p className="text-xs opacity-30 mt-1">
                          Válido até {new Date(planExpires).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[#c1ff72]">
                        {userPlan === 'premium' ? 'R$ 14,90' : 'R$ 0'}
                      </p>
                      <p className="text-xs opacity-30">/mês</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                    {[
                      'Dashboard completo',
                      'Controle de hábitos',
                      'Gestão de tarefas',
                      'Controle financeiro',
                      'Treinos de academia',
                      'Suplementos e nutrição',
                      'Gráficos e relatórios',
                      'Calendário',
                    ].map(feature => (
                      <div key={feature} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-[#c1ff72]/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#c1ff72]" />
                        </div>
                        <span className="opacity-60">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-10">
                <h3 className="text-lg font-bold mb-2">Informações da Conta</h3>
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between py-4 border-b border-white/5">
                    <span className="text-sm opacity-40">Email</span>
                    <span className="text-sm font-bold">{profile.email || user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-white/5">
                    <span className="text-sm opacity-40">Plano atual</span>
                    <Badge variant={userPlan === 'premium' ? 'success' : 'default'}>
                      {userPlan === 'premium' ? 'Premium' : 'Gratuito'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-white/5">
                    <span className="text-sm opacity-40">Status da conta</span>
                    <Badge variant="success">Ativa</Badge>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <span className="text-sm opacity-40">Membro desde</span>
                    <span className="text-sm font-bold">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
