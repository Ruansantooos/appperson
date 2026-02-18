import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Timer, Dumbbell, Check, Trophy } from 'lucide-react';
import { Workout, WorkoutSession, WorkoutExerciseLog } from '../../types';

const STORAGE_KEY = 'corelys_active_workout';

export interface PersistedWorkoutState {
  workout: Workout;
  startedAt: string;
  exercises: WorkoutExerciseLog[];
}

interface ActiveWorkoutProps {
  workout: Workout;
  onFinish: (session: WorkoutSession) => void;
  onCancel: () => void;
}

function loadPersistedState(): PersistedWorkoutState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistState(state: PersistedWorkoutState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearPersistedWorkout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getPersistedWorkout(): PersistedWorkoutState | null {
  return loadPersistedState();
}

const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({ workout, onFinish, onCancel }) => {
  // Restore or initialize
  const persisted = loadPersistedState();
  const isResuming = persisted && persisted.workout.id === workout.id;

  const startedAtRef = useRef(isResuming ? persisted!.startedAt : new Date().toISOString());

  const [exercises, setExercises] = useState<WorkoutExerciseLog[]>(() => {
    if (isResuming) return persisted!.exercises;
    return (workout.exercises || []).map(ex => ({
      exerciseId: ex.id,
      name: ex.name,
      targetSets: ex.sets,
      targetReps: ex.reps,
      weight: ex.weight,
      completed: false,
    }));
  });

  const calcElapsed = useCallback(() => {
    return Math.floor((Date.now() - new Date(startedAtRef.current).getTime()) / 1000);
  }, []);

  const [seconds, setSeconds] = useState(calcElapsed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist on first mount (new session)
  useEffect(() => {
    if (!isResuming) {
      persistState({ workout, startedAt: startedAtRef.current, exercises });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer: recalculates from startedAt every second (survives remount)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(calcElapsed());
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [calcElapsed]);

  // Persist exercises whenever they change
  useEffect(() => {
    persistState({ workout, startedAt: startedAtRef.current, exercises });
  }, [exercises, workout]);

  const toggleExercise = (index: number) => {
    setExercises(prev =>
      prev.map((ex, i) => (i === index ? { ...ex, completed: !ex.completed } : ex))
    );
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const completedCount = exercises.filter(e => e.completed).length;

  const handleFinish = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const finalSeconds = calcElapsed();
    const session: WorkoutSession = {
      workoutId: workout.id,
      workoutName: workout.name,
      muscleGroup: workout.muscleGroup,
      startedAt: startedAtRef.current,
      finishedAt: new Date().toISOString(),
      durationSeconds: finalSeconds,
      exercises,
    };
    clearPersistedWorkout();
    onFinish(session);
  };

  const handleBack = () => {
    if (window.confirm('Tem certeza que deseja cancelar o treino? O progresso será perdido.')) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearPersistedWorkout();
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold text-[#c1ff72] uppercase tracking-[0.2em]">
            {workout.muscleGroup || workout.name}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center py-8">
        <div className="w-14 h-14 rounded-full bg-[#c1ff72]/10 flex items-center justify-center mb-4">
          <Timer size={24} className="text-[#c1ff72]" />
        </div>
        <p className="text-5xl font-mono font-bold text-[#c1ff72] tracking-widest">
          {formatTime(seconds)}
        </p>
        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mt-2">
          Tempo de treino
        </p>
      </div>

      {/* Progress */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Progresso</p>
          <p className="text-xs font-bold text-[#c1ff72]">
            {completedCount}/{exercises.length} exercícios
          </p>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#c1ff72] rounded-full transition-all duration-500"
            style={{ width: exercises.length > 0 ? `${(completedCount / exercises.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 px-6 space-y-3 pb-32">
        {exercises.map((ex, idx) => (
          <button
            key={ex.exerciseId || idx}
            onClick={() => toggleExercise(idx)}
            className={`w-full flex items-center gap-4 p-4 rounded-[20px] border transition-all text-left ${
              ex.completed
                ? 'bg-[#c1ff72]/10 border-[#c1ff72]/30'
                : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                ex.completed
                  ? 'bg-[#c1ff72] text-black'
                  : 'bg-white/5 text-white/30'
              }`}
            >
              {ex.completed ? <Check size={20} /> : <Dumbbell size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-sm transition-all ${ex.completed ? 'text-[#c1ff72]' : 'text-white'}`}>
                {ex.name}
              </h4>
              <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest">
                {ex.targetSets} séries × {ex.targetReps} reps {ex.weight ? `• ${ex.weight}kg` : ''}
              </p>
            </div>
            {ex.completed && (
              <Trophy size={16} className="text-[#c1ff72] opacity-60 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
        <button
          onClick={handleFinish}
          className="w-full py-4 rounded-2xl bg-[#c1ff72] text-black font-bold text-sm uppercase tracking-[0.2em] hover:bg-[#b0e666] transition-all active:scale-[0.98]"
        >
          Finalizar Treino
        </button>
      </div>
    </div>
  );
};

export default ActiveWorkout;
