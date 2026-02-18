
import React, { useState, useEffect } from 'react';
import { Card, Badge, ButtonCircle, Button } from '../components/ui/LayoutComponents';
import {
  Dumbbell,
  Scale,
  Utensils,
  Flame,
  Activity,
  Plus,
  ChevronRight,
  X,
  Loader2,
  Trash2,
  Star,
  Bookmark,
  Play
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Supplement, Workout, GymStats, Meal, SavedFood, WorkoutSession } from '../types';
import ActiveWorkout from '../components/gym/ActiveWorkout';
import WorkoutSummaryCard from '../components/gym/WorkoutSummaryCard';

const DEFAULT_GYM_STATS: GymStats = {
  weight: 0,
  targetWeight: 0,
  bodyFat: 0,
  muscleMass: 0,
  caloriesConsumed: 0,
  targetCalories: 2000,
  protein: 0,
  carbs: 0,
  fat: 0
};

const DAYS_OF_WEEK = [
  { short: 'Seg', full: 'Segunda' },
  { short: 'Ter', full: 'Terça' },
  { short: 'Qua', full: 'Quarta' },
  { short: 'Qui', full: 'Quinta' },
  { short: 'Sex', full: 'Sexta' },
  { short: 'Sáb', full: 'Sábado' },
  { short: 'Dom', full: 'Domingo' },
];

