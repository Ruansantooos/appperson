
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
  Trash2,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Repeat,
  Building2,
  User
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, FinanceCard, Bill } from '../types';

const COLORS = ['#d8b4a6', '#8fb0bc', '#c1ff72', '#e6a06e', '#ffffff'];

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #434343 0%, #1a1a1a 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
];

const CATEGORIES = ['Food', 'Work', 'Housing', 'Shopping', 'Entertainment', 'Transport', 'Utilities', 'Health', 'Education', 'Income', 'Others'];

const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<FinanceCard[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [financeScope, setFinanceScope] = useState<'pf' | 'pj'>('pf');

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

  // New Bill Modal State
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [newBill, setNewBill] = useState({
    description: '',
    amount: '',
    due_date: '',
    recurrence: 'once' as 'once' | 'weekly' | 'monthly',
    category: 'Utilities',
    card_id: ''
  });
  const [submittingBill, setSubmittingBill] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
    fetchCards();
    fetchBills();
  }, [user, financeScope]);

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('finance_scope', financeScope)
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
      const { data } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('finance_scope', financeScope)
        .order('created_at', { ascending: false });

      if (data) setCards(data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  };

  const fetchBills = async () => {
    try {
      const { data } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('finance_scope', financeScope)
        .order('due_date', { ascending: true });

      if (data) setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
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
        date: newTransaction.date,
        finance_scope: financeScope
      };

      if (newTransaction.card_id) {
        insertData.card_id = newTransaction.card_id;
      }

      const { error } = await supabase.from('transactions').insert([insertData]);

      if (error) throw error;

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
          card_limit: parseFloat(newCard.card_limit) || 0,
          finance_scope: financeScope
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

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBill(true);

    try {
      const insertData: any = {
        user_id: user.id,
        description: newBill.description,
        amount: parseFloat(newBill.amount),
        due_date: newBill.due_date,
        recurrence: newBill.recurrence,
        category: newBill.category,
        status: 'pending',
        finance_scope: financeScope
      };

      if (newBill.card_id) {
        insertData.card_id = newBill.card_id;
      }

      const { error } = await supabase.from('bills').insert([insertData]);

      if (error) throw error;

      setNewBill({
        description: '',
        amount: '',
        due_date: '',
        recurrence: 'once',
        category: 'Utilities',
        card_id: ''
      });
      setIsBillModalOpen(false);
      fetchBills();
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Erro ao salvar conta. Tente novamente.');
    } finally {
      setSubmittingBill(false);
    }
  };

  const handlePayBill = async (bill: Bill) => {
    try {
      // 1. Mark bill as paid
      const { error: updateError } = await supabase
        .from('bills')
        .update({ status: 'paid' })
        .eq('id', bill.id);

      if (updateError) throw updateError;

      // 2. Create expense transaction automatically
      const txData: any = {
        user_id: user.id,
        description: `Conta paga: ${bill.description}`,
        amount: bill.amount,
        category: bill.category,
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        finance_scope: bill.finance_scope
      };

      if (bill.card_id) {
        txData.card_id = bill.card_id;
      }

      const { error: txError } = await supabase.from('transactions').insert([txData]);

      if (txError) throw txError;

      fetchBills();
      fetchTransactions();
    } catch (error) {
      console.error('Error paying bill:', error);
      alert('Erro ao pagar conta. Tente novamente.');
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId);

      if (error) throw error;
      fetchBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;

    try {
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

  // Determine visual status for bills (overdue if past due and still pending)
  const getBillDisplayStatus = (bill: Bill): 'paid' | 'pending' | 'overdue' => {
    if (bill.status === 'paid') return 'paid';
    const today = new Date().toISOString().split('T')[0];
    if (bill.due_date < today && bill.status === 'pending') return 'overdue';
    return 'pending';
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

  const pendingBillsTotal = bills
    .filter(b => getBillDisplayStatus(b) !== 'paid')
    .reduce((acc, b) => acc + Number(b.amount), 0);

  return (
    <div className="space-y-8 pb-10">
      {/* PF / PJ Scope Toggle */}
      <div className="flex items-center justify-center">
        <div className="flex bg-[#161616] rounded-2xl p-1 border border-white/10 w-fit">
          <button
            onClick={() => setFinanceScope('pf')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              financeScope === 'pf'
                ? 'bg-[#c1ff72]/15 text-[#c1ff72] shadow-lg shadow-[#c1ff72]/5'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <User size={16} />
            Pessoal (PF)
          </button>
          <button
            onClick={() => setFinanceScope('pj')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
              financeScope === 'pj'
                ? 'bg-[#8fb0bc]/15 text-[#8fb0bc] shadow-lg shadow-[#8fb0bc]/5'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Building2 size={16} />
            Empresa (PJ)
          </button>
        </div>
      </div>

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

      {/* Contas a Pagar Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CalendarClock size={20} className="text-[#e6a06e]" />
            Contas a Pagar
            {pendingBillsTotal > 0 && (
              <span className="text-sm font-normal text-white/40 ml-2">
                R$ {pendingBillsTotal.toFixed(2)} pendente
              </span>
            )}
          </h3>
          <Button size="sm" onClick={() => setIsBillModalOpen(true)}>
            <Plus size={16} /> Nova Conta
          </Button>
        </div>

        {bills.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarClock size={40} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/40 text-sm">Nenhuma conta cadastrada.</p>
            <p className="text-white/20 text-xs mt-1">Adicione contas futuras para manter o controle dos seus vencimentos.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {bills.map(bill => {
              const displayStatus = getBillDisplayStatus(bill);
              const statusConfig = {
                paid: {
                  bg: 'bg-emerald-500/10 border-emerald-500/20',
                  icon: <CheckCircle2 size={18} className="text-emerald-400" />,
                  badge: 'bg-emerald-500/20 text-emerald-400',
                  label: 'Paga'
                },
                pending: {
                  bg: 'bg-amber-500/5 border-amber-500/15',
                  icon: <Clock size={18} className="text-amber-400" />,
                  badge: 'bg-amber-500/20 text-amber-400',
                  label: 'Pendente'
                },
                overdue: {
                  bg: 'bg-red-500/10 border-red-500/20',
                  icon: <AlertTriangle size={18} className="text-red-400" />,
                  badge: 'bg-red-500/20 text-red-400',
                  label: 'Vencida'
                }
              };

              const config = statusConfig[displayStatus];
              const recurrenceLabels = { once: 'Única', weekly: 'Semanal', monthly: 'Mensal' };

              return (
                <Card
                  key={bill.id}
                  className={`p-4 border ${config.bg} flex items-center justify-between gap-4`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="shrink-0">
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm truncate">{bill.description}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badge}`}>
                          {config.label}
                        </span>
                        {bill.recurrence !== 'once' && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-1">
                            <Repeat size={10} />
                            {recurrenceLabels[bill.recurrence]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                        <span>Vence: {bill.due_date}</span>
                        <span>{bill.category}</span>
                        {bill.card_id && <span>{getCardName(bill.card_id)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-lg font-bold">R$ {Number(bill.amount).toFixed(2)}</p>
                    {displayStatus !== 'paid' && (
                      <button
                        onClick={() => handlePayBill(bill)}
                        className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Pagar
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
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
                    {CATEGORIES.map(cat => (
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

      {/* New Bill Modal */}
      {isBillModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-[#e6a06e]/20 relative">
            <button
              onClick={() => setIsBillModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CalendarClock size={20} className="text-[#e6a06e]" />
              Nova Conta
            </h3>

            <form onSubmit={handleCreateBill} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Descrição</label>
                <input
                  type="text"
                  value={newBill.description}
                  onChange={e => setNewBill({ ...newBill, description: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#e6a06e]"
                  placeholder="Ex: Aluguel, Internet, Luz..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBill.amount}
                    onChange={e => setNewBill({ ...newBill, amount: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#e6a06e]"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Vencimento</label>
                  <input
                    type="date"
                    value={newBill.due_date}
                    onChange={e => setNewBill({ ...newBill, due_date: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#e6a06e]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Recorrência</label>
                  <div className="flex bg-[#161616] rounded-xl p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setNewBill({ ...newBill, recurrence: 'once' })}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newBill.recurrence === 'once' ? 'bg-[#e6a06e]/20 text-[#e6a06e]' : 'text-white/40'}`}
                    >
                      Única
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewBill({ ...newBill, recurrence: 'weekly' })}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newBill.recurrence === 'weekly' ? 'bg-[#e6a06e]/20 text-[#e6a06e]' : 'text-white/40'}`}
                    >
                      Semanal
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewBill({ ...newBill, recurrence: 'monthly' })}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newBill.recurrence === 'monthly' ? 'bg-[#e6a06e]/20 text-[#e6a06e]' : 'text-white/40'}`}
                    >
                      Mensal
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Categoria</label>
                  <select
                    value={newBill.category}
                    onChange={e => setNewBill({ ...newBill, category: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#e6a06e]"
                  >
                    {CATEGORIES.map(cat => (
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
                    value={newBill.card_id}
                    onChange={e => setNewBill({ ...newBill, card_id: e.target.value })}
                    className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#e6a06e]"
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
                disabled={submittingBill}
                className="w-full bg-[#e6a06e] text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#d4905e] transition-colors flex items-center justify-center gap-2"
              >
                {submittingBill ? <Loader2 size={18} className="animate-spin" /> : <><CalendarClock size={18} /> Adicionar Conta</>}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
