
import React from 'react';
import { Card, Button, Input, Badge } from '../components/ui/LayoutComponents';
import { User, Bell, CreditCard, ChevronRight, LogOut, Loader2, Users, Copy, Link2, Link2Off, Sun, Moon, Palette } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Profile } from '../types';
import { redirectToCheckout, PLANS } from '../lib/ticto';
import { getMyCoupleCode, linkCoupleByCode, unlinkPartner, fetchPartnerInfo } from '../lib/couple';

const SettingsPage: React.FC = () => {
  const { user, profile: authProfile, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = React.useState(true);

  // ===== Modo casal (vínculo por código) =====
  const [partnerInfo, setPartnerInfo] = React.useState<{ full_name?: string; email?: string } | null>(null);
  const [myCode, setMyCode] = React.useState('');
  const [enterCode, setEnterCode] = React.useState('');
  const [codeCopied, setCodeCopied] = React.useState(false);
  const [coupleBusy, setCoupleBusy] = React.useState(false);
  const [coupleMsg, setCoupleMsg] = React.useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('Perfil');
  const [weight, setWeight] = React.useState<number>(0);
  const [userPlan, setUserPlan] = React.useState<string>('free');
  const [planExpires, setPlanExpires] = React.useState<string | null>(null);
  const handleCheckout = (link: string) => {
    redirectToCheckout(link, profile.email || user?.email || '');
  };
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

  const loadCoupleData = React.useCallback(async () => {
    if (!user) return;
    const partnerId = authProfile?.partnerId;
    if (partnerId) {
      const { data } = await fetchPartnerInfo(partnerId);
      setPartnerInfo(data || null);
    } else {
      setPartnerInfo(null);
      // Gera/recupera o código de vínculo do usuário para compartilhar.
      const { data: code } = await getMyCoupleCode();
      if (typeof code === 'string') setMyCode(code);
    }
  }, [user, authProfile?.partnerId]);

  React.useEffect(() => { loadCoupleData(); }, [loadCoupleData]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch { /* clipboard indisponível */ }
  };

  const handleLink = async () => {
    const code = enterCode.trim().toUpperCase();
    setCoupleMsg(null);
    if (code.length < 4) {
      setCoupleMsg({ type: 'err', text: 'Digite o código do seu parceiro.' });
      return;
    }
    setCoupleBusy(true);
    const { error } = await linkCoupleByCode(code);
    setCoupleBusy(false);
    if (error) {
      setCoupleMsg({ type: 'err', text: error.message || 'Não foi possível vincular.' });
    } else {
      setEnterCode('');
      setCoupleMsg({ type: 'ok', text: 'Vinculado com sucesso! 🎉' });
      await refreshProfile();
      await loadCoupleData();
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Desvincular do parceiro? Vocês deixarão de ver os dados um do outro.')) return;
    setCoupleBusy(true);
    const { error } = await unlinkPartner();
    setCoupleBusy(false);
    if (!error) {
      await refreshProfile();
      await loadCoupleData();
    }
  };

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
        setUserPlan(data.plan || 'free');
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
      await refreshProfile();
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
    { label: 'Casal', icon: Users },
    { label: 'Aparência', icon: Palette },
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

          {/* ===== CASAL TAB ===== */}
          {activeTab === 'Casal' && (
            <Card className="p-10">
              <div className="flex items-center gap-3 mb-2">
                <Users size={24} className="text-[#c1ff72]" />
                <h3 className="text-2xl font-bold">Modo Casal</h3>
              </div>
              <p className="opacity-50 text-sm mb-8 max-w-xl">
                Conecte sua conta à do seu parceiro(a) para compartilhar <strong>finanças, tarefas e agenda</strong>.
                Saúde, treino e ciclo continuam privados de cada um.
              </p>

              {coupleMsg && (
                <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${coupleMsg.type === 'ok' ? 'bg-[#c1ff72]/10 text-[#9bdb52]' : 'bg-red-500/10 text-red-400'}`}>
                  {coupleMsg.text}
                </div>
              )}

              {authProfile?.partnerId ? (
                /* --- Vinculado --- */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--foreground)]/[0.03] border border-[var(--card-border)]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#c1ff72] text-black flex items-center justify-center text-xl font-bold">
                      {(partnerInfo?.full_name || partnerInfo?.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest opacity-40 font-bold">Conectado com</p>
                      <p className="font-bold text-lg">{partnerInfo?.full_name || partnerInfo?.email || 'Parceiro(a)'}</p>
                      {partnerInfo?.email && <p className="opacity-50 text-sm">{partnerInfo.email}</p>}
                    </div>
                  </div>
                  <button
                    onClick={handleUnlink}
                    disabled={coupleBusy}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    {coupleBusy ? <Loader2 size={16} className="animate-spin" /> : <Link2Off size={16} />} Desvincular
                  </button>
                </div>
              ) : (
                /* --- Não vinculado: vínculo por código --- */
                <div className="space-y-8">
                  {/* Meu código (para compartilhar) */}
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-40 font-bold mb-3">Seu código de vínculo</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-5 py-4 rounded-2xl bg-[#c1ff72]/[0.06] border border-[#c1ff72]/20 font-mono text-2xl font-bold tracking-[0.3em] text-[#c1ff72] text-center select-all">
                        {myCode || '••••••'}
                      </div>
                      <button
                        onClick={handleCopyCode}
                        disabled={!myCode}
                        className="flex items-center gap-2 px-5 py-4 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--card-border)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--foreground)]/10 transition disabled:opacity-40"
                      >
                        <Copy size={16} /> {codeCopied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <p className="opacity-40 text-xs mt-2">Envie esse código para seu parceiro(a). Ele cria a conta Corelys e digita o código abaixo.</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-[var(--card-border)]" />
                    <span className="text-xs uppercase tracking-widest opacity-30 font-bold">ou</span>
                    <div className="flex-1 h-px bg-[var(--card-border)]" />
                  </div>

                  {/* Inserir código do parceiro */}
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-40 font-bold mb-3">Tenho o código do meu parceiro(a)</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 flex items-center gap-3 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                        <Link2 size={16} className="opacity-40" />
                        <input
                          type="text"
                          value={enterCode}
                          onChange={(e) => setEnterCode(e.target.value.toUpperCase())}
                          placeholder="Ex: K7H2QM"
                          maxLength={10}
                          className="flex-1 bg-transparent py-3 text-sm outline-none font-mono tracking-[0.2em] uppercase"
                        />
                      </div>
                      <Button onClick={handleLink} disabled={coupleBusy}>
                        {coupleBusy ? <Loader2 size={16} className="animate-spin" /> : 'Vincular'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
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

          {/* ===== APARÊNCIA TAB ===== */}
          {activeTab === 'Aparência' && (
            <Card className="p-10">
              <h3 className="text-2xl font-bold mb-2">Aparência</h3>
              <p className="opacity-40 text-sm mb-10">Escolha o tema visual do aplicativo.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Opção Tema Claro */}
                <button
                  onClick={() => setTheme('light')}
                  className={`relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all group cursor-pointer ${
                    theme === 'light'
                      ? 'border-[#c1ff72] bg-[#c1ff72]/5 shadow-[0_0_20px_rgba(193,255,114,0.15)] text-white'
                      : 'border-white/5 bg-white/[0.01] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-[#c1ff72] text-black' : 'bg-white/5 text-white/40'}`}>
                      <Sun size={24} />
                    </div>
                    {theme === 'light' && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#c1ff72] text-black uppercase tracking-wider">
                        Ativo
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-lg mb-1">Tema Claro</h4>
                  <p className="text-xs opacity-40 leading-relaxed">
                    Visual leve e clean, ideal para ambientes bem iluminados.
                  </p>
                  
                  {/* Visual mockup representation */}
                  <div className="mt-6 h-24 rounded-xl bg-[#f3f6f5] border border-black/5 p-3 flex flex-col gap-2 overflow-hidden shadow-inner">
                    <div className="h-3 w-16 bg-[#0e1e1a]/20 rounded-full" />
                    <div className="h-6 rounded-lg bg-white/70 border border-black/5 flex items-center px-2">
                      <div className="h-1.5 w-8 bg-black/10 rounded-full" />
                    </div>
                    <div className="h-6 rounded-lg bg-white/70 border border-black/5 flex items-center px-2">
                      <div className="h-1.5 w-12 bg-black/10 rounded-full" />
                    </div>
                  </div>
                </button>

                {/* Opção Tema Escuro */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all group cursor-pointer ${
                    theme === 'dark'
                      ? 'border-[#c1ff72] bg-[#c1ff72]/5 shadow-[0_0_20px_rgba(193,255,114,0.15)] text-white'
                      : 'border-white/5 bg-white/[0.01] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-[#c1ff72] text-black' : 'bg-white/5 text-white/40'}`}>
                      <Moon size={24} />
                    </div>
                    {theme === 'dark' && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#c1ff72] text-black uppercase tracking-wider">
                        Ativo
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-lg mb-1">Tema Escuro</h4>
                  <p className="text-xs opacity-40 leading-relaxed">
                    Visual escuro e elegante, perfeito para ambientes com pouca luz e economia de bateria.
                  </p>

                  {/* Visual mockup representation */}
                  <div className="mt-6 h-24 rounded-xl bg-[#051411] border border-white/5 p-3 flex flex-col gap-2 overflow-hidden shadow-inner">
                    <div className="h-3 w-16 bg-[#f3f6f5]/20 rounded-full" />
                    <div className="h-6 rounded-lg bg-[#102c16]/55 border border-white/5 flex items-center px-2">
                      <div className="h-1.5 w-8 bg-white/10 rounded-full" />
                    </div>
                    <div className="h-6 rounded-lg bg-[#102c16]/55 border border-white/5 flex items-center px-2">
                      <div className="h-1.5 w-12 bg-white/10 rounded-full" />
                    </div>
                  </div>
                </button>
              </div>
            </Card>
          )}

          {/* ===== FATURAMENTO TAB ===== */}
          {activeTab === 'Faturamento' && (
            <div className="space-y-6">
              <Card className="p-10">
                <h3 className="text-2xl font-bold mb-2">Seu Plano</h3>
                <p className="opacity-40 text-sm mb-8">Escolha o plano ideal ou gerencie sua assinatura.</p>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  {PLANS.map(plan => {
                    const isCurrent = userPlan === plan.id;
                    return (
                      <div key={plan.id} className={`relative p-6 rounded-2xl border-2 transition-all ${
                        isCurrent
                          ? 'border-[#c1ff72]/40 bg-[#c1ff72]/5 shadow-[0_0_30px_rgba(193,255,114,0.08)]'
                          : plan.highlight
                            ? 'border-[#c1ff72]/20 bg-white/[0.02] hover:border-[#c1ff72]/30'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}>
                        {isCurrent ? (
                          <div className="absolute -top-3 left-4 bg-[#c1ff72] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                            Seu Plano
                          </div>
                        ) : plan.highlight && (
                          <div className="absolute -top-3 right-4 bg-[#c1ff72]/20 text-[#c1ff72] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                            Mais Popular
                          </div>
                        )}
                        <div className="mb-4 pt-1">
                          <h4 className="text-lg font-bold">{plan.name}</h4>
                          <p className="text-xs opacity-40 mt-1">{plan.tagline}</p>
                        </div>
                        <div className="mb-5">
                          <div className="text-3xl font-black text-[#c1ff72]">{plan.priceLabel}</div>
                          <div className="text-xs opacity-40 mt-1">{plan.priceSub}</div>
                        </div>
                        <div className="space-y-2.5 mb-6">
                          {plan.perks.map(f => (
                            <div key={f} className="flex items-center gap-2.5 text-sm">
                              <div className="w-4 h-4 rounded-full bg-[#c1ff72]/15 flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#c1ff72]" />
                              </div>
                              <span className="opacity-50">{f}</span>
                            </div>
                          ))}
                        </div>
                        {isCurrent ? (
                          <div className="h-11 flex items-center justify-center text-xs text-[#c1ff72] font-bold uppercase tracking-widest">
                            Plano Atual
                          </div>
                        ) : (
                          <Button className="w-full h-11" onClick={() => handleCheckout(plan.link)}>
                            Assinar {plan.name}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Plan info */}
                {planExpires && userPlan !== 'free' && (
                  <div className="text-center text-xs opacity-30">
                    Próxima cobrança em {new Date(planExpires).toLocaleDateString('pt-BR')}
                  </div>
                )}
                <p className="text-center text-xs opacity-20 mt-2">3 dias grátis para novos assinantes. Cancele quando quiser.</p>
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
                    <Badge variant={userPlan !== 'free' ? 'success' : 'default'}>
                      {userPlan === 'casal' ? 'Casal' : userPlan === 'individual' ? 'Individual' : 'Sem assinatura'}
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
