
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
  Trash2
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Supplement, Workout, GymStats } from '../types';

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

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchGymStats(), fetchSupplements(), fetchWorkouts()]);
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
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full text-white/60">
            <Utensils size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Consumido</p>
          <h4 className="text-2xl font-bold mt-2">{gymStats.caloriesConsumed} kcal</h4>
        </Card>
        <Card className="p-6 relative bg-white/5 border-white/10 group">
          <div className="absolute top-4 right-4 bg-[#c1ff72] p-1.5 rounded-full text-black">
            <Flame size={14} />
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Restante</p>
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

            <div className="bg-white/[0.03] p-6 rounded-[24px] border border-white/5 mb-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Meta de Calorias</p>
                  <h4 className="text-3xl font-bold mt-1">{gymStats.caloriesConsumed} <span className="text-lg font-medium text-white/20">/ {gymStats.targetCalories} kcal</span></h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[#c1ff72] uppercase tracking-[0.2em]">{Math.round(calProgress)}%</p>
                </div>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c1ff72] rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(calProgress, 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mt-4 text-center">
                Faltam <span className="text-white">{caloriesRemaining} kcal</span> para atingir sua meta diária
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
                  <div className="flex items-center justify-center h-full text-white/10">
                    <Utensils size={48} />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {macroData.map(item => (
                  <div key={item.name} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{item.name}</span>
                    </div>
                    <span className="text-base font-bold">{item.value}g</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Training Section */}
        <div className="lg:col-span-7">
          <Card className="p-8 h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold">Plano Semanal</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">Monte seu treino por dia da semana</p>
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
                    className={`flex flex-col items-center px-4 py-3 rounded-2xl text-xs font-bold uppercase transition-all shrink-0 ${
                      isSelected
                        ? 'bg-[#c1ff72] text-black shadow-[0_0_15px_rgba(193,255,114,0.2)]'
                        : hasWorkout
                          ? 'bg-white/10 text-white hover:bg-white/15'
                          : 'bg-white/[0.02] text-white/30 hover:bg-white/5'
                    }`}
                  >
                    <span className="tracking-widest">{day.short}</span>
                    {isToday && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-black' : 'bg-[#c1ff72]'}`} />
                    )}
                    {!isToday && hasWorkout && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-black/30' : 'bg-white/20'}`} />
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
                    className="text-white/20 hover:text-red-500 transition-colors p-2"
                    title="Deletar treino"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {selectedWorkout.exercises?.map((ex, idx) => (
                    <div key={ex.id || idx} className="flex items-center justify-between p-4 rounded-[20px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-[#c1ff72] transition-colors">
                          <Dumbbell size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{ex.name}</h4>
                          <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{ex.sets} séries {ex.weight ? `• ${ex.weight}kg` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Reps</p>
                        <p className="text-base font-bold text-[#c1ff72]">{ex.reps}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedWorkout.exercises || selectedWorkout.exercises.length === 0) && (
                    <p className="text-sm text-white/20 text-center py-4">Nenhum exercício neste treino.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-white/20">
                <Dumbbell size={48} className="mb-4 opacity-30" />
                <p className="text-sm font-bold mb-1">Nenhum treino para {selectedDay}</p>
                <p className="text-xs text-white/15 mb-4">Clique em "Novo Treino" para criar</p>
                <button
                  onClick={() => {
                    setNewWorkout(prev => ({ ...prev, dayOfWeek: selectedDay }));
                    setIsWorkoutModalOpen(true);
                  }}
                  className="px-6 py-2 rounded-xl border border-dashed border-white/20 text-xs font-bold text-white/40 hover:text-[#c1ff72] hover:border-[#c1ff72] transition-all"
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
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {supplements.length === 0 ? <p className="text-white/20 text-xs italic col-span-full">Nenhum suplemento adicionado.</p> : supplements.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-black/10 p-4 rounded-2xl border border-white/5 group">
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{item.dosage} {item.frequency ? `• ${item.frequency}` : ''}</p>
                    {item.currentStock > 0 && (
                      <p className="text-[10px] text-white/20 mt-1">{item.currentStock} doses restantes</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteSupplement(item.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-white/20 hover:text-red-500 hover:bg-red-500/10"
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
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-1">Nome</label>
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
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-1">Dose</label>
                  <input
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff72] outline-none"
                    value={newSupplement.dosage}
                    onChange={e => setNewSupplement({ ...newSupplement, dosage: e.target.value })}
                    placeholder="Ex: 5g"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-1">Estoque</label>
                  <input
                    type="number"
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#c1ff72] outline-none"
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
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Dia da Semana</label>
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
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                          isSelected
                            ? 'bg-[#c1ff72] text-black'
                            : taken
                              ? 'bg-white/5 text-white/15 cursor-not-allowed'
                              : 'bg-white/5 text-white/50 hover:bg-white/10'
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
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-1">Grupo Muscular</label>
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
                          className="text-white/20 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {newWorkout.exercises.length === 0 && <p className="text-xs text-white/20 text-center py-2">Nenhum exercício adicionado.</p>}
                </div>
              </div>

              <button type="submit" disabled={submitting || newWorkout.exercises.length === 0} className="w-full bg-[#c1ff72] text-black font-bold py-3 rounded-xl hover:bg-[#b0e666] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Salvar Treino'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GymPage;
