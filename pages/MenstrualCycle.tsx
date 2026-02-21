import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CycleLog, CycleSettings } from '../types';
import { X, Droplets, Save, ChevronLeft, ChevronRight, Activity, Calendar as CalendarIcon, Settings2, Info } from 'lucide-react';

// --- Constants ---
const SYMPTOMS = ['Cólica', 'Dor de cabeça', 'Inchaço', 'Sensibilidade', 'Acne', 'Fadiga', 'Insônia', 'Náusea'];
const MOODS = ['Feliz', 'Calma', 'Irritada', 'Ansiosa', 'Triste', 'Sensível'];
const FLOW_LABELS = ['Nenhum', 'Leve', 'Moderado', 'Intenso', 'Muito Intenso'];

type Phase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal' | 'none';

const PHASE_COLORS: Record<Phase, string> = {
  menstruation: '#ff5c5c', // Vermelho vibrante
  follicular: '#ff85b3',  // Rosa vibrante
  ovulation: '#c1ff72',   // Verde Brand (Corelys)
  luteal: '#d48dff',      // Roxo vibrante
  none: 'transparent',
};

const PHASE_LABELS: Record<Phase, string> = {
  menstruation: 'Menstruação',
  follicular: 'Fase Folicular',
  ovulation: 'Período Fértil',
  luteal: 'Fase Lútea',
  none: 'Nenhum',
};

// --- Helpers ---
function getPhase(dayOfCycle: number, cycleLength: number, periodLength: number): Phase {
  if (dayOfCycle < 1 || dayOfCycle > cycleLength) return 'none';
  if (dayOfCycle <= periodLength) return 'menstruation';
  const mid = Math.floor(cycleLength / 2);
  if (dayOfCycle <= mid - 2) return 'follicular';
  if (dayOfCycle <= mid + 1) return 'ovulation';
  return 'luteal';
}