const getTodayDayName = () => {
  const map: Record<number, string> = { 0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado' };
  return map[new Date().getDay()];
};

const GymPage: React.FC = () => {
  const { user } = useAuth();
  const [gymStats, setGymStats] = useState<GymStats>(DEFAULT_GYM_STATS);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedDay, setSelectedDay] = useState(getTodayDayName());
  const [loading, setLoading] = useState(true);

  // Modals State
  const [isSupplementModalOpen, setIsSupplementModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Forms State
  const [newSupplement, setNewSupplement] = useState({
    name: '',
    dosage: '',
    frequency: 'Daily',
    currentStock: '30'
  });

  const [newWorkout, setNewWorkout] = useState({
    name: '',
    dayOfWeek: 'Segunda',
    muscleGroup: '',
    exercises: [] as { name: string; sets: string; reps: string; weight: string }[]
  });
  const [tempExercise, setTempExercise] = useState({ name: '', sets: '3', reps: '10-12', weight: '' });

  // Meals State
  const [meals, setMeals] = useState<Meal[]>([]);
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>([]);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [saveAsFood, setSaveAsFood] = useState(false);

  // Active Workout State
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchGymStats(), fetchSupplements(), fetchWorkouts(), fetchMeals(), fetchSavedFoods()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGymStats = async () => {
    const { data } = await supabase
      .from('gym_stats')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    if (data) {
      setGymStats({
        weight: data.weight || 0,
        targetWeight: data.target_weight || 0,
        bodyFat: data.body_fat || 0,
        muscleMass: data.muscle_mass || 0,
        caloriesConsumed: data.calories_consumed || 0,
        targetCalories: data.target_calories || 2000,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0
      });
    }
  };

  const fetchSupplements = async () => {
    const { data } = await supabase.from('supplements').select('*').eq('user_id', user!.id);
    if (data) setSupplements(data.map((s: any) => ({ ...s, currentStock: s.current_stock, userId: s.user_id })));
  };

  const fetchWorkouts = async () => {
    const { data } = await supabase.from('workouts').select('*, workout_exercises(*)').eq('user_id', user!.id);
    if (data) {
      const mappedWorkouts = data.map((w: any) => ({
        ...w,
        dayOfWeek: w.day_of_week,
        muscleGroup: w.muscle_group,
        userId: w.user_id,
        exercises: w.workout_exercises?.map((e: any) => ({
          ...e,
          workoutId: e.workout_id,
          orderIndex: e.order_index
        })).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
      }));
      setWorkouts(mappedWorkouts);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const fetchMeals = async () => {
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user!.id)
      .eq('date', today)
      .order('created_at', { ascending: true });
    if (data) setMeals(data);
  };

  const fetchSavedFoods = async () => {
    const { data } = await supabase
      .from('saved_foods')
      .select('*')
      .eq('user_id', user!.id)
      .order('name', { ascending: true });
    if (data) setSavedFoods(data);
  };

  const recalculateDailyTotals = async (currentMeals: Meal[]) => {
    const totals = currentMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    await supabase
      .from('gym_stats')
      .update({
        calories_consumed: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
      })
      .eq('user_id', user!.id);

    setGymStats(prev => ({
      ...prev,
      caloriesConsumed: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
    }));
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const mealData = {
        user_id: user!.id,
        name: newMeal.name,
        calories: parseFloat(newMeal.calories) || 0,
        protein: parseFloat(newMeal.protein) || 0,
        carbs: parseFloat(newMeal.carbs) || 0,
        fat: parseFloat(newMeal.fat) || 0,
        date: today,
      };

      const { data, error } = await supabase.from('meals').insert([mealData]).select().single();
      if (error) throw error;

      if (saveAsFood) {
        await supabase.from('saved_foods').insert([{
          user_id: user!.id,
          name: newMeal.name,
          calories: parseFloat(newMeal.calories) || 0,
          protein: parseFloat(newMeal.protein) || 0,
          carbs: parseFloat(newMeal.carbs) || 0,
          fat: parseFloat(newMeal.fat) || 0,
        }]);
        fetchSavedFoods();
      }

      const updatedMeals = [...meals, data];
      setMeals(updatedMeals);
      await recalculateDailyTotals(updatedMeals);

      setIsMealModalOpen(false);
      setNewMeal({ name: '', calories: '', protein: '', carbs: '', fat: '' });
      setSaveAsFood(false);
    } catch (e) {
      alert('Erro ao adicionar refeição.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    const { error } = await supabase.from('meals').delete().eq('id', mealId);
    if (error) return;
    const updatedMeals = meals.filter(m => m.id !== mealId);
    setMeals(updatedMeals);
    await recalculateDailyTotals(updatedMeals);
  };

  const handleSelectSavedFood = (food: SavedFood) => {
    setNewMeal({
      name: food.name,
      calories: String(food.calories),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fat: String(food.fat),
    });
  };

  const handleDeleteSavedFood = async (foodId: string) => {
    await supabase.from('saved_foods').delete().eq('id', foodId);
    setSavedFoods(prev => prev.filter(f => f.id !== foodId));
  };

  const handleAddSupplement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('supplements').insert([{
        user_id: user!.id,
        name: newSupplement.name,
        dosage: newSupplement.dosage,
        frequency: newSupplement.frequency,
        current_stock: parseInt(newSupplement.currentStock) || 0
      }]);
      if (error) throw error;
      setIsSupplementModalOpen(false);
      setNewSupplement({ name: '', dosage: '', frequency: 'Daily', currentStock: '30' });
      fetchSupplements();
    } catch (e) {
      alert('Erro ao salvar suplemento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExerciseToWorkout = () => {
    if (!tempExercise.name) return;
    setNewWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, tempExercise]
    }));
    setTempExercise({ name: '', sets: '3', reps: '10-12', weight: '' });
  };

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: workoutData, error: workoutError } = await supabase.from('workouts').insert([{
        user_id: user!.id,
        name: newWorkout.name,
        day_of_week: newWorkout.dayOfWeek,
        muscle_group: newWorkout.muscleGroup
      }]).select().single();

      if (workoutError) throw workoutError;

      if (newWorkout.exercises.length > 0) {
        const exercisesToInsert = newWorkout.exercises.map((ex, idx) => ({
          workout_id: workoutData.id,
          user_id: user!.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          order_index: idx
        }));

        const { error: exercisesError } = await supabase.from('workout_exercises').insert(exercisesToInsert);
        if (exercisesError) throw exercisesError;
      }

      setIsWorkoutModalOpen(false);
      setNewWorkout({ name: '', dayOfWeek: 'Segunda', muscleGroup: '', exercises: [] });
      fetchWorkouts();
    } catch (e) {
      alert('Erro ao criar treino.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm('Deletar este treino e todos os exercícios?')) return;
    await supabase.from('workout_exercises').delete().eq('workout_id', workoutId);
    await supabase.from('workouts').delete().eq('id', workoutId);
    fetchWorkouts();
  };

  const handleDeleteSupplement = async (suppId: string) => {
    if (!confirm('Deletar este suplemento?')) return;
    await supabase.from('supplements').delete().eq('id', suppId);
    fetchSupplements();
  };

  // Get workout for selected day
  const selectedWorkout = workouts.find(w => w.dayOfWeek === selectedDay) || null;
  const todayName = getTodayDayName();

  const calProgress = gymStats.targetCalories > 0 ? (gymStats.caloriesConsumed / gymStats.targetCalories) * 100 : 0;
  const caloriesRemaining = gymStats.targetCalories - gymStats.caloriesConsumed;

  // Use real macro data from gym_stats
  const macroData = [
    { name: 'Proteína', value: gymStats.protein, color: '#c1ff72' },
    { name: 'Carbo', value: gymStats.carbs, color: '#8fb0bc' },
    { name: 'Gordura', value: gymStats.fat, color: '#d8b4a6' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#c1ff72]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Top Cards: Core Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card variant="dark" className="p-6 relative border-[#c1ff72]/20">
          <div className="absolute top-4 right-4 bg-[#c1ff72]/10 p-1.5 rounded-full text-[#c1ff72]">
            <Scale size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">Peso Atual</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-2xl font-bold">{gymStats.weight} kg</h4>
          </div>
        </Card>
        <Card variant="peach" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
            <Activity size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Meta</p>
          <h4 className="text-2xl font-bold mt-2">{gymStats.targetWeight} kg</h4>
        </Card>
        <Card variant="blue" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
            <Activity size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">% Gordura</p>
          <h4 className="text-2xl font-bold mt-2">{gymStats.bodyFat}%</h4>
        </Card>
        <Card variant="orange" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full opacity-60">
            <Utensils size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Consumido</p>
          <h4 className="text-2xl font-bold mt-2">{gymStats.caloriesConsumed} kcal</h4>
        </Card>
        <Card className="p-6 relative bg-[var(--input-bg)] border-[var(--card-border)] group">
          <div className="absolute top-4 right-4 bg-[#c1ff72] p-1.5 rounded-full text-black">
            <Flame size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">Restante</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h4 className="text-2xl font-bold text-[#c1ff72]">{caloriesRemaining}</h4>
            <span className="text-[10px] font-bold opacity-40">kcal</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nutrition Section */}
        <div className="lg:col-span-5">
          <Card className="p-8 h-full">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold">Resumo Nutricional</h3>
            </div>

            <div className="bg-[var(--foreground)]/[0.03] p-6 rounded-[24px] border border-[var(--card-border)] mb-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Meta de Calorias</p>
                  <h4 className="text-3xl font-bold mt-1">{gymStats.caloriesConsumed} <span className="text-lg font-medium opacity-20">/ {gymStats.targetCalories} kcal</span></h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[#c1ff72] uppercase tracking-[0.2em]">{Math.round(calProgress)}%</p>
                </div>
              </div>
              <div className="w-full h-3 bg-[var(--foreground)]/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c1ff72] rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(calProgress, 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.1em] mt-4 text-center">
                Faltam <span className="text-[var(--foreground)]">{caloriesRemaining} kcal</span> para atingir sua meta diária
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 items-center">
              <div className="h-[160px] relative">
                {macroData.some(m => m.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full opacity-10">
                    <Utensils size={48} />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {macroData.map(item => (
                  <div key={item.name} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{item.name}</span>
                    </div>
                    <span className="text-base font-bold">{item.value}g</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Meals Section */}
        <div className="lg:col-span-7">
          <Card className="p-8 h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold">Refeições do Dia</h3>
                <p className="text-[10px] opacity-30 uppercase tracking-[0.2em] mt-1">
                  {meals.length} {meals.length === 1 ? 'refeição registrada' : 'refeições registradas'}
                </p>
              </div>
              <button
                onClick={() => setIsMealModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c1ff72] text-black text-xs font-bold hover:bg-[#b0e666] transition-colors"
              >
                <Plus size={14} /> Refeição
              </button>
            </div>

            {meals.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {meals.map(meal => (
                  <div key={meal.id} className="flex items-center justify-between p-4 rounded-[20px] bg-[var(--input-bg)] border border-[var(--card-border)] hover:opacity-80 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center opacity-30 group-hover:text-[#c1ff72] group-hover:opacity-100 transition-all">
                        <Utensils size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{meal.name}</h4>
                        <p className="text-[9px] opacity-20 font-bold uppercase tracking-widest">
                          P {meal.protein}g • C {meal.carbs}g • G {meal.fat}g
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-base font-bold text-[#c1ff72]">{meal.calories}</p>
                        <p className="text-[9px] font-bold opacity-20 uppercase tracking-widest">kcal</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-500 transition-all p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Totals row */}
                <div className="flex items-center justify-between p-4 rounded-[20px] border border-[#c1ff72]/20 bg-[#c1ff72]/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#c1ff72]/10 flex items-center justify-center text-[#c1ff72]">
                      <Flame size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#c1ff72]">Total</h4>
                      <p className="text-[9px] opacity-40 font-bold uppercase tracking-widest">
                        P {gymStats.protein}g • C {gymStats.carbs}g • G {gymStats.fat}g
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#c1ff72]">{gymStats.caloriesConsumed}</p>
                    <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest">kcal</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center opacity-20">
                <Utensils size={48} className="mb-4 opacity-30" />
                <p className="text-sm font-bold mb-1">Nenhuma refeição registrada hoje</p>
                <p className="text-xs opacity-50 mb-4">Adicione suas refeições para acompanhar os macros</p>
                <button
                  onClick={() => setIsMealModalOpen(true)}
                  className="px-6 py-2 rounded-xl border border-dashed border-[var(--card-border)] text-xs font-bold hover:text-[#c1ff72] hover:border-[#c1ff72] transition-all"
                >
                  + Adicionar primeira refeição
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Training Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <Card className="p-8 h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold">Plano Semanal</h3>
                <p className="text-[10px] opacity-30 uppercase tracking-[0.2em] mt-1">Monte seu treino por dia da semana</p>
              </div>
              <button
                onClick={() => setIsWorkoutModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c1ff72] text-black text-xs font-bold hover:bg-[#b0e666] transition-colors"
              >
                <Plus size={14} /> Novo Treino
              </button>
            </div>

            {/* Day tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {DAYS_OF_WEEK.map(day => {
                const hasWorkout = workouts.some(w => w.dayOfWeek === day.full);
                const isToday = day.full === todayName;
                const isSelected = day.full === selectedDay;
                return (
                  <button
                    key={day.full}
                    onClick={() => setSelectedDay(day.full)}
                    className={`flex flex-col items-center px-4 py-3 rounded-2xl text-xs font-bold uppercase transition-all shrink-0 border border-[var(--card-border)] ${isSelected
                      ? 'bg-[#c1ff72] text-black shadow-[0_0_15px_rgba(193,255,114,0.2)] border-transparent'
                      : hasWorkout
                        ? 'bg-[var(--input-bg)] text-[var(--foreground)] hover:opacity-80'
                        : 'bg-transparent text-[var(--foreground)] opacity-30 hover:opacity-60'
                      }`}
                  >
                    <span className="tracking-widest">{day.short}</span>
                    {isToday && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-black' : 'bg-[#c1ff72]'}`} />
                    )}
                    {!isToday && hasWorkout && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-black/30' : 'opacity-40 bg-[var(--foreground)]'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Workout for selected day */}
            {selectedWorkout ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold">{selectedWorkout.name}</h4>
                    {selectedWorkout.muscleGroup && (
                      <p className="text-[10px] text-[#c1ff72] font-bold uppercase tracking-[0.2em]">{selectedWorkout.muscleGroup}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteWorkout(selectedWorkout.id)}
                    className="opacity-20 hover:text-red-500 hover:opacity-100 transition-all p-2"
                    title="Deletar treino"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Iniciar Treino Button */}
                {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 && (
                  <button
                    onClick={() => setActiveWorkout(selectedWorkout)}
                    className="w-full flex items-center justify-center gap-3 py-4 mb-4 rounded-2xl bg-[#c1ff72] text-black font-bold text-sm uppercase tracking-[0.15em] hover:bg-[#b0e666] transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(193,255,114,0.15)]"
                  >
                    <Play size={18} fill="black" />
                    Iniciar Treino
                  </button>
                )}

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {selectedWorkout.exercises?.map((ex, idx) => (
                    <div key={ex.id || idx} className="flex items-center justify-between p-4 rounded-[20px] bg-[var(--input-bg)] border border-[var(--card-border)] hover:opacity-80 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--background)] flex items-center justify-center opacity-30 group-hover:text-[#c1ff72] group-hover:opacity-100 transition-all">
                          <Dumbbell size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{ex.name}</h4>
                          <p className="text-[9px] opacity-20 font-bold uppercase tracking-widest">{ex.sets} séries {ex.weight ? `• ${ex.weight}kg` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold opacity-20 uppercase tracking-widest">Reps</p>
                        <p className="text-base font-bold text-[#c1ff72]">{ex.reps}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedWorkout.exercises || selectedWorkout.exercises.length === 0) && (
                    <p className="text-sm opacity-20 text-center py-4">Nenhum exercício neste treino.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center opacity-20">
                <Dumbbell size={48} className="mb-4 opacity-30" />
                <p className="text-sm font-bold mb-1">Nenhum treino para {selectedDay}</p>
                <p className="text-xs opacity-50 mb-4">Clique em "Novo Treino" para criar</p>
                <button
                  onClick={() => {
                    setNewWorkout(prev => ({ ...prev, dayOfWeek: selectedDay }));
                    setIsWorkoutModalOpen(true);
                  }}
                  className="px-6 py-2 rounded-xl border border-dashed border-[var(--card-border)] text-xs font-bold hover:text-[#c1ff72] hover:border-[#c1ff72] transition-all"
                >
                  + Criar treino para {selectedDay}
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Supplements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <Card variant="blue" className="p-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Suplementos</h3>
              <button
                onClick={() => setIsSupplementModalOpen(true)}
                className="w-8 h-8 rounded-full border border-[var(--card-border)] flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-[var(--foreground)]/5"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {supplements.length === 0 ? <p className="opacity-20 text-xs italic col-span-full">Nenhum suplemento adicionado.</p> : supplements.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-black/10 p-4 rounded-2xl border border-white/5 group">
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{item.dosage} {item.frequency ? `• ${item.frequency}` : ''}</p>
                    {item.currentStock > 0 && (
                      <p className="text-[10px] opacity-20 mt-1">{item.currentStock} doses restantes</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteSupplement(item.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-20 hover:text-red-500 hover:opacity-100 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Supplement Modal */}
      {isSupplementModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-6 border-[#c1ff72]/20 relative">
            <button
              onClick={() => setIsSupplementModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">Novo Suplemento</h3>
            <form onSubmit={handleAddSupplement} className="space-y-4">
              <div>
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Nome</label>
                <input
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff72] outline-none"
                  value={newSupplement.name}
                  onChange={e => setNewSupplement({ ...newSupplement, name: e.target.value })}
                  required
                  placeholder="Ex: Creatina"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Dose</label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all placeholder:opacity-20"
                    value={newSupplement.dosage}
                    onChange={e => setNewSupplement({ ...newSupplement, dosage: e.target.value })}
                    placeholder="Ex: 5g"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Estoque</label>
                  <input
                    type="number"
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none"
                    value={newSupplement.currentStock}
                    onChange={e => setNewSupplement({ ...newSupplement, currentStock: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-[#c1ff72] text-black font-bold py-3 rounded-xl hover:bg-[#b0e666] transition-colors">
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar Suplemento'}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Workout Modal */}
      {isWorkoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 border-[#c1ff72]/20 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsWorkoutModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">Criar Novo Treino</h3>
            <form onSubmit={handleCreateWorkout} className="space-y-6">
              {/* Day of Week Selector */}
              <div>
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-2">Dia da Semana</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS_OF_WEEK.map(day => {
                    const taken = workouts.some(w => w.dayOfWeek === day.full);
                    const isSelected = newWorkout.dayOfWeek === day.full;
                    return (
                      <button
                        key={day.full}
                        type="button"
                        onClick={() => setNewWorkout({ ...newWorkout, dayOfWeek: day.full })}
                        disabled={taken && !isSelected}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isSelected
                          ? 'bg-[#c1ff72] text-black'
                          : taken
                            ? 'bg-[var(--foreground)]/5 opacity-15 cursor-not-allowed'
                            : 'bg-[var(--foreground)]/5 opacity-50 hover:bg-[var(--foreground)]/10'
                          }`}
                      >
                        {day.short}
                        {taken && !isSelected && <span className="block text-[8px] mt-0.5 opacity-50">Ocupado</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-1">Nome do Treino</label>
                  <input
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff72] outline-none"
                    value={newWorkout.name}
                    onChange={e => setNewWorkout({ ...newWorkout, name: e.target.value })}
                    required
                    placeholder="Ex: Treino A - Peito"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Grupo Muscular</label>
                  <input
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff72] outline-none"
                    value={newWorkout.muscleGroup}
                    onChange={e => setNewWorkout({ ...newWorkout, muscleGroup: e.target.value })}
                    placeholder="Ex: Peito e Tríceps"
                  />
                </div>
              </div>

              {/* Exercise Builder */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Dumbbell size={16} /> Adicionar Exercícios</h4>
                <div className="grid grid-cols-12 gap-2 mb-4">
                  <div className="col-span-5">
                    <input
                      className="w-full bg-[#0c0c0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c1ff72] outline-none"
                      placeholder="Nome do exercício"
                      value={tempExercise.name}
                      onChange={e => setTempExercise({ ...tempExercise, name: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      className="w-full bg-[#0c0c0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c1ff72] outline-none"
                      placeholder="Séries"
                      value={tempExercise.sets}
                      onChange={e => setTempExercise({ ...tempExercise, sets: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      className="w-full bg-[#0c0c0c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#c1ff72] outline-none"
                      placeholder="Reps (ex: 8-12)"
                      value={tempExercise.reps}
                      onChange={e => setTempExercise({ ...tempExercise, reps: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={handleAddExerciseToWorkout}
                      disabled={!tempExercise.name}
                      className="w-full h-full bg-[#c1ff72]/20 text-[#c1ff72] font-bold rounded-lg border border-[#c1ff72]/50 hover:bg-[#c1ff72] hover:text-black transition-all flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {newWorkout.exercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                      <span className="text-sm font-bold text-white">{idx + 1}. {ex.name}</span>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>{ex.sets} x {ex.reps}</span>
                        <button
                          type="button"
                          onClick={() => setNewWorkout(prev => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== idx) }))}
                          className="opacity-20 hover:text-red-500 hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {newWorkout.exercises.length === 0 && <p className="text-xs opacity-20 text-center py-2">Nenhum exercício adicionado.</p>}
                </div>
              </div>

              <button type="submit" disabled={submitting || newWorkout.exercises.length === 0} className="w-full bg-[#c1ff72] text-black font-bold py-3 rounded-xl hover:bg-[#b0e666] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar Treino'}
              </button>
            </form>
          </Card>
        </div>
      )}
      {/* Active Workout Overlay */}
      {activeWorkout && (
        <ActiveWorkout
          workout={activeWorkout}
          onFinish={(session) => {
            setActiveWorkout(null);
            setCompletedSession(session);
          }}
          onCancel={() => setActiveWorkout(null)}
        />
      )}

      {/* Workout Summary Card */}
      {completedSession && (
        <WorkoutSummaryCard
          session={completedSession}
          onClose={() => setCompletedSession(null)}
        />
      )}

      {/* Meal Modal */}
      {isMealModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-[#c1ff72]/20 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => { setIsMealModalOpen(false); setNewMeal({ name: '', calories: '', protein: '', carbs: '', fat: '' }); setSaveAsFood(false); }}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">Nova Refeição</h3>

            {/* Saved Foods */}
            {savedFoods.length > 0 && (
              <div className="mb-6">
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-2">
                  <Bookmark size={12} className="inline mr-1" /> Alimentos Salvos
                </label>
                <div className="flex flex-wrap gap-2">
                  {savedFoods.map(food => (
                    <div key={food.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectSavedFood(food)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-xs font-bold hover:border-[#c1ff72] hover:text-[#c1ff72] transition-all"
                      >
                        {food.name}
                        <span className="ml-1 opacity-30">{food.calories}kcal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedFood(food.id)}
                        className="opacity-20 hover:opacity-100 hover:text-red-500 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Nome</label>
                <input
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all placeholder:opacity-20"
                  value={newMeal.name}
                  onChange={e => setNewMeal({ ...newMeal, name: e.target.value })}
                  required
                  placeholder="Ex: Frango com arroz"
                />
              </div>
              <div>
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Calorias (kcal)</label>
                <input
                  type="number"
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all placeholder:opacity-20"
                  value={newMeal.calories}
                  onChange={e => setNewMeal({ ...newMeal, calories: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Proteína (g)</label>
                  <input
                    type="number"
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all placeholder:opacity-20"
                    value={newMeal.protein}
                    onChange={e => setNewMeal({ ...newMeal, protein: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Carbo (g)</label>
                  <input
                    type="number"
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all placeholder:opacity-20"
                    value={newMeal.carbs}
                    onChange={e => setNewMeal({ ...newMeal, carbs: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Gordura (g)</label>
                  <input
                    type="number"
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all placeholder:opacity-20"
                    value={newMeal.fat}
                    onChange={e => setNewMeal({ ...newMeal, fat: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Save as favorite checkbox */}
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <div
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${saveAsFood ? 'bg-[#c1ff72] border-[#c1ff72]' : 'border-[var(--card-border)]'}`}
                  onClick={() => setSaveAsFood(!saveAsFood)}
                >
                  {saveAsFood && <Star size={12} className="text-black" />}
                </div>
                <span className="text-xs font-bold opacity-60" onClick={() => setSaveAsFood(!saveAsFood)}>Salvar como alimento favorito</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#c1ff72] text-black font-bold py-3 rounded-xl hover:bg-[#b0e666] transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Adicionar Refeição'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GymPage;
