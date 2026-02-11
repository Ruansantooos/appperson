
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GymStats, Habit, Transaction, Nutrition } from '../types';
import { Card, Badge, ButtonCircle } from '../components/ui/LayoutComponents';
import {
  ArrowUpRight,
  MoreHorizontal,
  TrendingUp,
  Activity,
  DollarSign,
  Download,
  ChevronRight,
  User,
  Flame,
  Scale,
  Zap,
  Dumbbell,
  // Added missing Plus and Utensils icons
  Plus,
  Utensils
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { MOCK_NUTRITION, WEIGHT_HISTORY } from '../lib/mock-data';

// Fallback defaults if data is missing
const DEFAULT_GYM_STATS: GymStats = {
  weight: 0,
  targetWeight: 0,
  bodyFat: 0,
  muscleMass: 0,
  caloriesConsumed: 0,
  targetCalories: 2000
};

const DEFAULT_NUTRITION: Nutrition = {
  protein: 0,
  carbs: 0,
  fat: 0
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [gymStats, setGymStats] = useState<GymStats>(DEFAULT_GYM_STATS);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived state for nutrition (mocked for now as it's not in schema yet or derives from meals)
  // For this example we will keep using mock nutrition or derived from calories if possible.
  // Let's use the mock nutrition for now as we didn't create a 'meals' table yet.
  const nutrition = MOCK_NUTRITION;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Gym Stats
        const { data: gymData, error: gymError } = await supabase
          .from('gym_stats')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (gymData) setGymStats(gymData);

        // Fetch Habits
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id);

        if (habitsData) setHabits(habitsData);

        // Fetch ALL Transactions (para calcular saldo real)
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (transactionsData) setTransactions(transactionsData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Cálculos financeiros reais (sincronizado com Finance page)
  const totalBalance = transactions.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  const recentTransactions = transactions.slice(0, 5);

  const calProgress = gymStats.targetCalories > 0 ? (gymStats.caloriesConsumed / gymStats.targetCalories) * 100 : 0;
  const caloriesRemaining = gymStats.targetCalories - gymStats.caloriesConsumed;

  const macroData = [
    { name: 'Proteína', value: nutrition.protein, color: '#c1ff72' },
    { name: 'Carbo', value: nutrition.carbs, color: '#8fb0bc' },
    { name: 'Gordura', value: nutrition.fat, color: '#d8b4a6' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Métricas de Topo (Bento Grid) */}
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
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Habit Streak</p>
          <h4 className="text-2xl font-bold mt-2">{habits.filter(h => h.completedToday).length} / {habits.length}</h4>
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
        {/* 2. Centro: Calorie Tracker (Destaque principal solicitado) */}
        <div className="lg:col-span-8">
          <Card className="p-8 h-full bg-gradient-to-br from-[#161616] to-[#0c0c0c] border-white/5">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold">Consumo Calórico Diário</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">Status em tempo real</p>
              </div>
              <ButtonCircle icon={<Plus size={18} />} />
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
                      style={{ width: `${calProgress}%` }}
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
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {macroData.map((entry, index) => (
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

        {/* 3. Lateral: Hábitos & Streaks */}
        <div className="lg:col-span-4">
          <Card className="p-8 h-full">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold">Foco Hoje</h3>
              <MoreHorizontal size={20} className="text-white/20" />
            </div>
            <div className="space-y-5">
              {habits.length === 0 ? <p className="text-white/40 text-sm">Nenhum hábito cadastrado.</p> : habits.map(habit => (
                <div key={habit.id} className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 group hover:border-[#c1ff72]/30 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${habit.completedToday ? 'bg-[#c1ff72] text-black' : 'bg-white/5 text-white/40'}`}>
                        <Zap size={14} />
                      </div>
                      <span className="text-sm font-bold">{habit.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/20 uppercase">{habit.streak}d</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#c1ff72]/50" style={{ width: `${habit.progress}%` }} />
                  </div>
                </div>
              ))}

              <div className="p-5 rounded-[24px] bg-[#c1ff72]/10 border border-[#c1ff72]/20 mt-4 relative overflow-hidden group">
                <Dumbbell size={60} className="absolute -right-4 -bottom-4 text-[#c1ff72]/10 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-bold text-[#c1ff72] uppercase tracking-[0.2em] mb-1">Próximo Treino</p>
                <h4 className="text-lg font-bold">Peito e Tríceps</h4>
                <p className="text-[10px] text-white/40 font-bold uppercase mt-1">Hoje • 18:30</p>
                <button className="mt-4 text-xs font-bold text-[#c1ff72] flex items-center gap-2 hover:gap-3 transition-all">
                  Ver detalhes <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 4. Transações Recentes (Financeiro) */}
        <div className="lg:col-span-8">
          <Card className="p-8">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold">Fluxo Financeiro</h3>
              <button className="bg-white/5 border border-white/10 px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-white/10 transition-colors">
                Exportar <Download size={14} />
              </button>
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
                        {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* 5. Evolução de Peso (Gráfico de área para variar o visual) */}
        <div className="lg:col-span-4">
          <Card className="p-8 h-full bg-[#161616]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-medium text-white/60">Evolução Peso</h3>
              <Scale size={18} className="text-white/20" />
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={WEIGHT_HISTORY}>
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
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Último Registro</p>
                  <p className="text-2xl font-bold">{gymStats.weight} kg</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[#c1ff72] uppercase tracking-[0.2em]">Tendência</p>
                  <div className="flex items-center gap-1 text-sm font-bold text-[#c1ff72]">
                    <TrendingUp size={14} className="rotate-180" /> -0.8%
                  </div>
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
