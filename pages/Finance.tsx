
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
  Loader2,
  CreditCard,
  Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, FinanceCard } from '../types';

const COLORS = ['#d8b4a6', '#8fb0bc', '#c1ff72', '#e6a06e', '#ffffff'];

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #434343 0%, #1a1a1a 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
];

const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<FinanceCard[]>([]);
  const [loading, setLoading] = useState(true);

  // New Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: 'Food',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    card_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // New Card Modal State
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    bank_name: '',
    last_four_digits: '',
    expiration_date: '',
    card_type: 'credit' as 'credit' | 'debit',
    card_limit: ''
  });
  const [submittingCard, setSubmittingCard] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
    fetchCards();
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

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setCards(data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const insertData: any = {
        user_id: user.id,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
        type: newTransaction.type,
        date: newTransaction.date
      };

      if (newTransaction.card_id) {
        insertData.card_id = newTransaction.card_id;
      }

      const { error } = await supabase.from('transactions').insert([insertData]);

      if (error) throw error;

      // Reset and refresh
      setNewTransaction({
        description: '',
        amount: '',
        category: 'Food',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        card_id: ''
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

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCard(true);

    try {
      const { error } = await supabase.from('cards').insert([
        {
          user_id: user.id,
          bank_name: newCard.bank_name,
          last_four_digits: newCard.last_four_digits,
          expiration_date: newCard.expiration_date,
          card_type: newCard.card_type,
          card_limit: parseFloat(newCard.card_limit) || 0
        }
      ]);

      if (error) throw error;

      setNewCard({
        bank_name: '',
        last_four_digits: '',
        expiration_date: '',
        card_type: 'credit',
        card_limit: ''
      });
      setIsCardModalOpen(false);
      fetchCards();
    } catch (error) {
      console.error('Error creating card:', error);
      alert('Erro ao salvar cartão. Tente novamente.');
    } finally {
      setSubmittingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;

    try {
      // Remove card_id from linked transactions first
      await supabase
        .from('transactions')
        .update({ card_id: null })
        .eq('card_id', cardId);

      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
      fetchCards();
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const getCardSpent = (cardId: string) => {
    return transactions
      .filter(t => t.card_id === cardId && t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount), 0);
  };

  const getCardName = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return '—';
    return `${card.bank_name} •••• ${card.last_four_digits}`;
  };

  // Calculations
  const totalBalance = transactions.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  const incomeMonth = transactions
    .filter(t => t.type === 'income')
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
      {/* Summary Cards */}
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

      {/* Meus Cartões Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CreditCard size={20} className="text-[#c1ff72]" />
            Meus Cartões
          </h3>
          <Button size="sm" onClick={() => setIsCardModalOpen(true)}>
            <Plus size={16} /> Novo Cartão
          </Button>
        </div>

        {cards.length === 0 ? (
          <Card className="p-8 text-center">
            <CreditCard size={40} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/40 text-sm">Nenhum cartão cadastrado.</p>
            <p className="text-white/20 text-xs mt-1">Adicione seu primeiro cartão para acompanhar seus gastos.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, index) => {
              const spent = getCardSpent(card.id);
              const available = card.card_limit - spent;
              const usagePercent = card.card_limit > 0 ? Math.min((spent / card.card_limit) * 100, 100) : 0;

              return (
                <div
                  key={card.id}
                  className="relative rounded-[20px] p-6 text-white overflow-hidden min-h-[220px] flex flex-col justify-between"
                  style={{ background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }}
                >
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-red-500/30 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                    style={{ opacity: undefined }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Top: Bank name + badge */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-bold uppercase tracking-wider opacity-90">
                        {card.bank_name}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        card.card_type === 'credit'
                          ? 'bg-purple-500/30 text-purple-300'
                          : 'bg-emerald-500/30 text-emerald-300'
                      }`}>
                        {card.card_type === 'credit' ? 'Crédito' : 'Débito'}
                      </span>
                    </div>

                    {/* Card number */}
                    <p className="text-lg font-mono tracking-[0.25em] opacity-80">
                      •••• •••• •••• {card.last_four_digits}
                    </p>
                  </div>

                  {/* Bottom: Expiry + Usage */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest opacity-50 mb-1">
                      <span>Validade {card.expiration_date}</span>
                    </div>

                    {/* Progress bar */}
                    {card.card_limit > 0 && (
                      <div className="mt-3">
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${usagePercent}%`,
                              backgroundColor: usagePercent > 80 ? '#ef4444' : usagePercent > 50 ? '#f59e0b' : '#c1ff72'
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-[11px]">
                          <span className="opacity-60">
                            Gasto: <span className="font-bold text-white opacity-100">R$ {spent.toFixed(2)}</span>
                          </span>
                          <span className="opacity-60">
                            Disponível: <span className={`font-bold opacity-100 ${available < 0 ? 'text-red-400' : 'text-[#c1ff72]'}`}>R$ {available.toFixed(2)}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts + Transactions */}
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
                    <th className="pb-4 font-medium">Cartão</th>
                    <th className="pb-4 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-white/40">Nenhuma transação.</td></tr>
                  ) : transactions.slice(0, 8).map(tx => (
                    <tr key={tx.id} className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-6 text-white/40 font-medium">{tx.date}</td>
                      <td className="py-6 font-bold">{tx.description}</td>
                      <td className="py-6">
                        <Badge variant="status">{tx.category}</Badge>
                      </td>
                      <td className="py-6 text-white/40 text-xs">
                        {tx.card_id ? getCardName(tx.card_id) : '—'}
                      </td>
                      <td className={`py-6 text-right font-bold ${tx.type === 'income' ? 'text-[#c1ff72]' : 'text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
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

      {/* New Transaction Modal */}
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

              {/* Card selector */}
              {cards.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">
                    Cartão <span className="text-white/20">(opcional)</span>
                  </label>
                  <select
                    value={newTransaction.card_id}
                    onChange={e => setNewTransaction({ ...newTransaction, card_id: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                  >
                    <option value="">Nenhum cartão</option>
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.bank_name} •••• {card.last_four_digits} ({card.card_type === 'credit' ? 'Crédito' : 'Débito'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

      {/* New Card Modal */}
      {isCardModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-[#c1ff72]/20 relative">
            <button
              onClick={() => setIsCardModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard size={20} className="text-[#c1ff72]" />
              Novo Cartão
            </h3>

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Nome do Banco</label>
                <input
                  type="text"
                  value={newCard.bank_name}
                  onChange={e => setNewCard({ ...newCard, bank_name: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                  placeholder="Ex: Nubank, Itaú, Bradesco..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Últimos 4 Dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newCard.last_four_digits}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setNewCard({ ...newCard, last_four_digits: val });
                    }}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72] font-mono tracking-widest"
                    placeholder="1234"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Validade (MM/AA)</label>
                  <input
                    type="text"
                    maxLength={5}
                    value={newCard.expiration_date}
                    onChange={e => {
                      let val = e.target.value.replace(/[^\d/]/g, '');
                      if (val.length === 2 && !val.includes('/') && newCard.expiration_date.length < val.length) {
                        val = val + '/';
                      }
                      setNewCard({ ...newCard, expiration_date: val.slice(0, 5) });
                    }}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72] font-mono tracking-widest"
                    placeholder="12/28"
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
                      onClick={() => setNewCard({ ...newCard, card_type: 'credit' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${newCard.card_type === 'credit' ? 'bg-purple-500/20 text-purple-400' : 'text-white/40'}`}
                    >
                      Crédito
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCard({ ...newCard, card_type: 'debit' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${newCard.card_type === 'debit' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40'}`}
                    >
                      Débito
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Limite (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCard.card_limit}
                    onChange={e => setNewCard({ ...newCard, card_limit: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c1ff72]"
                    placeholder="5000.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingCard}
                className="w-full bg-[#c1ff72] text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#b0e666] transition-colors flex items-center justify-center gap-2"
              >
                {submittingCard ? <Loader2 size={18} className="animate-spin" /> : <><CreditCard size={18} /> Adicionar Cartão</>}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
