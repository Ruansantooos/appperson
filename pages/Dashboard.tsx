
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GymStats, Habit, Transaction, Supplement } from '../types';
import { Card, Badge, ButtonCircle } from '../components/ui/LayoutComponents';
import {
  TrendingUp,
  DollarSign,
  ChevronRight,
  Flame,
  Scale,
  Zap,
  Dumbbell,
  Plus,
  Utensils,
  Check,
  Pill,
  RotateCcw,
  Loader2
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';
import { WeightEntry } from '../types';

const DEFAULT_GYM_STATS: GymStats = {
  weight: 0, targetWeight: 0, bodyFat: 0, muscleMass: 0,
  caloriesConsumed: 0, targetCalories: 2000, protein: 0, carbs: 0, fat: 0
};

const getToday = () => new Date().toISOString().split('T')[0];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [gymStats, setGymStats] = useState<GymStats>(DEFAULT_GYM_STATS);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [supplementChecks, setSupplementChecks] = useState<Record<string, boolean>>({});
  const [todayWorkout, setTodayWorkout] = useState<{ name: string; muscleGroup: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Get supplement checks from localStorage for today
  const loadSupplementChecks = useCallback(() => {
    const today = getToday();
    const stored = localStorage.getItem(`supplement_checks_${today}`);
    if (stored) {
      setSupplementChecks(JSON.parse(stored));
    } else {
      setSupplementChecks({});
    }
  }, []);

  // Reset habits when day changes
  const checkDayReset = useCallback(async () => {
    if (!user) return;
    const today = getToday();
    const lastReset = localStorage.getItem(`daily_reset_${user.id}`);

    if (lastReset !== today) {
      // New day - reset all habits completed_today to false
      await supabase
        .from('habits')
        .update({ completed_today: false })
        .eq('user_id', user.id);

      // Clear old supplement checks
      const keys = Object.keys(localStorage).filter(k => k.startsWith('supplement_checks_') && !k.endsWith(today));
      keys.forEach(k => localStorage.removeItem(k));

      localStorage.setItem(`daily_reset_${user.id}`, today);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Reset day first
        await checkDayReset();
        loadSupplementChecks();

        // Fetch all data in parallel
        const [gymRes, weightRes, habitsRes, txRes, suppRes, workoutRes] = await Promise.all([
          supabase.from('gym_stats').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('weight_history').select('*').eq('user_id', user.id).order('date', { ascending: true }),
          supabase.from('habits').select('*').eq('user_id', user.id),
          supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
          supabase.from('supplements').select('*').eq('user_id', user.id),
          supabase.from('workouts').select('name, muscle_group, day_of_week').eq('user_id', user.id),
        ]);

        if (gymRes.data) {
          setGymStats({
            ...gymRes.data,
            targetWeight: gymRes.data.target_weight,
            muscleMass: gymRes.data.muscle_mass,
            caloriesConsumed: gymRes.data.calories_consumed,
            targetCalories: gymRes.data.target_calories,
            bodyFat: gymRes.data.body_fat
          });
        }

        if (weightRes.data) setWeightHistory(weightRes.data);

        if (habitsRes.data) {
          setHabits(habitsRes.data.map((h: any) => ({
            id: h.id,
            name: h.name,
            streak: h.streak || 0,
            bestStreak: h.best_streak || 0,
            progress: h.progress || 0,
            target: h.target || '',
            completedToday: h.completed_today || false,
            history: []
          })));
        }

        if (txRes.data) setTransactions(txRes.data);

        if (suppRes.data) {
          setSupplements(suppRes.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            dosage: s.dosage || '',
            frequency: s.frequency || '',
            instructions: s.instructions || '',
            currentStock: s.current_stock || 0,
            userId: s.user_id
          })));
        }

        // Find today's workout
        if (workoutRes.data && workoutRes.data.length > 0) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const todayDay = days[new Date().getDay()];
          const todayW = workoutRes.data.find((w: any) => w.day_of_week === todayDay);
          if (todayW) {
            setTodayWorkout({ name: todayW.name, muscleGroup: todayW.muscle_group });
          }
        }

      } catch (error) {
        // silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Toggle habit completion
  const toggleHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newValue = !habit.completedToday;
    const newStreak = newValue ? habit.streak + 1 : Math.max(0, habit.streak - 1);

    // Optimistic update
    setHabits(prev => prev.map(h =>
      h.id === habitId ? { ...h, completedToday: newValue, streak: newStreak } : h
    ));

    await supabase
      .from('habits')
      .update({
        completed_today: newValue,
        streak: newStreak,
        best_streak: newValue ? Math.max(habit.bestStreak, newStreak) : habit.bestStreak
      })
      .eq('id', habitId);
  };

  // Toggle supplement check
  const toggleSupplement = (suppId: string) => {
    const today = getToday();
    const newChecks = { ...supplementChecks, [suppId]: !supplementChecks[suppId] };
    setSupplementChecks(newChecks);
    localStorage.setItem(`supplement_checks_${today}`, JSON.stringify(newChecks));
  };

  // Calculations
  const totalBalance = transactions.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  const recentTransactions = transactions.slice(0, 5);
  const calProgress = gymStats.targetCalories > 0 ? (gymStats.caloriesConsumed / gymStats.targetCalories) * 100 : 0;
  const caloriesRemaining = gymStats.targetCalories - gymStats.caloriesConsumed;

  const macroData = [
    { name: 'Proteína', value: gymStats.protein, color: '#c1ff72' },
    { name: 'Carbo', value: gymStats.carbs, color: '#8fb0bc' },
    { name: 'Gordura', value: gymStats.fat, color: '#d8b4a6' },
  ];

  // Daily progress calculation
  const totalDailyItems = habits.length + supplements.length;
  const completedDailyItems = habits.filter(h => h.completedToday).length + supplements.filter(s => supplementChecks[s.id]).length;
  const dailyProgress = totalDailyItems > 0 ? Math.round((completedDailyItems / totalDailyItems) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#c1ff72]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Métricas de Topo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="dark" className="p-6 relative border-[#c1ff72]/20">
          <div className="absolute top-4 right-4 bg-[#c1ff72]/10 p-1.5 rounded-full text-[#c1ff72]">
            <DollarSign size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">Saldo Financeiro</p>
          <h4 className="text-2xl font-bold mt-2">R$ {totalBalance.toFixed(2)}</h4>
        </Card>
        <Card variant="peach" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
            <Scale size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Peso Atual</p>
          <h4 className="text-2xl font-bold mt-2">{gymStats.weight} kg</h4>
        </Card>
        <Card variant="blue" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full text-white/60">
            <Zap size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Rotina do Dia</p>
          <h4 className="text-2xl font-bold mt-2">{completedDailyItems} / {totalDailyItems}</h4>
        </Card>
        <Card variant="orange" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
            <Flame size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Calorias Hoje</p>
          <h4 className="text-2xl font-bold mt-2">{gymStats.caloriesConsumed} kcal</h4>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2. Calorie Tracker */}
        <div className="lg:col-span-8">
          <Card className="p-8 h-full bg-gradient-to-br from-[#161616] to-[#0c0c0c] border-white/5">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold">Consumo Calórico Diário</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">Status em tempo real</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
              <div className="md:col-span-2 space-y-8">
                <div className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5">
                  <div className="flex justify-between items-end mb-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Meta: {gymStats.targetCalories} kcal</p>
                      <h4 className="text-5xl font-bold tracking-tighter">{gymStats.caloriesConsumed} <span className="text-xl font-medium text-white/10 uppercase">Ingeridas</span></h4>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#c1ff72]">{Math.round(calProgress)}%</span>
                    </div>
                  </div>
                  <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-[#c1ff72] rounded-full shadow-[0_0_15px_rgba(193,255,114,0.4)] transition-all duration-1000"
                      style={{ width: `${Math.min(calProgress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#c1ff72] animate-pulse"></div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">
                      Faltam <span className="text-white">{caloriesRemaining} kcal</span> para bater a meta
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {macroData.map(item => (
                    <div key={item.name} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">{item.name}</p>
                      <p className="text-lg font-bold">{item.value}g</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-[240px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroData.some(m => m.value > 0) ? macroData : [{ name: 'Vazio', value: 1, color: '#333' }]}
                      cx="50%" cy="50%" innerRadius={70} outerRadius={100}
                      paddingAngle={5} dataKey="value" stroke="none"
                    >
                      {(macroData.some(m => m.value > 0) ? macroData : [{ color: '#333' }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <Utensils size={32} className="text-white/10" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 3. ROTINA DO DIA - Checklist */}
        <div className="lg:col-span-4">
          <Card className="p-8 h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold">Rotina do Dia</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">
                  {dailyProgress}% concluído
                </p>
              </div>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#c1ff72" strokeWidth="4"
                    strokeDasharray={`${dailyProgress * 1.256} 125.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#c1ff72]">
                  {dailyProgress}%
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {/* Hábitos */}
              {habits.length > 0 && (
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">Hábitos</p>
              )}
              {habits.map(habit => (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 group ${
                    habit.completedToday
                      ? 'bg-[#c1ff72]/10 border-[#c1ff72]/30'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    habit.completedToday
                      ? 'bg-[#c1ff72] text-black'
                      : 'bg-white/5 text-white/30 group-hover:bg-white/10'
                  }`}>
                    {habit.completedToday ? <Check size={16} strokeWidth={3} /> : <Zap size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${habit.completedToday ? 'line-through text-white/40' : ''}`}>
                      {habit.name}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5">{habit.streak} dias seguidos</p>
                  </div>
                  {habit.completedToday && (
                    <span className="text-[10px] font-bold text-[#c1ff72] uppercase shrink-0">Feito</span>
                  )}
                </button>
              ))}

              {/* Suplementos */}
              {supplements.length > 0 && (
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-4 mb-1">Suplementos</p>
              )}
              {supplements.map(supp => {
                const checked = !!supplementChecks[supp.id];
                return (
                  <button
                    key={supp.id}
                    onClick={() => toggleSupplement(supp.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 group ${
                      checked
                        ? 'bg-[#c1ff72]/10 border-[#c1ff72]/30'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      checked
                        ? 'bg-[#c1ff72] text-black'
                        : 'bg-white/5 text-white/30 group-hover:bg-white/10'
                    }`}>
                      {checked ? <Check size={16} strokeWidth={3} /> : <Pill size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${checked ? 'line-through text-white/40' : ''}`}>
                        {supp.name}
                      </p>
                      <p className="text-[10px] text-white/20 mt-0.5">{supp.dosage}{supp.frequency ? ` • ${supp.frequency}` : ''}</p>
                    </div>
                    {checked && (
                      <span className="text-[10px] font-bold text-[#c1ff72] uppercase shrink-0">Tomado</span>
                    )}
                  </button>
                );
              })}

              {/* Treino do dia */}
              {todayWorkout && (
                <>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-4 mb-1">Treino</p>
                  <div className="p-4 rounded-2xl bg-[#c1ff72]/10 border border-[#c1ff72]/20 relative overflow-hidden">
                    <Dumbbell size={50} className="absolute -right-2 -bottom-2 text-[#c1ff72]/10" />
                    <p className="text-sm font-bold">{todayWorkout.name}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{todayWorkout.muscleGroup}</p>
                  </div>
                </>
              )}

              {/* Empty state */}
              {habits.length === 0 && supplements.length === 0 && (
                <div className="text-center py-8">
                  <RotateCcw size={32} className="text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/30">Nenhuma rotina cadastrada.</p>
                  <p className="text-[10px] text-white/20 mt-1">Adicione hábitos e suplementos para acompanhar aqui.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 4. Transações Recentes */}
        <div className="lg:col-span-8">
          <Card className="p-8">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold">Fluxo Financeiro</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white/30 text-[10px] uppercase tracking-[0.2em] border-b border-white/5 pb-4">
                    <th className="pb-4 font-medium">Data</th>
                    <th className="pb-4 font-medium">Descrição</th>
                    <th className="pb-4 font-medium">Categoria</th>
                    <th className="pb-4 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentTransactions.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-white/40">Nenhuma transação recente.</td></tr>
                  ) : recentTransactions.map((tx) => (
                    <tr key={tx.id} className="group border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                      <td className="py-6 text-white/40 font-medium">{tx.date}</td>
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                            <DollarSign size={14} />
                          </div>
                          <span className="font-bold">{tx.description}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <Badge variant="status">{tx.category}</Badge>
                      </td>
                      <td className={`py-6 text-right font-bold ${tx.type === 'income' ? 'text-[#c1ff72]' : 'text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* 5. Evolução de Peso */}
        <div className="lg:col-span-4">
          <Card className="p-8 h-full bg-[#161616]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-medium text-white/60">Evolução Peso</h3>
              <Scale size={18} className="text-white/20" />
            </div>
            <div className="h-[180px] w-full">
              {weightHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightHistory.map(entry => ({
                    month: new Date(entry.date).toLocaleDateString('pt-BR', { month: 'short' }),
                    weight: entry.weight
                  }))}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c1ff72" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#c1ff72" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" hide />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid #333', borderRadius: '12px' }}
                      itemStyle={{ color: '#c1ff72' }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#c1ff72" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-white/20 text-sm">
                  Sem dados de peso registrados
                </div>
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Peso Atual</p>
                  <p className="text-2xl font-bold">{gymStats.weight} kg</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Meta</p>
                  <p className="text-2xl font-bold text-[#c1ff72]">{gymStats.targetWeight || '—'} kg</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
