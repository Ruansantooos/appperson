
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Task, CalendarEvent } from '../types';
import { Card, Button, Badge, ButtonCircle } from '../components/ui/LayoutComponents';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  MoreHorizontal,
  ArrowUpRight,
  CheckCircle2,
  ListTodo,
  Calendar as CalendarIcon,
  Search,
  X,
  Loader2
} from 'lucide-react';
// No mock-data imports needed

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date()); // Use current date
  const [selectedDay, setSelectedDay] = useState<number>(currentDate.getDate());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // New Event Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start_time: '',
    end_time: '',
    category: 'Work',
    location: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // New Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'Work',
    dueDate: ''
  });

  useEffect(() => {
    if (!user) return;
    fetchTasks();
    fetchEvents();
  }, [user]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);
    if (data) {
      const mappedTasks = data.map((t: any) => ({
        ...t,
        dueDate: t.due_date,
        createdAt: t.created_at
      }));
      setTasks(mappedTasks);
    }
  };

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      const mappedEvents = data.map((e: any) => ({
        ...e,
        start: e.start_time,
        end: e.end_time
      }));
      setEvents(mappedEvents);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Combine date with time if needed, or just assume inputs are datetime-local
    // For simplicity, let's assume inputs are datetime-local for start/end

    try {
      const { error } = await supabase.from('calendar_events').insert([
        {
          user_id: user.id,
          title: newEvent.title,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          category: newEvent.category,
          location: newEvent.location,
          description: newEvent.description
        }
      ]);

      if (error) throw error;

      // Reset
      setNewEvent({
        title: '',
        start_time: '',
        end_time: '',
        category: 'Work',
        location: '',
        description: ''
      });
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('tasks').insert([
        {
          user_id: user.id,
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          category: newTask.category,
          due_date: newTask.dueDate,
          status: 'Pending'
        }
      ]);

      if (error) throw error;

      // Reset
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'Work',
        dueDate: ''
      });
      setIsTaskModalOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task.');
    } finally {
      setSubmitting(false);
    }
  };

  const openTaskModalForSelectedDay = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = selectedDay;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    setNewTask(prev => ({ ...prev, dueDate: dateStr }));
    setIsTaskModalOpen(true);
  };

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const totalDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const startDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const calendarCells = Array.from({ length: 42 }, (_, i) => { // Increased to 42 to cover all possible weeks
    const dayNum = i - startDay + 1;
    return dayNum > 0 && dayNum <= totalDays ? dayNum : null;
  });

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(1);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(1);
  };

  // Filtragem de Eventos e Tarefas para o dia selecionado
  const itemsForSelectedDay = useMemo(() => {
    // Combine Mock events (if any left) with Real events
    // For now, let's prioritize real events or merge them
    // Let's use real events primarily
    const allEvents = [...events];

    const dayEvents = allEvents.filter(e => {
      const eDate = new Date(e.start);
      return eDate.getDate() === selectedDay &&
        eDate.getMonth() === currentDate.getMonth() &&
        eDate.getFullYear() === currentDate.getFullYear();
    });

    const dayTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      const tDate = new Date(t.dueDate);
      // Assuming dueDate in Supabase is ISO string or timestamp
      return tDate.getDate() === selectedDay &&
        tDate.getMonth() === currentDate.getMonth() &&
        tDate.getFullYear() === currentDate.getFullYear();
    });

    return { events: dayEvents, tasks: dayTasks };
  }, [selectedDay, currentDate, tasks, events]);

  const getDaySummary = (day: number) => {
    const eventCount = events.filter(e => {
      const d = new Date(e.start);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }).length;

    const taskCount = tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }).length;

    return { eventCount, taskCount };
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 bg-[#161616] p-1.5 rounded-full border border-white/5">
          <button className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[#c1ff72] text-black">Mês</button>
          <button className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">Semana</button>
          <button className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">Dia</button>
        </div>
        <div className="flex gap-3">
          <button className="w-10 h-10 rounded-full border border-[var(--card-border)] flex items-center justify-center opacity-40 hover:bg-[var(--foreground)]/5 transition-all"><Search size={18} /></button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-8 shadow-[0_0_20px_rgba(193,255,114,0.2)]"
          >
            <Plus size={16} className="mr-2" /> Novo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Calendar Grid Section */}
        <div className="xl:col-span-8">
          <Card className="p-8 border-white/5 bg-[#0e0e0e]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-6">
                <h3 className="text-3xl font-bold tracking-tighter capitalize">{months[currentDate.getMonth()]} <span className="opacity-10 italic">{currentDate.getFullYear()}</span></h3>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-[var(--card-border)] flex items-center justify-center opacity-20 hover:opacity-100 hover:border-[#c1ff72] transition-all"><ChevronLeft size={16} /></button>
                  <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-[var(--card-border)] flex items-center justify-center opacity-20 hover:opacity-100 hover:border-[#c1ff72] transition-all"><ChevronRight size={16} /></button>
                </div>
              </div>
              <Badge variant="status">Hoje é {new Date().getDate()} de {months[new Date().getMonth()]}</Badge>
            </div>

            <div className="grid grid-cols-7 mb-4">
              {days.map(d => (
                <div key={d} className="text-center text-[10px] font-bold opacity-20 uppercase tracking-[0.3em] py-4">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((day, idx) => {
                if (!day) return <div key={idx} className="h-32" />; // Increased height for better visibility

                const dayEvents = events.filter(e => {
                  const d = new Date(e.start);
                  return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                });

                const { taskCount } = getDaySummary(day);
                const isSelected = day === selectedDay;
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(day)}
                    className={`h-32 rounded-2xl border transition-all relative group flex flex-col p-2 items-start justify-start gap-1 overflow-hidden ${isSelected
                      ? 'bg-[#c1ff72]/5 border-[#c1ff72] shadow-[inset_0_0_20px_rgba(193,255,114,0.05)]'
                      : isToday
                        ? 'bg-white/[0.02] border-white/10'
                        : 'bg-transparent border-white/5 hover:border-white/20'
                      }`}
                  >
                    <span className={`text-sm font-bold mb-1 ${isSelected ? 'text-[#c1ff72]' : isToday ? 'text-white' : 'text-white/30'}`}>
                      {day < 10 ? `0${day}` : day}
                    </span>

                    <div className="w-full flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={event.id}
                          className={`w-full text-[9px] font-bold px-1.5 py-0.5 rounded truncate text-left ${event.category === 'Work' ? 'bg-blue-500/20 text-blue-400' :
                            event.category === 'Personal' ? 'bg-purple-500/20 text-purple-400' :
                              event.category === 'Health' ? 'bg-red-500/20 text-red-400' :
                                'bg-[#c1ff72]/20 text-[#c1ff72]'
                            }`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-white/30 pl-1">+{dayEvents.length - 3} mais</span>
                      )}

                      {dayEvents.length === 0 && taskCount > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: Math.min(taskCount, 5) }).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-[#c1ff72]"></div>
                          ))}
                        </div>
                      )}
                    </div>

                    {isToday && !isSelected && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#c1ff72] rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Selected Day Planner Sidebar */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="p-8 h-full bg-[#161616] border-white/5">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-bold">Planejamento</h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">{selectedDay} de {months[currentDate.getMonth()]}, {currentDate.getFullYear()}</p>
              </div>
              <ButtonCircle icon={<ArrowUpRight size={18} />} />
            </div>

            <div className="space-y-8">
              {/* Seção de Compromissos (Eventos) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon size={14} className="text-blue-400" />
                  <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Compromissos ({itemsForSelectedDay.events.length})</h4>
                </div>
                {itemsForSelectedDay.events.length > 0 ? (
                  <div className="space-y-3">
                    {itemsForSelectedDay.events.map(event => (
                      <div key={event.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-sm font-bold">{event.title}</h5>
                          <span className="text-[9px] text-white/20 font-bold">{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            <MapPin size={10} /> {event.location}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/10 italic">Nenhum evento agendado.</p>
                )}
              </div>

              {/* Seção de Tarefas do Dia */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ListTodo size={14} className="text-[#c1ff72]" />
                  <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Tarefas Pendentes ({itemsForSelectedDay.tasks.length})</h4>
                </div>
                {itemsForSelectedDay.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {itemsForSelectedDay.tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group">
                        <div className="flex items-center gap-3">
                          <button className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${task.status === 'Completed' ? 'bg-[#c1ff72] border-[#c1ff72] text-black' : 'border-white/10 text-transparent hover:border-[#c1ff72]'}`}>
                            <CheckCircle2 size={12} />
                          </button>
                          <span className={`text-xs font-bold ${task.status === 'Completed' ? 'line-through text-white/20' : 'text-white'}`}>{task.title}</span>
                        </div>
                        <Badge variant={task.priority === 'High' ? 'danger' : 'status'}>{task.priority.charAt(0)}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/10 italic">Sem tarefas para este dia.</p>
                )}
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="pt-6 border-t border-white/5">
                  <button
                    onClick={openTaskModalForSelectedDay}
                    className="w-full h-14 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-xs font-bold text-white/20 hover:border-[#c1ff72]/40 hover:text-[#c1ff72] transition-all group"
                  >
                    <Plus size={16} className="mr-2 group-hover:scale-125 transition-transform" /> Adicionar Tarefa ao Dia
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* New Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-[#c1ff72]/20 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6">Novo Evento</h3>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Título</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                  placeholder="Ex: Reunião, Consulta..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Início</label>
                  <input
                    type="datetime-local"
                    value={newEvent.start_time}
                    onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Fim</label>
                  <input
                    type="datetime-local"
                    value={newEvent.end_time}
                    onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Categoria</label>
                <select
                  value={newEvent.category}
                  onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                >
                  {['Work', 'Personal', 'Health', 'Finance'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Local (Opcional)</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                  placeholder="Ex: Escritório, Zoom..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#c1ff72] text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#b0e666] transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Criar Evento</>}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* New Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-[#c1ff72]/20 relative">
            <button
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6">Nova Tarefa para o dia {selectedDay}</h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Título</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                  placeholder="Ex: Preparar Relatório..."
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Descrição</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72] h-24 resize-none"
                  placeholder="Detalhes da tarefa..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Prioridade</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                  >
                    {['High', 'Medium', 'Low'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Categoria</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                  >
                    {['Work', 'Personal', 'Health', 'Finance', 'Education'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Data de Vencimento</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#c1ff72] text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#b0e666] transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Criar Tarefa</>}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
