
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GymStats, Habit, Transaction, Supplement, Task, WorkoutExercise } from '../types';
import { Card, Badge } from '../components/ui/LayoutComponents';
import {
  DollarSign,
  Flame,
  Scale,
  Zap,
  Dumbbell,
  Check,
  Pill,
  Loader2,
  CalendarDays,
  ListTodo,
  AlertTriangle,
  TrendingDown,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { WeightEntry } from '../types';

const getToday = () => new Date().toISOString().split('T')[0];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const formatDateBR = () => {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

interface TodayWorkout {
  name: string;
  muscleGroup: string;
  exercises: WorkoutExercise[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [gymStats, setGymStats] = useState<GymStats>({ weight: 0, targetWeight: 0, bodyFat: 0, muscleMass: 0, caloriesConsumed: 0, targetCalories: 2000, protein: 0, carbs: 0, fat: 0 });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [supplementChecks, setSupplementChecks] = useState<Record<string, boolean>>({});
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSupplementChecks = useCallback(() => {
    const stored = localStorage.getItem(`supplement_checks_${getToday()}`);
    setSupplementChecks(stored ? JSON.parse(stored) : {});
  }, []);

  const checkDayReset = useCallback(async () => {
    if (!user) return;
    const today = getToday();
    const lastReset = localStorage.getItem(`daily_reset_${user.id}`);
    if (lastReset !== today) {
      await supabase.from('habits').update({ completed_today: false }).eq('user_id', user.id);
      Object.keys(localStorage).filter(k => k.startsWith('supplement_checks_') && !k.endsWith(today)).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(`daily_reset_${user.id}`, today);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        await checkDayReset();
        loadSupplementChecks();

        const [profileRes, gymRes, habitsRes, txRes, suppRes, workoutRes, tasksRes, weightRes] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
          supabase.from('gym_stats').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('habits').select('*').eq('user_id', user.id),
          supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
          supabase.from('supplements').select('*').eq('user_id', user.id),
          supabase.from('workouts').select('*, workout_exercises(*)').eq('user_id', user.id),
          supabase.from('tasks').select('*').eq('user_id', user.id).in('status', ['Pending', 'pending']),
          supabase.from('weight_history').select('*').eq('user_id', user.id).order('date', { ascending: true }),
        ]);

        if (profileRes.data?.full_name) setUserName(profileRes.data.full_name.split(' ')[0]);
        if (gymRes.data) {
          setGymStats({
            weight: gymRes.data.weight || 0, targetWeight: gymRes.data.target_weight || 0,
            bodyFat: gymRes.data.body_fat || 0, muscleMass: gymRes.data.muscle_mass || 0,
            caloriesConsumed: gymRes.data.calories_consumed || 0, targetCalories: gymRes.data.target_calories || 2000,
            protein: gymRes.data.protein || 0, carbs: gymRes.data.carbs || 0, fat: gymRes.data.fat || 0
          });
        }
        if (habitsRes.data) {
          setHabits(habitsRes.data.map((h: any) => ({
            id: h.id, name: h.name, streak: h.streak || 0, bestStreak: h.best_streak || 0,
            progress: h.progress || 0, target: h.target || '', completedToday: h.completed_today || false, history: []
          })));
        }
        if (txRes.data) setTransactions(txRes.data);
        if (weightRes.data) setWeightHistory(weightRes.data);
        if (suppRes.data) {
          setSupplements(suppRes.data.map((s: any) => ({
            id: s.id, name: s.name, dosage: s.dosage || '', frequency: s.frequency || '',
            instructions: s.instructions || '', currentStock: s.current_stock || 0, userId: s.user_id
          })));
        }

        // Today's workout with exercises
        if (workoutRes.data && workoutRes.data.length > 0) {
          const days: Record<number, string> = { 0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' };
          const todayW = workoutRes.data.find((w: any) => w.day_of_week === days[new Date().getDay()]);
          if (todayW) {
            setTodayWorkout({
              name: todayW.name,
              muscleGroup: todayW.muscle_group || '',
              exercises: (todayW.workout_exercises || []).map((e: any) => ({
                id: e.id, workoutId: e.workout_id, name: e.name, sets: e.sets,
                reps: e.reps, weight: e.weight, orderIndex: e.order_index
              })).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
            });
          }
        }

        // Tasks due today or overdue
        if (tasksRes.data) {
          const today = getToday();
          const relevant = tasksRes.data.filter((t: any) => {
            if (!t.due_date) return true; // tasks without due date are always shown
            const dueDate = t.due_date.split('T')[0];
            return dueDate <= today;
          }).slice(0, 5);
          setTodayTasks(relevant.map((t: any) => ({
            id: t.id, title: t.title, description: t.description, priority: t.priority,
            status: t.status, dueDate: t.due_date, category: t.category
          })));
        }

      } catch (error) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const toggleHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const newValue = !habit.completedToday;
    const newStreak = newValue ? habit.streak + 1 : Math.max(0, habit.streak - 1);
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completedToday: newValue, streak: newStreak } : h));
    await supabase.from('habits').update({
      completed_today: newValue, streak: newStreak,
      best_streak: newValue ? Math.max(habit.bestStreak, newStreak) : habit.bestStreak
    }).eq('id', habitId);
  };

  const toggleSupplement = (suppId: string) => {
    const today = getToday();
    const newChecks = { ...supplementChecks, [suppId]: !supplementChecks[suppId] };
    setSupplementChecks(newChecks);
    localStorage.setItem(`supplement_checks_${today}`, JSON.stringify(newChecks));
  };

  // Calculations
  const totalBalance = transactions.reduce((acc, curr) => curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);
  const thisMonthExpenses = transactions.filter(t => {
    const txDate = new Date(t.date);
    const now = new Date();
    return t.type === 'expense' && txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  }).reduce((acc, curr) => acc + Number(curr.amount), 0);

  const recentExpenses = transactions.filter(t => t.type === 'expense').slice(0, 4);

  // Weekly spending chart data
  const weeklySpending = (() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const now = new Date();
    const result: { day: string; gasto: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTotal = transactions
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((acc, t) => acc + Number(t.amount), 0);
      result.push({ day: days[d.getDay()], gasto: dayTotal });
    }
    return result;
  })();

  // Macro data for pie chart
  const macroData = [
    { name: 'Proteína', value: gymStats.protein, color: '#c1ff72' },
    { name: 'Carbo', value: gymStats.carbs, color: '#8fb0bc' },
    { name: 'Gordura', value: gymStats.fat, color: '#d8b4a6' },
  ];
  const hasMacros = macroData.some(m => m.value > 0);
  const calProgress = gymStats.targetCalories > 0 ? Math.round((gymStats.caloriesConsumed / gymStats.targetCalories) * 100) : 0;

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
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">{getGreeting()}{userName ? `, ${userName}` : ''}</h1>
          <p className="text-sm text-white/30 mt-1 capitalize">{formatDateBR()}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="#c1ff72" strokeWidth="4"
                strokeDasharray={`${dailyProgress * 1.256} 125.6`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#c1ff72]">{dailyProgress}%</span>
          </div>
          <span className="text-xs text-white/30 font-bold">{completedDailyItems}/{totalDailyItems} feitos</span>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card variant="dark" className="p-5 relative border-[#c1ff72]/20">
          <DollarSign size={14} className="absolute top-3 right-3 text-[#c1ff72]/40" />
          <p className="text-[9px] font-bold opacity-40 uppercase tracking-[0.2em]">Saldo</p>
          <h4 className={`text-xl font-bold mt-1 ${totalBalance < 0 ? 'text-red-400' : ''}`}>R$ {totalBalance.toFixed(2)}</h4>
        </Card>
        <Card variant="peach" className="p-5 relative">
          <Scale size={14} className="absolute top-3 right-3 opacity-40" />
          <p className="text-[9px] font-bold opacity-60 uppercase tracking-[0.2em]">Peso</p>
          <h4 className="text-xl font-bold mt-1">{gymStats.weight} kg</h4>
        </Card>
        <Card variant="blue" className="p-5 relative">
          <TrendingDown size={14} className="absolute top-3 right-3 opacity-40" />
          <p className="text-[9px] font-bold opacity-60 uppercase tracking-[0.2em]">Gastos Mês</p>
          <h4 className="text-xl font-bold mt-1">R$ {thisMonthExpenses.toFixed(2)}</h4>
        </Card>
        <Card variant="orange" className="p-5 relative">
          <ListTodo size={14} className="absolute top-3 right-3 opacity-40" />
          <p className="text-[9px] font-bold opacity-60 uppercase tracking-[0.2em]">Tarefas</p>
          <h4 className="text-xl font-bold mt-1">{todayTasks.length} pendentes</h4>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Checklist do Dia */}
        <div className="lg:col-span-5 space-y-6">

          {/* Hábitos */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Zap size={16} className="text-[#c1ff72]" /> Hábitos do Dia</h3>
              <span className="text-[10px] text-white/30 font-bold">{habits.filter(h => h.completedToday).length}/{habits.length}</span>
            </div>
            {habits.length === 0 ? (
              <p className="text-xs text-white/20 py-2">Nenhum hábito cadastrado. <Link to="/habits" className="text-[#c1ff72] hover:underline">Criar</Link></p>
            ) : (
              <div className="space-y-2">
                {habits.map(habit => (
                  <button key={habit.id} onClick={() => toggleHabit(habit.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 group ${
                      habit.completedToday ? 'bg-[#c1ff72]/10 border-[#c1ff72]/30' : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                    }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      habit.completedToday ? 'bg-[#c1ff72] text-black' : 'bg-white/5 text-white/30'
                    }`}>
                      {habit.completedToday ? <Check size={14} strokeWidth={3} /> : <div className="w-3 h-3 rounded border border-white/20" />}
                    </div>
                    <span className={`text-sm font-medium flex-1 ${habit.completedToday ? 'line-through text-white/30' : ''}`}>{habit.name}</span>
                    <span className="text-[9px] text-white/15 font-bold">{habit.streak}d</span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Suplementos */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Pill size={16} className="text-[#c1ff72]" /> Suplementos</h3>
              <span className="text-[10px] text-white/30 font-bold">{supplements.filter(s => supplementChecks[s.id]).length}/{supplements.length}</span>
            </div>
            {supplements.length === 0 ? (
              <p className="text-xs text-white/20 py-2">Nenhum suplemento. <Link to="/gym" className="text-[#c1ff72] hover:underline">Adicionar</Link></p>
            ) : (
              <div className="space-y-2">
                {supplements.map(supp => {
                  const checked = !!supplementChecks[supp.id];
                  return (
                    <button key={supp.id} onClick={() => toggleSupplement(supp.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 group ${
                        checked ? 'bg-[#c1ff72]/10 border-[#c1ff72]/30' : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                      }`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        checked ? 'bg-[#c1ff72] text-black' : 'bg-white/5 text-white/30'
                      }`}>
                        {checked ? <Check size={14} strokeWidth={3} /> : <div className="w-3 h-3 rounded border border-white/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium block ${checked ? 'line-through text-white/30' : ''}`}>{supp.name}</span>
                        <span className="text-[9px] text-white/15">{supp.dosage}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Tarefas Pendentes */}
          {todayTasks.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><ListTodo size={16} className="text-[#c1ff72]" /> Tarefas Pendentes</h3>
                <Link to="/tasks" className="text-[10px] text-[#c1ff72] font-bold hover:underline flex items-center gap-1">
                  Ver todas <ChevronRight size={12} />
                </Link>
              </div>
              <div className="space-y-2">
                {todayTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-[9px] text-white/20 flex items-center gap-1 mt-0.5">
                          <Clock size={9} />
                          {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                      )}
                    </div>
                    {task.priority && (
                      <Badge variant={task.priority === 'High' ? 'danger' : 'status'}>{task.priority === 'High' ? 'Urgente' : task.priority}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT: Treino + Finanças */}
        <div className="lg:col-span-7 space-y-6">

          {/* Treino do Dia */}
          <Card className="p-6 bg-gradient-to-br from-[#161616] to-[#0c0c0c] border-white/5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold flex items-center gap-2"><Dumbbell size={16} className="text-[#c1ff72]" /> Treino de Hoje</h3>
              <Link to="/gym" className="text-[10px] text-[#c1ff72] font-bold hover:underline flex items-center gap-1">
                Academia <ChevronRight size={12} />
              </Link>
            </div>

            {todayWorkout ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-4 py-2 rounded-xl bg-[#c1ff72] text-black font-bold text-sm">{todayWorkout.name}</div>
                  {todayWorkout.muscleGroup && (
                    <span className="text-xs text-white/40">{todayWorkout.muscleGroup}</span>
                  )}
                </div>
                <div className="space-y-2">
                  {todayWorkout.exercises.map((ex, idx) => (
                    <div key={ex.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-white/15 w-5">{idx + 1}.</span>
                        <span className="text-sm font-medium">{ex.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-white/30">{ex.sets} x {ex.reps}</span>
                        {ex.weight && <span className="text-[#c1ff72] font-bold">{ex.weight}kg</span>}
                      </div>
                    </div>
                  ))}
                  {todayWorkout.exercises.length === 0 && (
                    <p className="text-xs text-white/20 text-center py-4">Nenhum exercício cadastrado neste treino.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Dumbbell size={40} className="text-white/5 mx-auto mb-3" />
                <p className="text-sm text-white/20">Dia de descanso</p>
                <p className="text-[10px] text-white/10 mt-1">Nenhum treino agendado para hoje</p>
              </div>
            )}
          </Card>

          {/* Resumo Financeiro */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold flex items-center gap-2"><DollarSign size={16} className="text-[#c1ff72]" /> Finanças</h3>
              <Link to="/finance" className="text-[10px] text-[#c1ff72] font-bold hover:underline flex items-center gap-1">
                Ver tudo <ChevronRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Saldo Total</p>
                <p className={`text-lg font-bold mt-1 ${totalBalance < 0 ? 'text-red-400' : 'text-[#c1ff72]'}`}>
                  R$ {totalBalance.toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Gastos do Mês</p>
                <p className="text-lg font-bold mt-1 text-red-400/80">R$ {thisMonthExpenses.toFixed(2)}</p>
              </div>
            </div>

            {recentExpenses.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-2">Últimos Gastos</p>
                {recentExpenses.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                        <DollarSign size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description}</p>
                        <p className="text-[9px] text-white/20">{tx.date} • {tx.category}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-400/80 shrink-0 ml-3">- R$ {Number(tx.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/20 text-center py-4">Nenhum gasto registrado.</p>
            )}

            {totalBalance < 0 && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertTriangle size={16} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">Atenção: seu saldo está negativo!</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Spending Chart */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full">
            <h3 className="text-sm font-bold mb-1">Gastos da Semana</h3>
            <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] mb-4">Últimos 7 dias</p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySpending} barSize={20}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid #333', borderRadius: '12px', fontSize: 12 }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Gasto']}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="gasto" fill="#c1ff72" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Nutrition / Calories */}
        <div className="lg:col-span-4">
          <Card className="p-6 h-full">
            <h3 className="text-sm font-bold mb-1">Nutrição Hoje</h3>
            <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] mb-4">{gymStats.caloriesConsumed} / {gymStats.targetCalories} kcal ({calProgress}%)</p>
            <div className="flex items-center gap-6">
              <div className="h-[140px] w-[140px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={hasMacros ? macroData : [{ name: 'Vazio', value: 1, color: '#222' }]}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={62}
                      paddingAngle={4} dataKey="value" stroke="none"
                    >
                      {(hasMacros ? macroData : [{ color: '#222' }]).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">{calProgress}%</span>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                {macroData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-white/40">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{item.value}g</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Weight Evolution */}
        <div className="lg:col-span-3">
          <Card className="p-6 h-full bg-[#161616]">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold">Peso</h3>
              <Scale size={14} className="text-white/15" />
            </div>
            <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] mb-4">Evolução</p>
            <div className="h-[120px]">
              {weightHistory.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightHistory.map(e => ({
                    d: new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                    peso: e.weight
                  }))}>
                    <defs>
                      <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c1ff72" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#c1ff72" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0c0c0c', border: '1px solid #333', borderRadius: '12px', fontSize: 12 }}
                      formatter={(value: number) => [`${value} kg`, 'Peso']}
                    />
                    <Area type="monotone" dataKey="peso" stroke="#c1ff72" strokeWidth={2} fillOpacity={1} fill="url(#wGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-white/10 text-xs">
                  Sem histórico
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
              <div>
                <p className="text-[9px] text-white/20">Atual</p>
                <p className="text-lg font-bold">{gymStats.weight} kg</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/20">Meta</p>
                <p className="text-lg font-bold text-[#c1ff72]">{gymStats.targetWeight || '—'} kg</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
