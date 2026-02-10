
import React, { useState, useEffect } from 'react';
import { Card, Badge, ButtonCircle, Button } from '../components/ui/LayoutComponents';
import {
  Dumbbell,
  Scale,
  Utensils,
  Flame,
  MoreHorizontal,
  ArrowUpRight,
  ChevronRight,
  Activity,
  Plus
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { MOCK_GYM_STATS, MOCK_NUTRITION, WEIGHT_HISTORY } from '../lib/mock-data';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Supplement, Workout, WorkoutExercise } from '../types';
import { X, Loader2, Trash2 } from 'lucide-react';

const GymPage: React.FC = () => {
  const { user } = useAuth();
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

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
    fetchSupplements();
    fetchWorkouts();
  }, [user]);

  const fetchSupplements = async () => {
    const { data } = await supabase.from('supplements').select('*').eq('user_id', user.id);
    if (data) setSupplements(data.map((s: any) => ({ ...s, currentStock: s.current_stock, userId: s.user_id })));
  };

  const fetchWorkouts = async () => {
    const { data } = await supabase.from('workouts').select('*, workout_exercises(*)').eq('user_id', user.id);
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
      // Select the workout for the current day if exists, or just the first one
      const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
      // Simple mapping or just default to first
      if (mappedWorkouts.length > 0) setSelectedWorkout(mappedWorkouts[0]);
    }
  };

  const handleAddSupplement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('supplements').insert([{
        user_id: user.id,
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
      console.error(e);
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
      // 1. Create Workout
      const { data: workoutData, error: workoutError } = await supabase.from('workouts').insert([{
        user_id: user.id,
        name: newWorkout.name,
        day_of_week: newWorkout.dayOfWeek,
        muscle_group: newWorkout.muscleGroup
      }]).select().single();

      if (workoutError) throw workoutError;

      // 2. Create Exercises
      if (newWorkout.exercises.length > 0) {
        const exercisesToInsert = newWorkout.exercises.map((ex, idx) => ({
          workout_id: workoutData.id,
          user_id: user.id,
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
      console.error(e);
      alert('Erro ao criar treino');
    } finally {
      setSubmitting(false);
    }
  };


  const macroData = [
    { name: 'Proteína', value: MOCK_NUTRITION.protein, color: '#c1ff72' },
    { name: 'Carbo', value: MOCK_NUTRITION.carbs, color: '#8fb0bc' },
    { name: 'Gordura', value: MOCK_NUTRITION.fat, color: '#d8b4a6' },
  ];

  const totalMacros = MOCK_NUTRITION.protein + MOCK_NUTRITION.carbs + MOCK_NUTRITION.fat;
  const calProgress = (MOCK_GYM_STATS.caloriesConsumed / MOCK_GYM_STATS.targetCalories) * 100;
  const caloriesRemaining = MOCK_GYM_STATS.targetCalories - MOCK_GYM_STATS.caloriesConsumed;

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
            <h4 className="text-2xl font-bold">{MOCK_GYM_STATS.weight} kg</h4>
            <span className="text-[10px] text-red-400 font-bold">-0.6 kg</span>
          </div>
        </Card>
        <Card variant="peach" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
            <Activity size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Meta</p>
          <h4 className="text-2xl font-bold mt-2">{MOCK_GYM_STATS.targetWeight} kg</h4>
        </Card>
        <Card variant="blue" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
            <Activity size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">% Gordura</p>
          <h4 className="text-2xl font-bold mt-2">{MOCK_GYM_STATS.bodyFat}%</h4>
        </Card>
        <Card variant="orange" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full text-white/60">
            <Utensils size={14} />
          </div>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Consumido</p>
          <h4 className="text-2xl font-bold mt-2">{MOCK_GYM_STATS.caloriesConsumed} kcal</h4>
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
        {/* Nutrition Section with Calorie Tracker */}
        <div className="lg:col-span-5">
          <Card className="p-8 h-full">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold">Resumo Nutricional</h3>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-[#c1ff72] hover:text-black transition-all">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="bg-white/[0.03] p-6 rounded-[24px] border border-white/5 mb-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Meta de Calorias</p>
                  <h4 className="text-3xl font-bold mt-1">{MOCK_GYM_STATS.caloriesConsumed} <span className="text-lg font-medium text-white/20">/ {MOCK_GYM_STATS.targetCalories} kcal</span></h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[#c1ff72] uppercase tracking-[0.2em]">{Math.round(calProgress)}%</p>
                </div>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c1ff72] rounded-full transition-all duration-1000"
                  style={{ width: `${calProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mt-4 text-center">
                Faltam <span className="text-white">{caloriesRemaining} kcal</span> para atingir sua meta diária
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 items-center">
              <div className="h-[160px] relative">
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
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold">Treinos</h3>
                {selectedWorkout && (
                  <p className="text-[10px] text-[#c1ff72] font-bold uppercase tracking-[0.2em] mt-1">{selectedWorkout.muscleGroup}</p>
                )}
              </div>
              <div className="flex gap-2">
                {workouts.map(w => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWorkout(w)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${selectedWorkout?.id === w.id ? 'bg-[#c1ff72] text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    {w.name.substring(0, 3)}
                  </button>
                ))}
                <button
                  onClick={() => setIsWorkoutModalOpen(true)}
                  className="w-8 h-8 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-[#c1ff72] hover:border-[#c1ff72] transition-all ml-2"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {selectedWorkout ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {selectedWorkout.exercises?.map((ex, idx) => (
                  <div key={ex.id || idx} className="flex items-center justify-between p-4 rounded-[20px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 group-hover:text-[#c1ff72] transition-colors">
                        <Dumbbell size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{ex.name}</h4>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{ex.sets} séries • {ex.weight ? `${ex.weight}kg` : 'Peso livre'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Reps</p>
                        <p className="text-base font-bold text-[#c1ff72]">{ex.reps}</p>
                      </div>
                      <ChevronRight size={16} className="text-white/10" />
                    </div>
                  </div>
                ))}

                <Button className="w-full h-14 mt-8 bg-[#c1ff72] text-black shadow-[0_0_20px_rgba(193,255,114,0.2)]">INICIAR SESSÃO DE TREINO</Button>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-white/20">
                <Dumbbell size={48} className="mb-4 opacity-50" />
                <p>Nenhum treino selecionado ou criado.</p>
                <Button onClick={() => setIsWorkoutModalOpen(true)} className="mt-4" variant="outline">Criar Primeiro Treino</Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Progress Chart & Suplements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold">Evolução de Peso</h3>
              <div className="flex gap-2">
                <Badge variant="default">6 Meses</Badge>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={WEIGHT_HISTORY}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} dy={10} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161616', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ color: '#c1ff72' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#c1ff72" strokeWidth={3} dot={{ r: 4, fill: '#c1ff72', strokeWidth: 2, stroke: '#0c0c0c' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card variant="blue" className="p-8 h-full relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Suplementos</h3>
              <button
                onClick={() => setIsSupplementModalOpen(true)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-4 relative z-10 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
              {supplements.length === 0 ? <p className="text-white/20 text-xs italic">Nenhum suplemento adicionado.</p> : supplements.map((item, i) => (
                <div key={item.id} className="flex items-center justify-between bg-black/10 p-4 rounded-2xl border border-white/5 group">
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{item.dosage} • {item.frequency}</p>
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-[#c1ff72] text-black">
                    ✓
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>


      {/* Supplement Modal */}
      {
        isSupplementModalOpen && (
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
        )
      }

      {/* Workout Modal */}
      {
        isWorkoutModalOpen && (
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

                  {/* List of added exercises */}
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
        )
      }
    </div>
  );
};

export default GymPage;
