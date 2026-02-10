
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, ButtonCircle } from '../components/ui/LayoutComponents';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Download,
  MoreHorizontal,
  X,
  Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction } from '../types';

const COLORS = ['#d8b4a6', '#8fb0bc', '#c1ff72', '#e6a06e', '#ffffff'];

const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // New Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: 'Food',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (data) setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          description: newTransaction.description,
          amount: parseFloat(newTransaction.amount),
          category: newTransaction.category,
          type: newTransaction.type,
          date: newTransaction.date
        }
      ]);

      if (error) throw error;

      // Reset and refresh
      setNewTransaction({
        description: '',
        amount: '',
        category: 'Food',
        type: 'expense',
        date: new Date().toISOString().split('T')[0]
      });
      setIsModalOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Error saving transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalBalance = transactions.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  const incomeMonth = transactions
    .filter(t => t.type === 'income') // Simplification: assuming all time for demo or filter by month if needed
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const expenseMonth = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Derive category data
  const categoryTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.keys(categoryTotals).map((cat, index) => ({
    name: cat,
    value: categoryTotals[cat],
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="peach" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
            <ArrowUpRight size={14} />
          </div>
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Saldo Total</p>
          <h4 className="text-2xl font-bold mt-2">R$ {totalBalance.toFixed(2)}</h4>
        </Card>
        <Card variant="blue" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
            <TrendingUp size={14} />
          </div>
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Receitas (Mês)</p>
          <h4 className="text-2xl font-bold mt-2">R$ {incomeMonth.toFixed(2)}</h4>
        </Card>
        <Card variant="orange" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
            <ArrowDownLeft size={14} />
          </div>
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Despesas (Mês)</p>
          <h4 className="text-2xl font-bold mt-2">R$ {expenseMonth.toFixed(2)}</h4>
        </Card>
        <Card className="p-6 relative bg-white/5 border-white/10 flex items-center justify-center">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-full bg-[#c1ff72] text-black"
          >
            <Plus size={20} /> Nova Transação
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Expenses by Category Chart */}
        <div className="lg:col-span-4">
          <Card className="p-8 h-full">
            <h3 className="text-lg font-medium text-white/60 mb-8">Gastos por Categoria</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: -20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-4">
              {categoryData.map(cat => (
                <div key={cat.name} className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-3 text-white/40">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    {cat.name}
                  </div>
                  <span className="text-white">R$ {cat.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-8">
          <Card className="p-8">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold">Transações Recentes</h3>
              <div className="flex gap-2">
                <button className="bg-white/5 border border-white/10 px-6 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-white/10 transition-colors">
                  <Download size={14} /> Exportar
                </button>
              </div>
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
                  {transactions.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-white/40">Nenhuma transação.</td></tr>
                  ) : transactions.slice(0, 8).map(tx => (
                    <tr key={tx.id} className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-6 text-white/40 font-medium">{tx.date}</td>
                      <td className="py-6 font-bold">{tx.description}</td>
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
            <Button variant="outline" className="w-full mt-8 border-white/5">Ver histórico completo</Button>
          </Card>
        </div>
      </div>

      {/* New Transaction Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-[#c1ff72]/20 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6">Nova Transação</h3>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Descrição</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                  placeholder="Ex: Almoço, Uber, Salário..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Data</label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Tipo</label>
                  <div className="flex bg-[#161616] rounded-xl p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${newTransaction.type === 'expense' ? 'bg-red-500/20 text-red-500' : 'text-white/40'}`}
                    >
                      Saída
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${newTransaction.type === 'income' ? 'bg-[#c1ff72]/20 text-[#c1ff72]' : 'text-white/40'}`}
                    >
                      Entrada
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Categoria</label>
                  <select
                    value={newTransaction.category}
                    onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                  >
                    {['Food', 'Work', 'Housing', 'Shopping', 'Entertainment', 'Transport', 'Utilities', 'Health', 'Education', 'Income', 'Others'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#c1ff72] text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#b0e666] transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Adicionar Transação</>}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
