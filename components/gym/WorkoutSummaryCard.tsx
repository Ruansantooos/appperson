import React, { useMemo } from 'react';
import { Zap, X } from 'lucide-react';
import { WorkoutSession } from '../../types';

interface WorkoutSummaryCardProps {
  session: WorkoutSession;
  onClose: () => void;
}

const MOTIVATIONAL_QUOTES = [
  "Discipline equals freedom.",
  "The pain you feel today is the strength you feel tomorrow.",
  "No shortcuts. Just hard work.",
  "Your only limit is you.",
  "Prove them wrong.",
  "Results happen over time, not overnight.",
  "Be stronger than your excuses.",
  "The body achieves what the mind believes.",
];

const WorkoutSummaryCard: React.FC<WorkoutSummaryCardProps> = ({ session, onClose }) => {
  const quote = useMemo(
    () => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
    []
  );

  const completedExercises = session.exercises.filter(e => e.completed);

  const totalSets = completedExercises.reduce((sum, e) => {
    const sets = parseInt(e.targetSets) || 0;
    return sum + sets;
  }, 0);

  const totalVolume = completedExercises.reduce((sum, e) => {
    const sets = parseInt(e.targetSets) || 0;
    const reps = parseInt(e.targetReps) || 0;
    const weight = parseFloat(e.weight) || 0;
    return sum + sets * reps * weight;
  }, 0);

  const calories = Math.round((session.durationSeconds / 60) * 7);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000) return (vol / 1000).toFixed(vol >= 10000 ? 1 : 3).replace(/\.?0+$/, '');
    return String(vol);
  };

  const stats = [
    { value: completedExercises.length, label: 'exercíc.' },
    { value: totalSets, label: 'séries' },
    { value: totalVolume >= 1000 ? formatVolume(totalVolume) : totalVolume, label: totalVolume >= 1000 ? 'kg vol (mil)' : 'kg vol' },
    { value: calories, label: 'kcal' },
  ];

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-[#c1ff72]/10 rounded-[28px] p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
            C O R E L Y S
          </p>
          <Zap size={16} className="text-[#c1ff72]" />
        </div>

        {/* Workout Info */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold uppercase tracking-widest text-white">
            {session.muscleGroup || session.workoutName}
          </h2>
          <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mt-1">
            {formatDate(session.finishedAt)}
          </p>
        </div>

        {/* Time */}
        <div className="text-center mb-8">
          <p className="text-4xl font-mono font-bold text-[#c1ff72] tracking-widest">
            {formatTime(session.durationSeconds)}
          </p>
          <p className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em] mt-2">
            tempo de treino
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/5 rounded-2xl p-4 text-center"
            >
              <p className="text-2xl font-bold text-[#c1ff72]">{stat.value}</p>
              <p className="text-[9px] uppercase tracking-[0.2em] opacity-40 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="border-t border-white/[0.06] pt-6 mb-8">
          <p className="text-xs text-center italic opacity-30 leading-relaxed">
            "{quote}"
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl border border-white/10 text-xs font-bold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 hover:border-[#c1ff72] hover:text-[#c1ff72] transition-all"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default WorkoutSummaryCard;