function getDayOfCycle(date: Date, lastPeriodStart: Date, cycleLength: number): number {
  const diffMs = date.getTime() - lastPeriodStart.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const day = (diffDays % cycleLength) + 1;
  return day > 0 ? day : day + cycleLength;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// --- Component ---
const MenstrualCycle: React.FC = () => {
  const { user } = useAuth();

  // Settings
  const [settings, setSettings] = useState<CycleSettings | null>(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lastPeriodStart, setLastPeriodStart] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Logs
  const [logs, setLogs] = useState<CycleLog[]>([]);

  // Modal
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalFlow, setModalFlow] = useState(0);
  const [modalSymptoms, setModalSymptoms] = useState<string[]>([]);
  const [modalMood, setModalMood] = useState('');
  const [modalEnergy, setModalEnergy] = useState(3);
  const [modalNotes, setModalNotes] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  // Calendar navigation
  const [calendarOffset, setCalendarOffset] = useState(0);

  // --- Data Fetching ---
  useEffect(() => {
    if (!user) return;
    fetchSettings();
    fetchLogs();
  }, [user]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('cycle_settings')
      .select('*')
      .eq('user_id', user!.id)
      .single();
    if (data) {
      setSettings(data);
      setCycleLength(data.cycle_length);
      setPeriodLength(data.period_length);
      setLastPeriodStart(data.last_period_start || '');
    }
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(90);
    if (data) setLogs(data);
  };

  const saveSettings = async () => {
    if (!user) return;
    setSettingsSaving(true);
    const payload = {
      user_id: user.id,
      cycle_length: cycleLength,
      period_length: periodLength,
      last_period_start: lastPeriodStart || null,
      updated_at: new Date().toISOString(),
    };

    if (settings?.id) {
      await supabase.from('cycle_settings').update(payload).eq('id', settings.id);
    } else {
      await supabase.from('cycle_settings').insert(payload);
    }
    await fetchSettings();
    setSettingsSaving(false);
  };

  // --- Computed ---
  const today = new Date();
  const todayStr = formatDate(today);
  const hasSettings = !!lastPeriodStart;
  const lastPeriod = hasSettings ? parseLocalDate(lastPeriodStart) : null;

  const currentDayOfCycle = useMemo(() => {
    if (!lastPeriod) return null;
    return getDayOfCycle(today, lastPeriod, cycleLength);
  }, [lastPeriod, cycleLength, todayStr]);

  const currentPhase = useMemo(() => {
    if (currentDayOfCycle === null) return 'none' as Phase;
    return getPhase(currentDayOfCycle, cycleLength, periodLength);
  }, [currentDayOfCycle, cycleLength, periodLength]);

  const nextPeriodDate = useMemo(() => {
    if (!lastPeriod) return null;
    const dayInCycle = currentDayOfCycle!;
    const daysUntil = cycleLength - dayInCycle + 1;
    return addDays(today, daysUntil);
  }, [lastPeriod, currentDayOfCycle, cycleLength]);

  // Calendar Days (21 days window for a cleaner look)
  const calendarDays = useMemo(() => {
    const baseStart = addDays(today, calendarOffset * 21 - 7);
    const days: { date: Date; dateStr: string; phase: Phase; isToday: boolean }[] = [];
    for (let i = 0; i < 21; i++) {
      const d = addDays(baseStart, i);
      const dateStr = formatDate(d);
      let phase: Phase = 'none';
      if (lastPeriod) {
        const dayOfCycle = getDayOfCycle(d, lastPeriod, cycleLength);
        phase = getPhase(dayOfCycle, cycleLength, periodLength);
      }
      days.push({ date: d, dateStr, phase, isToday: dateStr === todayStr });
    }
    return days;
  }, [lastPeriod, cycleLength, periodLength, calendarOffset, todayStr]);

  const logsMap = useMemo(() => {
    const map: Record<string, CycleLog> = {};
    logs.forEach(l => { map[l.date] = l; });
    return map;
  }, [logs]);

  // --- Modal Functions ---
  const openLog = (dateStr: string) => {
    const existing = logsMap[dateStr];
    setModalDate(dateStr);
    setModalFlow(existing?.flow_intensity ?? 0);
    setModalSymptoms(existing?.symptoms ?? []);
    setModalMood(existing?.mood ?? '');
    setModalEnergy(existing?.energy ?? 3);
    setModalNotes(existing?.notes ?? '');
  };

  const toggleSymptom = (s: string) => {
    setModalSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const saveLog = async () => {
    if (!user || !modalDate) return;
    setModalSaving(true);
    const payload = {
      user_id: user.id,
      date: modalDate,
      flow_intensity: modalFlow,
      symptoms: modalSymptoms,
      mood: modalMood,
      energy: modalEnergy,
      notes: modalNotes,
    };

    await supabase.from('cycle_logs').upsert(payload, { onConflict: 'user_id,date' });
    await fetchLogs();
    setModalSaving(false);
    setModalDate(null);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section with Central Node */}
      <div className="relative flex flex-col items-center justify-center pt-8 pb-12 overflow-hidden">
        {/* Decorative Background Glows */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: PHASE_COLORS[currentPhase] === 'transparent' ? '#c1ff72' : PHASE_COLORS[currentPhase] }}
        />

        {/* Central Cycle Node */}
        <div className="relative z-10">
          <div
            className="w-56 h-56 md:w-64 md:h-64 rounded-full bg-[#161616] border-4 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group transition-all duration-700"
            style={{ borderColor: PHASE_COLORS[currentPhase] === 'transparent' ? 'rgba(255,255,255,0.05)' : `${PHASE_COLORS[currentPhase]}40` }}
          >
            {/* Inner Glow Ring */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"
              style={{ backgroundColor: PHASE_COLORS[currentPhase] === 'transparent' ? '#c1ff72' : PHASE_COLORS[currentPhase] }}
            />

            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Dia do Ciclo</span>
            <div className="flex items-baseline gap-1">
              <span className="text-6xl md:text-7xl font-black text-white">
                {currentDayOfCycle ?? '—'}
              </span>
              <span className="text-xl font-bold text-white/20">/{cycleLength}</span>
            </div>

            <div
              className="mt-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg"
              style={{
                backgroundColor: currentPhase === 'none' ? 'rgba(255,255,255,0.05)' : `${PHASE_COLORS[currentPhase]}20`,
                color: currentPhase === 'none' ? 'rgba(255,255,255,0.4)' : PHASE_COLORS[currentPhase]
              }}
            >
              {PHASE_LABELS[currentPhase]}
            </div>

            {/* Progress Perimeter */}
            <svg className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90 pointer-events-none">
              <circle
                cx="50%"
                cy="50%"
                r="49%"
                fill="none"
                stroke={currentPhase === 'none' ? 'rgba(255,255,255,0.05)' : PHASE_COLORS[currentPhase]}
                strokeWidth="4"
                strokeDasharray="100 100"
                strokeDashoffset={100 - (hasSettings ? ((currentDayOfCycle ?? 0) / cycleLength) * 100 : 0)}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 8px ${PHASE_COLORS[currentPhase]})` }}
              />
            </svg>
          </div>
        </div>

        {/* Quick Info Grid (Floating under Node) */}
        <div className="grid grid-cols-2 gap-3 mt-10 w-full max-w-sm px-4">
          <div className="bg-[#161616]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Próxima Menstruação</p>
            <p className="text-lg font-bold text-white">
              {nextPeriodDate ? nextPeriodDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}
            </p>
            {nextPeriodDate && (
              <p className="text-[10px] text-[#c1ff72] font-bold mt-1">
                em {Math.max(0, cycleLength - (currentDayOfCycle ?? 0))} dias
              </p>
            )}
          </div>
          <div className="bg-[#161616]/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Menstruação</p>
            <p className="text-lg font-bold text-white">{periodLength} dias</p>
            <p className="text-[10px] text-white/30 font-bold mt-1">Duração média</p>
          </div>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Tech Calendar (Spans 8 columns) */}
        <div className="md:col-span-8 bg-[#161616] border border-white/5 rounded-[32px] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#c1ff72]/10 rounded-xl text-[#c1ff72]">
                <CalendarIcon size={18} />
              </div>
              <h2 className="font-bold text-white tracking-tight">Timeline do Ciclo</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCalendarOffset(o => o - 1)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCalendarOffset(o => o + 1)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
              {calendarDays.map(({ dateStr, date, phase, isToday }) => {
                const hasLog = !!logsMap[dateStr];
                return (
                  <button
                    key={dateStr}
                    onClick={() => openLog(dateStr)}
                    className={`shrink-0 w-16 h-24 rounded-2xl flex flex-col items-center justify-between py-4 transition-all duration-300 group border
                      ${isToday ? 'scale-110 shadow-lg' : 'opacity-80 hover:opacity-100'}
                    `}
                    style={{
                      backgroundColor: phase !== 'none' ? `${PHASE_COLORS[phase]}15` : 'rgba(255,255,255,0.03)',
                      borderColor: isToday ? '#c1ff72' : (phase !== 'none' ? `${PHASE_COLORS[phase]}30` : 'rgba(255,255,255,0.05)'),
                    }}
                  >
                    <span className="text-[10px] font-black uppercase text-white/30">{date.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3)}</span>
                    <span className={`text-xl font-black ${isToday ? 'text-white' : 'text-white/70'}`}>{date.getDate()}</span>
                    <div className="flex flex-col items-center gap-1.5">
                      {hasLog && <div className="w-1.5 h-1.5 rounded-full bg-[#c1ff72] shadow-[0_0_8px_#c1ff72]" />}
                      <div className="w-2 h-0.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase] }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legends */}
            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-white/5">
              {(['menstruation', 'follicular', 'ovulation', 'luteal'] as Phase[]).map(p => (
                <div key={p} className="flex items-center gap-2 group">
                  <div className="w-2 h-2 rounded-sm rotate-45 transition-transform group-hover:scale-125" style={{ backgroundColor: PHASE_COLORS[p] }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{PHASE_LABELS[p]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info & Settings Card (Spans 4 columns) */}
        <div className="md:col-span-4 space-y-6">
          {/* Quick Stats */}
          <div className="bg-[#161616] border border-white/5 rounded-[32px] p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                <Activity size={18} />
              </div>
              <h2 className="font-bold text-white tracking-tight">Insights</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
                <span className="text-xs text-white/40 font-bold uppercase">Previsibilidade</span>
                <span className="text-xs text-[#c1ff72] font-black">Alta</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
                <span className="text-xs text-white/40 font-bold uppercase">Próximo Ápice</span>
                <span className="text-xs text-white font-black">{PHASE_LABELS.ovulation}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#c1ff72]/5 border border-[#c1ff72]/10">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={14} className="text-[#c1ff72]" />
                  <span className="text-[10px] font-black uppercase text-[#c1ff72]">Dica do Dia</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  {currentPhase === 'menstruation' ? 'Foque em alimentos leves e descanso. Seu corpo está em fase de limpeza.' :
                    currentPhase === 'ovulation' ? 'Energia em alta! Ótimo momento para treinos intensos e produtividade.' :
                      'Mantenha a hidratação e monitore seu humor nesta transição.'}
                </p>
              </div>
            </div>
          </div>

          {/* Mini Settings */}
          <div className="bg-[#161616] border border-white/5 rounded-[32px] p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400">
                <Settings2 size={18} />
              </div>
              <h2 className="font-bold text-white tracking-tight">Ciclo Base</h2>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/30 mb-1.5 block">Duração</label>
                  <input
                    type="number"
                    value={cycleLength}
                    onChange={e => setCycleLength(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-sm text-white font-bold outline-none focus:border-[#c1ff72]/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/30 mb-1.5 block">Período</label>
                  <input
                    type="number"
                    value={periodLength}
                    onChange={e => setPeriodLength(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-sm text-white font-bold outline-none focus:border-[#c1ff72]/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/30 mb-1.5 block">Último Início</label>
                <input
                  type="date"
                  value={lastPeriodStart}
                  onChange={e => setLastPeriodStart(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-sm text-white font-bold outline-none focus:border-[#c1ff72]/30 [color-scheme:dark]"
                />
              </div>
              <button
                onClick={saveSettings}
                disabled={settingsSaving}
                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={14} />
                {settingsSaving ? 'Salvando...' : 'Atualizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Log Modal */}
      {modalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300" onClick={() => setModalDate(null)}>
          <div
            className="bg-[#0c0c0c] border border-white/10 rounded-[40px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Registro Diário</h3>
                <p className="text-sm text-white/40 font-bold mt-1">
                  {parseLocalDate(modalDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setModalDate(null)} className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Flow Intensity */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#ff5c5c] mb-4 block">Intensidade do Fluxo</label>
                <div className="grid grid-cols-5 gap-2">
                  {FLOW_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setModalFlow(i)}
                      className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all
                        ${modalFlow === i ? 'bg-[#ff5c5c]/20 text-[#ff5c5c] ring-1 ring-[#ff5c5c]/40' : 'bg-white/5 text-white/30 hover:bg-white/10'}
                      `}
                    >
                      <Droplets size={20} style={{ opacity: i === 0 ? 0.2 : 0.4 + (i * 0.15) }} />
                      <span className="text-[10px] font-black uppercase text-center leading-tight px-1">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms & Mood */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#ff85b3] mb-4 block">Sintomas</label>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOMS.map(s => (
                      <button
                        key={s}
                        onClick={() => toggleSymptom(s)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
                          ${modalSymptoms.includes(s) ? 'bg-[#ff85b3]/20 text-[#ff85b3] ring-1 ring-[#ff85b3]/40' : 'bg-white/5 text-white/30 hover:bg-white/10'}
                        `}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#d48dff] mb-4 block">Humor</label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map(m => (
                      <button
                        key={m}
                        onClick={() => setModalMood(modalMood === m ? '' : m)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all
                          ${modalMood === m ? 'bg-[#d48dff]/20 text-[#d48dff] ring-1 ring-[#d48dff]/40' : 'bg-white/5 text-white/30 hover:bg-white/10'}
                        `}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Energy & Notes */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#c1ff72] mb-4 block">Nível de Energia</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setModalEnergy(n)}
                      className={`flex-1 h-12 rounded-2xl text-sm font-black transition-all
                        ${modalEnergy === n ? 'bg-[#c1ff72]/20 text-[#c1ff72] ring-1 ring-[#c1ff72]/40' : 'bg-white/5 text-white/30 hover:bg-white/10'}
                      `}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 block">Notas Adicionais</label>
                <textarea
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  rows={3}
                  placeholder="Escreva como você está se sentindo..."
                  className="w-full bg-white/5 border border-white/5 rounded-3xl px-6 py-4 text-sm text-white outline-none focus:border-[#c1ff72]/40 resize-none placeholder:text-white/10"
                />
              </div>

              <button
                onClick={saveLog}
                disabled={modalSaving}
                className="w-full h-16 rounded-3xl bg-[#c1ff72] hover:bg-[#b0e666] text-black font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(193,255,114,0.3)] flex items-center justify-center gap-3"
              >
                <Save size={20} />
                {modalSaving ? 'Sincronizando...' : 'Confirmar Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenstrualCycle;
