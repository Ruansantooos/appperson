
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, ButtonCircle } from '../components/ui/LayoutComponents';
import { Plus, Zap, Award, Flame, Check, MoreHorizontal, ArrowUpRight, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Habit } from '../types';

const HabitsPage: React.FC = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<Record<string, string[]>>({}); // habit_id -> array of dates
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    progress: 0
  });

  useEffect(() => {
    if (!user) return;
    fetchHabits();
  }, [user]);

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);



      if (data) {
        const mappedHabits = data.map((h: any) => ({
          ...h,
          completedToday: h.completed_today,
          bestStreak: h.best_streak,
          createdAt: h.created_at
        }));
        setHabits(mappedHabits);

        // Fetch logs for history visualization (last 28 days)
        const twentyEightDaysAgo = new Date();
        twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

        const { data: logsData } = await supabase
          .from('habit_logs')
          .select('habit_id, date')
          .eq('user_id', user.id)
          .gte('date', twentyEightDaysAgo.toISOString().split('T')[0]);

        if (logsData) {
          const logsMap: Record<string, string[]> = {};
          logsData.forEach((log: any) => {
            if (!logsMap[log.habit_id]) logsMap[log.habit_id] = [];
            logsMap[log.habit_id].push(log.date);
          });
          setHabitLogs(logsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (id: string, completed: boolean) => {
    const today = new Date().toISOString().split('T')[0];

    // Optimistic update
    setHabits(prev => prev.map(h => h.id === id ? {
      ...h,
      completedToday: !completed,
      streak: !completed ? h.streak + 1 : Math.max(0, h.streak - 1)
    } : h));

    try {
      // 1. Update habits table
      await supabase.from('habits').update({
        completed_today: !completed,
        streak: !completed ? habits.find(h => h.id === id)!.streak + 1 : Math.max(0, habits.find(h => h.id === id)!.streak - 1)
      }).eq('id', id);

      // 2. Update/Insert habit_logs table
      if (!completed) {
        await supabase.from('habit_logs').upsert({
          habit_id: id,
          user_id: user!.id,
          date: today,
          completed: true
        });
      } else {
        await supabase.from('habit_logs').delete().eq('habit_id', id).eq('date', today);
      }

      fetchHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
      fetchHabits();
    }
  };

  const openCreateModal = () => {
    setEditingHabit(null);
    setFormData({ name: '', target: '', progress: 0 });
    setShowModal(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      target: habit.target,
      progress: habit.progress
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Ensure progress is a valid integer
      const progressValue = parseInt(formData.progress.toString()) || 0;

      console.log('Saving habit with data:', {
        name: formData.name,
        target: formData.target,
        progress: progressValue,
        isEditing: !!editingHabit
      });

      if (editingHabit) {
        // Update existing habit
        const { data, error } = await supabase
          .from('habits')
          .update({
            name: formData.name,
            target: formData.target,
            progress: progressValue
          })
          .eq('id', editingHabit.id)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        console.log('Habit updated successfully:', data);
      } else {
        // Create new habit
        const { data, error } = await supabase
          .from('habits')
          .insert({
            user_id: user.id,
            name: formData.name,
            target: formData.target,
            progress: progressValue,
            streak: 0,
            best_streak: 0,
            completed_today: false
          })
          .select();

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
        console.log('Habit created successfully:', data);
      }

      setShowModal(false);
      fetchHabits();
    } catch (error: any) {
      console.error('Error saving habit:', error);
      alert(`Erro ao salvar hábito: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este hábito?')) return;

    try {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
      fetchHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      alert('Erro ao deletar hábito.');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="orange" className="p-8 relative">
          <div className="absolute top-6 right-6 bg-black/10 p-2 rounded-full">
            <Flame size={20} />
          </div>
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Melhor Streak</p>
          <h4 className="text-3xl font-bold mt-2">{Math.max(...habits.map(h => h.bestStreak), 0)} Dias</h4>
        </Card>
        <Card variant="blue" className="p-8 relative">
          <div className="absolute top-6 right-6 bg-black/10 p-2 rounded-full">
            <Zap size={20} />
          </div>
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Conclusão Hoje</p>
          <h4 className="text-3xl font-bold mt-2">
            {habits.length > 0 ? Math.round((habits.filter(h => h.completedToday).length / habits.length) * 100) : 0}%
          </h4>
        </Card>
        <Card variant="peach" className="p-8 relative">
          <div className="absolute top-6 right-6 bg-black/10 p-2 rounded-full">
            <Award size={20} />
          </div>
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Total Ativos</p>
          <h4 className="text-3xl font-bold mt-2">{habits.length}</h4>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {habits.length === 0 ? (
          <p className="text-white/40 col-span-2 text-center py-10">Nenhum hábito encontrado.</p>
        ) : habits.map(habit => (
          <Card key={habit.id} className="p-8 group relative overflow-visible">
            <div className="flex justify-between items-start mb-10">
              <div className="flex gap-6">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all ${habit.completedToday ? 'bg-[#c1ff72] text-black shadow-[0_0_20px_rgba(193,255,114,0.3)]' : 'bg-[var(--input-bg)] text-[var(--foreground)] opacity-20'}`}>
                  <Zap size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{habit.name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] flex items-center gap-1">
                      <Flame size={12} className="text-[#e6a06e]" /> {habit.streak} dias
                    </span>
                    <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] flex items-center gap-1">
                      <Award size={12} className="text-[#c1ff72]" /> Recorde: {habit.bestStreak}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(habit)}
                  className="opacity-20 hover:text-[#c1ff72] hover:opacity-100 transition-all"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(habit.id)}
                  className="opacity-20 hover:text-red-400 hover:opacity-100 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-[#c1ff72]">{habit.progress}% CONCLUÍDO</span>
                <span className="opacity-30">META: {habit.target}</span>
              </div>
              <div className="w-full bg-[var(--input-bg)] h-1.5 rounded-full overflow-hidden border border-[var(--card-border)]">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${habit.completedToday ? 'bg-[#c1ff72]' : 'bg-[var(--foreground)] opacity-20'}`}
                  style={{ width: `${habit.progress}%` }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => toggleHabit(habit.id, habit.completedToday)}
                  variant={habit.completedToday ? 'outline' : 'primary'}
                  className={`flex-1 h-12 ${habit.completedToday ? 'border-[#c1ff72]/20 text-[#c1ff72] bg-[#c1ff72]/5' : ''}`}
                >
                  {habit.completedToday ? <><Check size={18} /> Concluído</> : 'Marcar como Feito'}
                </Button>
                <button className="w-12 h-12 rounded-full border border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-center opacity-40 hover:opacity-100 transition-all">
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </div>

            {/* History visualization grid */}
            <div className="mt-8 border-t border-white/5 pt-6">
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 28 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (27 - i));
                  const dateStr = date.toISOString().split('T')[0];
                  const isLogged = habitLogs[habit.id]?.includes(dateStr);

                  return (
                    <div
                      key={i}
                      title={dateStr}
                      className={`w-2.5 h-2.5 rounded-[2px] ${isLogged ? 'bg-[#c1ff72]/40' : 'bg-white/5'}`}
                    />
                  );
                })}
              </div>
            </div>
          </Card>
        ))}

        {/* Add New Habit Card */}
        <button
          onClick={openCreateModal}
          className="p-8 rounded-[28px] border-2 border-dashed border-[var(--card-border)] hover:border-[#c1ff72]/30 hover:bg-[#c1ff72]/5 transition-all group flex flex-col items-center justify-center gap-4 opacity-20 hover:opacity-100 hover:text-[#c1ff72]"
        >
          <div className="w-16 h-16 rounded-full border border-current flex items-center justify-center transition-transform group-hover:scale-110">
            <Plus size={32} />
          </div>
          <span className="font-bold uppercase tracking-[0.2em] text-xs">Adicionar Novo Hábito</span>
        </button>
      </div>

      {/* Modal for Create/Edit Habit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-6">
              {editingHabit ? 'Editar Hábito' : 'Novo Hábito'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">
                  Nome do Hábito
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-14 px-6 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all placeholder:opacity-20"
                  placeholder="Ex: Meditar 10 minutos"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">
                  Meta
                </label>
                <input
                  type="text"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full h-14 px-6 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all placeholder:opacity-20"
                  placeholder="Ex: Diariamente"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest opacity-40 mb-2">
                  Progresso Inicial (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="w-full h-14 px-6 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-12 rounded-full font-bold bg-transparent border border-white/10 text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-full font-bold bg-[#c1ff72] text-black hover:bg-[#b0f061] transition-all"
                >
                  {editingHabit ? 'Salvar' : 'Criar Hábito'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HabitsPage;
