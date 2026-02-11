
import React from 'react';
import { Card, Button, Input, Badge, ButtonCircle } from '../components/ui/LayoutComponents';
import { User, Bell, Shield, Smartphone, Globe, CreditCard, ChevronRight, Camera, LogOut, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';

const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('Perfil');
  const [profile, setProfile] = React.useState<Partial<Profile>>({
    fullName: '',
    email: '',
    gender: 'Other',
    birthDate: '',
    height: 0,
    activityLevel: '',
    goal: ''
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
      } else {
        setProfile(prev => ({ ...prev, email: user?.email || '' }));
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
      // Prepare data with proper null handling
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


      const { data, error } = await supabase
        .from('profiles')
        .upsert(updateData, {
          onConflict: 'id'
        })
        .select();

      if (error) {
        throw error;
      }
      alert('Configurações salvas com sucesso!');
      await fetchProfile(); // Refresh data
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(`Erro ao salvar configurações: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Tem certeza que deseja deletar sua conta? Esta ação é irreversível.')) {
      alert('Para deletar sua conta, entre em contato com o suporte ou use o console do Supabase (Ação Crítica).');
    }
  };

  if (loading && !profile.email) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#c1ff72]" size={32} />
      </div>
    );
  }
  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3">
          <Card className="p-4 bg-white/[0.02] border-white/5 space-y-2">
            {[
              { label: 'Perfil', icon: User, active: true },
              { label: 'Notificações', icon: Bell },
              { label: 'Segurança', icon: Shield },
              { label: 'Integrações', icon: Smartphone },
              { label: 'Preferências', icon: Globe },
              { label: 'Faturamento', icon: CreditCard },
            ].map(item => (
              <button
                key={item.label}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === item.label
                  ? 'bg-[#c1ff72] text-black shadow-[0_0_15px_rgba(193,255,114,0.2)]'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                onClick={() => setActiveTab(item.label)}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={18} />
                  {item.label}
                </div>
                {item.active && <ChevronRight size={14} />}
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
          <Card className="p-10">
            <h3 className="text-2xl font-bold mb-10">Configurações de Perfil</h3>

            <div className="flex flex-col sm:flex-row items-center gap-10 mb-12">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[40px] bg-[#c1ff72] text-black flex items-center justify-center text-4xl font-bold shadow-2xl border-4 border-white/5">
                  {profile.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                </div>
                <button className="absolute -bottom-2 -right-2 bg-[#c1ff72] p-3 rounded-full text-black shadow-xl hover:scale-110 transition-transform">
                  <Camera size={20} />
                </button>
              </div>
              <div className="text-center sm:text-left">
                <h4 className="text-2xl font-bold">{profile.fullName || 'Usuário'}</h4>
                <p className="text-sm text-white/30 mt-1 uppercase tracking-widest font-bold">Central Saúde</p>
                <div className="flex gap-2 mt-4 justify-center sm:justify-start">
                  <Badge variant="success">Pro</Badge>
                  <Badge variant="status">Sincronizado</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Nome Completo</label>
                <Input
                  value={profile.fullName}
                  onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                  className="h-14 bg-[#161616] border-white/5"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Email Principal</label>
                <Input
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  className="h-14 bg-[#161616] border-white/5"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Data de Nascimento</label>
                <Input
                  type="date"
                  value={profile.birthDate}
                  onChange={e => setProfile({ ...profile, birthDate: e.target.value })}
                  className="h-14 bg-[#161616] border-white/5"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Altura (cm)</label>
                <Input
                  type="number"
                  value={profile.height}
                  onChange={e => setProfile({ ...profile, height: parseFloat(e.target.value) })}
                  className="h-14 bg-[#161616] border-white/5"
                />
              </div>
            </div>

            <div className="mt-12 flex justify-end gap-4">
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
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 border-red-500/10 bg-red-500/[0.02]">
              <h3 className="text-lg font-bold text-red-400 mb-2">Zona Crítica</h3>
              <p className="text-xs text-white/30 mb-8 leading-relaxed font-bold uppercase tracking-widest">Remover sua conta irá deletar permanentemente todos os seus dados e históricos do Central Saúde.</p>
              <Button
                variant="danger"
                className="w-full h-12 bg-red-600/20 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                onClick={handleDeleteAccount}
              >
                Deletar Minha Conta
              </Button>
            </Card>
            <Card variant="blue" className="p-8">
              <h3 className="text-lg font-bold mb-4">Central Saúde Cloud</h3>
              <p className="text-xs font-bold opacity-60 uppercase tracking-widest leading-relaxed mb-6">Backup automático ativado. Seus dados estão sincronizados com segurança.</p>
              <div className="flex items-center justify-between bg-black/10 px-6 py-4 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-widest">Último backup</span>
                <span className="text-xs font-bold">Há 2 horas</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
