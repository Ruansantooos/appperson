
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, ButtonCircle } from '../components/ui/LayoutComponents';
// Added MoreHorizontal to imports
import { Plus, Search, Filter, MoreVertical, MoreHorizontal, Calendar, CheckCircle2, Circle, ArrowUpRight, X, Loader2, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Task } from '../types';

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'Work',
    dueDate: ''
  });

  const categories = ['Work', 'Personal', 'Health', 'Finance', 'Education', 'Errands'];

  useEffect(() => {
    if (!user) return;
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        const mappedTasks = data.map((t: any) => ({
          ...t,
          dueDate: t.due_date,
          createdAt: t.created_at
        }));
        setTasks(mappedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    // Status Filter
    if (filter === 'Pending' && t.status !== 'Pending') return false;
    if (filter === 'Completed' && t.status !== 'Completed') return false;

    // Search Filter
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t));

    try {
      await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    } catch (error) {
      console.error('Error updating task:', error);
      fetchTasks();
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setCurrentTask(null);
    setNewTask({
      title: '',
      description: '',
      priority: 'Medium',
      category: 'Work',
      dueDate: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setIsEditMode(true);
    setCurrentTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate || ''
    });
    setIsModalOpen(true);
    setActiveMenuTaskId(null);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (error) {
      console.error('Error deleting task:', error);
      fetchTasks();
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode && currentTask) {
        // Update
        const { error } = await supabase.from('tasks').update({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          category: newTask.category,
          due_date: newTask.dueDate
        }).eq('id', currentTask.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from('tasks').insert([{
          user_id: user.id,
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          category: newTask.category,
          due_date: newTask.dueDate,
          status: 'Pending'
        }]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
            <Input
              className="pl-12 h-12 rounded-full border-[var(--card-border)] bg-[var(--input-bg)]"
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 w-12 p-0 flex items-center justify-center">
            <Filter size={18} />
          </Button>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'Pending', 'Completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filter === f ? 'bg-[#c1ff72] text-black shadow-lg shadow-brand/20' : 'bg-[var(--input-bg)] text-[var(--foreground)] opacity-40 hover:opacity-100 border border-[var(--card-border)]'
                }`}
            >
              {f}
            </button>
          ))}
          <Button
            className="h-10 ml-2 shadow-[0_0_15px_rgba(193,255,114,0.2)]"
            onClick={openCreateModal}
          >
            <Plus size={16} /> Nova
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(task => (
          <Card key={task.id} className="p-6 group relative">
            <div className="flex items-start gap-4">
              <button
                onClick={() => toggleTask(task.id, task.status)}
                className={`mt-1 flex-shrink-0 transition-colors ${task.status === 'Completed' ? 'text-[#c1ff72]' : 'text-[var(--foreground)] opacity-20 hover:opacity-100'}`}
              >
                {task.status === 'Completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <h3 className={`text-base font-bold truncate ${task.status === 'Completed' ? 'line-through opacity-30 font-medium' : ''}`}>
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge variant={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'default'}>
                        {task.priority}
                      </Badge>
                      <span className="text-[10px] opacity-30 flex items-center gap-1 font-bold uppercase tracking-widest">
                        <Calendar size={12} /> {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="absolute top-4 right-4">
              <div className="relative">
                <button
                  onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                  className="opacity-20 hover:opacity-100 p-2 transition-opacity"
                >
                  <MoreHorizontal size={20} />
                </button>

                {activeMenuTaskId === task.id && (
                  <div className="absolute right-0 top-full mt-2 w-32 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <button
                      onClick={() => openEditModal(task)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--input-bg)] flex items-center gap-2 transition-colors"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--input-bg)] text-red-400 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>

          </Card>
        ))}
        {filteredTasks.length === 0 && (
          <div className="col-span-full py-20 text-center text-white/20">
            <p>Nenhuma tarefa encontrada.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 border-[#c1ff72]/20 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">{isEditMode ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Título</label>
                <input
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all placeholder:opacity-20"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  required
                  placeholder="Ex: Finalizar relatório"
                />
              </div>
              <div>
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Descrição</label>
                <textarea
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none h-24 resize-none transition-all placeholder:opacity-20"
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Detalhes da tarefa..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Prioridade</label>
                  <select
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none appearance-none transition-all"
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                  >
                    <option value="Low" className="bg-[var(--card-bg)]">Baixa</option>
                    <option value="Medium" className="bg-[var(--card-bg)]">Média</option>
                    <option value="High" className="bg-[var(--card-bg)]">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Categoria</label>
                  <select
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none appearance-none transition-all"
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c} className="bg-[var(--card-bg)]">{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest block mb-1">Data de Vencimento</label>
                <input
                  type="date"
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[#c1ff72] outline-none transition-all"
                  value={newTask.dueDate ? newTask.dueDate.split('T')[0] : ''}
                  onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-[#c1ff72] text-black font-bold py-3 rounded-xl hover:bg-[#b0e666] transition-colors mt-4">
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : (isEditMode ? 'Salvar Alterações' : 'Criar Tarefa')}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
