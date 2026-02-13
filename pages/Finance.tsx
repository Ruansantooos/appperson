
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
  User,
  FileText,
  Users,
  Receipt,
  BarChart3,
  Landmark,
  ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, FinanceCard, Bill, Invoice, Receivable, Tax } from '../types';

const COLORS = ['#d8b4a6', '#8fb0bc', '#c1ff72', '#e6a06e', '#ffffff'];

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #434343 0%, #1a1a1a 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
];

const CATEGORIES_PF = ['Food', 'Work', 'Housing', 'Shopping', 'Entertainment', 'Transport', 'Utilities', 'Health', 'Education', 'Income', 'Others'];
const CATEGORIES_PJ = ['Fornecedores', 'Folha de Pagamento', 'Marketing', 'Infraestrutura', 'Impostos', 'Pró-labore', 'Serviços', 'Vendas', 'Others'];

const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<FinanceCard[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [financeScope, setFinanceScope] = useState<'pf' | 'pj'>('pf');

  // PJ-specific state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // New Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: 'Food',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    card_id: '',
    project_id: '',
    classification: 'Despesa' as 'Custo' | 'Despesa' | 'Investimento' | 'Outros'
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

  // PJ Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    invoice_number: '',
    description: '',
    amount: '',
    type: 'emitida' as 'emitida' | 'recebida',
    status: 'pendente' as 'emitida' | 'pendente' | 'cancelada',
    issue_date: new Date().toISOString().split('T')[0],
    client_name: ''
  });
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);
  const [newReceivable, setNewReceivable] = useState({
    client_name: '',
    description: '',
    amount: '',
    due_date: '',
    status: 'pending' as 'pending' | 'received' | 'overdue'
  });
  const [submittingReceivable, setSubmittingReceivable] = useState(false);

  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [newTax, setNewTax] = useState({
    tax_name: '',
    description: '',
    amount: '',
    due_date: '',
    recurrence: 'monthly' as 'once' | 'monthly' | 'quarterly' | 'yearly'
  });
  const [submittingTax, setSubmittingTax] = useState(false);

  const CATEGORIES = financeScope === 'pj' ? CATEGORIES_PJ : CATEGORIES_PF;

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
    fetchCards();
    fetchBills();
    fetchProjects();
    if (financeScope === 'pj') {
      fetchInvoices();
      fetchReceivables();
      fetchTaxes();
    }
  }, [user, financeScope]);

  const fetchProjects = async () => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');
      if (data) setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .or(`finance_scope.eq.${financeScope},finance_scope.is.null`)
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
        .or(`finance_scope.eq.${financeScope},finance_scope.is.null`)
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

  const fetchInvoices = async () => {
    try {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false });

      if (data) setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchReceivables = async () => {
    try {
      const { data } = await supabase
        .from('receivables')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (data) setReceivables(data);
    } catch (error) {
      console.error('Error fetching receivables:', error);
    }
  };

  const fetchTaxes = async () => {
    try {
      const { data } = await supabase
        .from('taxes')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (data) setTaxes(data);
    } catch (error) {
      console.error('Error fetching taxes:', error);
    }
  };

  // ---- CREATE HANDLERS ----

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
        finance_scope: financeScope,
        classification: newTransaction.classification
      };

      if (newTransaction.card_id) {
        insertData.card_id = newTransaction.card_id;
      }

      if (newTransaction.project_id) {
        insertData.project_id = newTransaction.project_id;
      }

      const { error } = await supabase.from('transactions').insert([insertData]);

      if (error) throw error;

      setNewTransaction({
        description: '',
        amount: '',
        category: CATEGORIES[0],
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        card_id: '',
        project_id: '',
        classification: 'Despesa'
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
        category: CATEGORIES[0],
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

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInvoice(true);

    try {
      const { error } = await supabase.from('invoices').insert([{
        user_id: user.id,
        invoice_number: newInvoice.invoice_number,
        description: newInvoice.description,
        amount: parseFloat(newInvoice.amount),
        type: newInvoice.type,
        status: newInvoice.status,
        issue_date: newInvoice.issue_date,
        client_name: newInvoice.client_name || null
      }]);

      if (error) throw error;

      setNewInvoice({
        invoice_number: '', description: '', amount: '',
        type: 'emitida', status: 'pendente',
        issue_date: new Date().toISOString().split('T')[0], client_name: ''
      });
      setIsInvoiceModalOpen(false);
      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Erro ao salvar nota fiscal.');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleCreateReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReceivable(true);

    try {
      const { error } = await supabase.from('receivables').insert([{
        user_id: user.id,
        client_name: newReceivable.client_name,
        description: newReceivable.description,
        amount: parseFloat(newReceivable.amount),
        due_date: newReceivable.due_date,
        status: 'pending'
      }]);

      if (error) throw error;

      setNewReceivable({ client_name: '', description: '', amount: '', due_date: '', status: 'pending' });
      setIsReceivableModalOpen(false);
      fetchReceivables();
    } catch (error) {
      console.error('Error creating receivable:', error);
      alert('Erro ao salvar conta a receber.');
    } finally {
      setSubmittingReceivable(false);
    }
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTax(true);

    try {
      const { error } = await supabase.from('taxes').insert([{
        user_id: user.id,
        tax_name: newTax.tax_name,
        description: newTax.description || null,
        amount: parseFloat(newTax.amount),
        due_date: newTax.due_date,
        recurrence: newTax.recurrence,
        status: 'pending'
      }]);

      if (error) throw error;

      setNewTax({ tax_name: '', description: '', amount: '', due_date: '', recurrence: 'monthly' });
      setIsTaxModalOpen(false);
      fetchTaxes();
    } catch (error) {
      console.error('Error creating tax:', error);
      alert('Erro ao salvar imposto.');
    } finally {
      setSubmittingTax(false);
    }
  };

  // ---- ACTION HANDLERS ----

  const handlePayBill = async (bill: Bill) => {
    try {
      const { error: updateError } = await supabase
        .from('bills')
        .update({ status: 'paid' })
        .eq('id', bill.id);

      if (updateError) throw updateError;

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
      const { error } = await supabase.from('bills').delete().eq('id', billId);
      if (error) throw error;
      fetchBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;
    try {
      await supabase.from('transactions').update({ card_id: null }).eq('card_id', cardId);
      const { error } = await supabase.from('cards').delete().eq('id', cardId);
      if (error) throw error;
      fetchCards();
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Excluir esta nota fiscal?')) return;
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleMarkReceivableReceived = async (rec: Receivable) => {
    try {
      const { error: updateError } = await supabase
        .from('receivables')
        .update({ status: 'received' })
        .eq('id', rec.id);
      if (updateError) throw updateError;

      // Auto-create income transaction
      const { error: txError } = await supabase.from('transactions').insert([{
        user_id: user.id,
        description: `Recebido: ${rec.description} (${rec.client_name})`,
        amount: rec.amount,
        category: 'Vendas',
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        finance_scope: 'pj'
      }]);
      if (txError) throw txError;

      fetchReceivables();
      fetchTransactions();
    } catch (error) {
      console.error('Error marking receivable:', error);
    }
  };

  const handleDeleteReceivable = async (id: string) => {
    if (!confirm('Excluir esta conta a receber?')) return;
    try {
      const { error } = await supabase.from('receivables').delete().eq('id', id);
      if (error) throw error;
      fetchReceivables();
    } catch (error) {
      console.error('Error deleting receivable:', error);
    }
  };

  const handlePayTax = async (tax: Tax) => {
    try {
      const { error: updateError } = await supabase
        .from('taxes')
        .update({ status: 'paid' })
        .eq('id', tax.id);
      if (updateError) throw updateError;

      const { error: txError } = await supabase.from('transactions').insert([{
        user_id: user.id,
        description: `Imposto pago: ${tax.tax_name}`,
        amount: tax.amount,
        category: 'Impostos',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        finance_scope: 'pj'
      }]);
      if (txError) throw txError;

      fetchTaxes();
      fetchTransactions();
    } catch (error) {
      console.error('Error paying tax:', error);
    }
  };

  const handleDeleteTax = async (id: string) => {
    if (!confirm('Excluir este imposto?')) return;
    try {
      const { error } = await supabase.from('taxes').delete().eq('id', id);
      if (error) throw error;
      fetchTaxes();
    } catch (error) {
      console.error('Error deleting tax:', error);
    }
  };

  // ---- HELPERS ----

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

  const getBillDisplayStatus = (bill: Bill): 'paid' | 'pending' | 'overdue' => {
    if (bill.status === 'paid') return 'paid';
    const today = new Date().toISOString().split('T')[0];
    if (bill.due_date < today && bill.status === 'pending') return 'overdue';
    return 'pending';
  };

  const getReceivableDisplayStatus = (rec: Receivable): 'received' | 'pending' | 'overdue' => {
    if (rec.status === 'received') return 'received';
    const today = new Date().toISOString().split('T')[0];
    if (rec.due_date < today && rec.status === 'pending') return 'overdue';
    return 'pending';
  };

  const getTaxDisplayStatus = (tax: Tax): 'paid' | 'pending' | 'overdue' => {
    if (tax.status === 'paid') return 'paid';
    const today = new Date().toISOString().split('T')[0];
    if (tax.due_date < today && tax.status === 'pending') return 'overdue';
    return 'pending';
  };

  // ---- CALCULATIONS ----

  const totalBalance = transactions.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  const incomeMonth = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const expenseMonth = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

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

  // PJ Calculations
  const pendingReceivablesTotal = receivables
    .filter(r => r.status !== 'received')
    .reduce((acc, r) => acc + Number(r.amount), 0);

  const pendingTaxesTotal = taxes
    .filter(t => t.status !== 'paid')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalInvoicesEmitidas = invoices
    .filter(i => i.type === 'emitida' && i.status !== 'cancelada')
    .reduce((acc, i) => acc + Number(i.amount), 0);

  // DRE
  const lucroLiquido = incomeMonth - expenseMonth;

  // Cash flow projection (next 30 days)
  const today = new Date();
  const cashFlowData = Array.from({ length: 4 }, (_, weekIndex) => {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + weekIndex * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const billsDue = bills
      .filter(b => b.status === 'pending' && b.due_date >= weekStartStr && b.due_date < weekEndStr)
      .reduce((acc, b) => acc + Number(b.amount), 0);

    const taxesDue = taxes
      .filter(t => t.status === 'pending' && t.due_date >= weekStartStr && t.due_date < weekEndStr)
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const receivablesDue = receivables
      .filter(r => r.status === 'pending' && r.due_date >= weekStartStr && r.due_date < weekEndStr)
      .reduce((acc, r) => acc + Number(r.amount), 0);

    return {
      name: `Sem ${weekIndex + 1}`,
      saidas: billsDue + taxesDue,
      entradas: receivablesDue
    };
  });

  // ---- STATUS CONFIGS ----

  const statusConfig = {
    paid: {
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      icon: <CheckCircle2 size={18} className="text-emerald-400" />,
      badge: 'bg-emerald-500/20 text-emerald-400',
      label: 'Paga'
    },
    received: {
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      icon: <CheckCircle2 size={18} className="text-emerald-400" />,
      badge: 'bg-emerald-500/20 text-emerald-400',
      label: 'Recebido'
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

  const invoiceStatusConfig: Record<string, { badge: string; label: string }> = {
    emitida: { badge: 'bg-emerald-500/20 text-emerald-400', label: 'Emitida' },
    pendente: { badge: 'bg-amber-500/20 text-amber-400', label: 'Pendente' },
    cancelada: { badge: 'bg-red-500/20 text-red-400', label: 'Cancelada' }
  };

  const recurrenceLabels: Record<string, string> = {
    once: 'Única', weekly: 'Semanal', monthly: 'Mensal', quarterly: 'Trimestral', yearly: 'Anual'
  };

  const inputClass = "w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8fb0bc]";
  const labelClass = "text-xs font-bold text-white/40 uppercase tracking-widest block mb-2";

  return (
    <div className="space-y-8 pb-10">
      {/* PF / PJ Scope Toggle */}
      <div className="flex items-center justify-center">
        <div className="flex bg-[var(--input-bg)] rounded-2xl p-1 border border-[var(--card-border)] w-fit">
          <button
            onClick={() => setFinanceScope('pf')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${financeScope === 'pf'
              ? 'bg-[#c1ff72] text-black shadow-lg shadow-[#c1ff72]/20'
              : 'text-[var(--foreground)] opacity-40 hover:opacity-100'
              }`}
          >
            <User size={16} />
            Pessoal (PF)
          </button>
          <button
            onClick={() => setFinanceScope('pj')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${financeScope === 'pj'
              ? 'bg-[#8fb0bc] text-black shadow-lg shadow-[#8fb0bc]/20'
              : 'text-[var(--foreground)] opacity-40 hover:opacity-100'
              }`}
          >
            <Building2 size={16} />
            Empresa (PJ)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-1 ${financeScope === 'pj' ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4`}>
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
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest">{financeScope === 'pj' ? 'Faturamento' : 'Receitas'} (Mês)</p>
          <h4 className="text-2xl font-bold mt-2">R$ {incomeMonth.toFixed(2)}</h4>
        </Card>
        <Card variant="orange" className="p-6 relative">
          <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
            <ArrowDownLeft size={14} />
          </div>
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Despesas (Mês)</p>
          <h4 className="text-2xl font-bold mt-2">R$ {expenseMonth.toFixed(2)}</h4>
        </Card>
        {financeScope === 'pj' && (
          <Card className={`p-6 relative border ${lucroLiquido >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="absolute top-4 right-4 bg-black/10 p-1.5 rounded-full">
              <BarChart3 size={14} />
            </div>
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Lucro Líquido</p>
            <h4 className={`text-2xl font-bold mt-2 ${lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {lucroLiquido.toFixed(2)}
            </h4>
          </Card>
        )}
        <Card className="p-6 relative bg-white/5 border-white/10 flex items-center justify-center">
          <Button
            onClick={() => setIsModalOpen(true)}
            className={`w-full h-full ${financeScope === 'pj' ? 'bg-[#8fb0bc] text-black' : 'bg-[#c1ff72] text-black'}`}
          >
            <Plus size={20} /> Nova Transação
          </Button>
        </Card>
      </div>

      {/* ============== PJ EXCLUSIVE SECTIONS ============== */}
      {financeScope === 'pj' && (
        <>
          {/* DRE Simplificado */}
          <Card className="p-6 border border-[#8fb0bc]/20">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <BarChart3 size={20} className="text-[#8fb0bc]" />
              DRE Simplificado (Mês Atual)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#161616] rounded-xl p-5 text-center">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Receita Bruta</p>
                <p className="text-2xl font-bold text-[#c1ff72]">R$ {incomeMonth.toFixed(2)}</p>
              </div>
              <div className="bg-[#161616] rounded-xl p-5 text-center flex flex-col items-center justify-center">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">(-) Despesas Totais</p>
                <p className="text-2xl font-bold text-red-400">R$ {expenseMonth.toFixed(2)}</p>
                {pendingTaxesTotal > 0 && (
                  <p className="text-[10px] text-amber-400 mt-1">+ R$ {pendingTaxesTotal.toFixed(2)} em impostos pendentes</p>
                )}
              </div>
              <div className={`rounded-xl p-5 text-center ${lucroLiquido >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">(=) Resultado</p>
                <p className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  R$ {lucroLiquido.toFixed(2)}
                </p>
                <p className="text-[10px] text-white/30 mt-1">
                  Margem: {incomeMonth > 0 ? ((lucroLiquido / incomeMonth) * 100).toFixed(1) : '0'}%
                </p>
              </div>
            </div>
          </Card>

          {/* Fluxo de Caixa Projetado */}
          <Card className="p-6 border border-[#8fb0bc]/20">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <TrendingUp size={20} className="text-[#8fb0bc]" />
              Fluxo de Caixa Projetado (Próx. 30 dias)
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} barCategoryGap="20%">
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="entradas" fill="#c1ff72" radius={[4, 4, 0, 0]} name="Entradas" />
                  <Bar dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-white/40">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#c1ff72]"></span> Entradas previstas</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500"></span> Saídas previstas</span>
            </div>
          </Card>

          {/* Notas Fiscais */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText size={20} className="text-[#8fb0bc]" />
                Notas Fiscais
                <span className="text-sm font-normal text-white/40 ml-2">
                  R$ {totalInvoicesEmitidas.toFixed(2)} emitidas
                </span>
              </h3>
              <Button size="sm" onClick={() => setIsInvoiceModalOpen(true)}>
                <Plus size={16} /> Nova NF
              </Button>
            </div>

            {invoices.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText size={40} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/40 text-sm">Nenhuma nota fiscal cadastrada.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {invoices.map(inv => {
                  const sConfig = invoiceStatusConfig[inv.status];
                  return (
                    <Card key={inv.id} className="p-4 border border-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <FileText size={18} className="text-[#8fb0bc] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm">NF #{inv.invoice_number}</p>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sConfig.badge}`}>
                              {sConfig.label}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${inv.type === 'emitida' ? 'bg-[#8fb0bc]/20 text-[#8fb0bc]' : 'bg-purple-500/20 text-purple-400'
                              }`}>
                              {inv.type === 'emitida' ? 'Emitida' : 'Recebida'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                            <span>{inv.description}</span>
                            {inv.client_name && <span>{inv.client_name}</span>}
                            <span>{inv.issue_date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-lg font-bold">R$ {Number(inv.amount).toFixed(2)}</p>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
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

          {/* Contas a Receber */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users size={20} className="text-[#c1ff72]" />
                Contas a Receber
                {pendingReceivablesTotal > 0 && (
                  <span className="text-sm font-normal text-white/40 ml-2">
                    R$ {pendingReceivablesTotal.toFixed(2)} pendente
                  </span>
                )}
              </h3>
              <Button size="sm" onClick={() => setIsReceivableModalOpen(true)}>
                <Plus size={16} /> Nova Cobrança
              </Button>
            </div>

            {receivables.length === 0 ? (
              <Card className="p-8 text-center">
                <Users size={40} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/40 text-sm">Nenhuma conta a receber cadastrada.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {receivables.map(rec => {
                  const displayStatus = getReceivableDisplayStatus(rec);
                  const config = statusConfig[displayStatus];
                  return (
                    <Card key={rec.id} className={`p-4 border ${config.bg} flex items-center justify-between gap-4`}>
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="shrink-0">{config.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm truncate">{rec.description}</p>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badge}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                            <span>{rec.client_name}</span>
                            <span>Vence: {rec.due_date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-lg font-bold">R$ {Number(rec.amount).toFixed(2)}</p>
                        {displayStatus !== 'received' && (
                          <button
                            onClick={() => handleMarkReceivableReceived(rec)}
                            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                          >
                            Receber
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReceivable(rec.id)}
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

          {/* Controle de Impostos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Landmark size={20} className="text-red-400" />
                Impostos
                {pendingTaxesTotal > 0 && (
                  <span className="text-sm font-normal text-white/40 ml-2">
                    R$ {pendingTaxesTotal.toFixed(2)} pendente
                  </span>
                )}
              </h3>
              <Button size="sm" onClick={() => setIsTaxModalOpen(true)}>
                <Plus size={16} /> Novo Imposto
              </Button>
            </div>

            {taxes.length === 0 ? (
              <Card className="p-8 text-center">
                <Landmark size={40} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/40 text-sm">Nenhum imposto cadastrado.</p>
                <p className="text-white/20 text-xs mt-1">Adicione DAS, ISS, IRPJ e outros para controlar seus vencimentos.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {taxes.map(tax => {
                  const displayStatus = getTaxDisplayStatus(tax);
                  const config = statusConfig[displayStatus];
                  return (
                    <Card key={tax.id} className={`p-4 border ${config.bg} flex items-center justify-between gap-4`}>
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="shrink-0">{config.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm truncate">{tax.tax_name}</p>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badge}`}>
                              {config.label}
                            </span>
                            {tax.recurrence !== 'once' && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-1">
                                <Repeat size={10} />
                                {recurrenceLabels[tax.recurrence]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                            <span>Vence: {tax.due_date}</span>
                            {tax.description && <span>{tax.description}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-lg font-bold">R$ {Number(tax.amount).toFixed(2)}</p>
                        {displayStatus !== 'paid' && (
                          <button
                            onClick={() => handlePayTax(tax)}
                            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                          >
                            Pagar
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTax(tax.id)}
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
        </>
      )}

      {/* ============== SHARED SECTIONS (PF + PJ) ============== */}

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
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-red-500/30 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                    style={{ opacity: undefined }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
                  >
                    <Trash2 size={14} />
                  </button>

                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm font-bold uppercase tracking-wider opacity-90">
                        {card.bank_name}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${card.card_type === 'credit'
                        ? 'bg-purple-500/30 text-purple-300'
                        : 'bg-emerald-500/30 text-emerald-300'
                        }`}>
                        {card.card_type === 'credit' ? 'Crédito' : 'Débito'}
                      </span>
                    </div>
                    <p className="text-lg font-mono tracking-[0.25em] opacity-80">
                      •••• •••• •••• {card.last_four_digits}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest opacity-50 mb-1">
                      <span>Validade {card.expiration_date}</span>
                    </div>
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
              const config = statusConfig[displayStatus];
              return (
                <Card
                  key={bill.id}
                  className={`p-4 border ${config.bg} flex items-center justify-between gap-4`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="shrink-0">{config.icon}</div>
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
                    <th className="pb-4 font-medium">Categoria / Classificação</th>
                    <th className="pb-4 font-medium">Negócio / Cartão</th>
                    <th className="pb-4 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-white/40">Nenhuma transação.</td></tr>
                  ) : transactions.slice(0, 8).map(tx => (
                    <tr key={tx.id} className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-6 text-white/40 font-medium">{tx.date}</td>
                      <td className="py-6 font-bold">
                        <div>{tx.description}</div>
                        {tx.project_id && (
                          <div className="text-[11px] text-[#8fb0bc] flex items-center gap-1 mt-0.5">
                            <Building2 size={10} /> {projects.find(p => p.id === tx.project_id)?.name || 'Negócio'}
                          </div>
                        )}
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col gap-1.5">
                          <Badge variant="status">{tx.category}</Badge>
                          {tx.classification && (
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${tx.classification === 'Custo' ? 'bg-amber-500/10 text-amber-500' :
                              tx.classification === 'Investimento' ? 'bg-blue-500/10 text-blue-400' :
                                'bg-white/5 text-white/40'
                              }`}>
                              {tx.classification}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-6 text-white/40 text-xs text-right md:text-left">
                        <div className="flex flex-col gap-1">
                          {tx.card_id ? (
                            <span className="flex items-center gap-1.5">
                              <CreditCard size={12} /> {getCardName(tx.card_id)}
                            </span>
                          ) : '—'}
                        </div>
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

      {/* ============== MODALS ============== */}

      {/* New Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-[#c1ff72]/20 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6">Nova Transação</h3>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className={labelClass}>Descrição</label>
                <input type="text" value={newTransaction.description}
                  onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className={inputClass} placeholder={financeScope === 'pj' ? 'Ex: Pagamento fornecedor, Venda...' : 'Ex: Almoço, Uber, Salário...'}
                  required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Valor (R$)</label>
                  <input type="number" step="0.01" value={newTransaction.amount}
                    onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    className={inputClass} placeholder="0.00" required />
                </div>
                <div>
                  <label className={labelClass}>Data</label>
                  <input type="date" value={newTransaction.date}
                    onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className={inputClass} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo</label>
                  <div className="flex bg-[#161616] rounded-xl p-1 border border-white/10">
                    <button type="button" onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${newTransaction.type === 'expense' ? 'bg-red-500/20 text-red-500' : 'text-white/40'}`}>
                      Saída
                    </button>
                    <button type="button" onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${newTransaction.type === 'income' ? 'bg-[#c1ff72]/20 text-[#c1ff72]' : 'text-white/40'}`}>
                      Entrada
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Categoria</label>
                  <select value={newTransaction.category}
                    onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
                    className={inputClass}>
                    {CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Classificação</label>
                  <select value={newTransaction.classification}
                    onChange={e => setNewTransaction({ ...newTransaction, classification: e.target.value as any })}
                    className={inputClass}>
                    <option value="Despesa">Despesa</option>
                    <option value="Custo">Custo</option>
                    <option value="Investimento">Investimento</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Vínculo PJ <span className="text-white/20">(opcional)</span></label>
                  <select value={newTransaction.project_id}
                    onChange={e => setNewTransaction({ ...newTransaction, project_id: e.target.value })}
                    className={inputClass}>
                    <option value="">Nenhum Vínculo</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {cards.length > 0 && (
                  <div>
                    <label className={labelClass}>Cartão <span className="text-white/20">(opcional)</span></label>
                    <select value={newTransaction.card_id}
                      onChange={e => setNewTransaction({ ...newTransaction, card_id: e.target.value })}
                      className={inputClass}>
                      <option value="">Nenhum cartão</option>
                      {cards.map(card => (
                        <option key={card.id} value={card.id}>
                          {card.bank_name} • {card.last_four_digits}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-[#c1ff72] text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#b0e666] transition-colors flex items-center justify-center gap-2">
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
            <button onClick={() => setIsCardModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard size={20} className="text-[#c1ff72]" /> Novo Cartão
            </h3>
            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className={labelClass}>Nome do Banco</label>
                <input type="text" value={newCard.bank_name}
                  onChange={e => setNewCard({ ...newCard, bank_name: e.target.value })}
                  className={inputClass} placeholder="Ex: Nubank, Itaú, Bradesco..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Últimos 4 Dígitos</label>
                  <input type="text" maxLength={4} value={newCard.last_four_digits}
                    onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 4); setNewCard({ ...newCard, last_four_digits: val }); }}
                    className={`${inputClass} font-mono tracking-widest`} placeholder="1234" required />
                </div>
                <div>
                  <label className={labelClass}>Validade (MM/AA)</label>
                  <input type="text" maxLength={5} value={newCard.expiration_date}
                    onChange={e => {
                      let val = e.target.value.replace(/[^\d/]/g, '');
                      if (val.length === 2 && !val.includes('/') && newCard.expiration_date.length < val.length) val = val + '/';
                      setNewCard({ ...newCard, expiration_date: val.slice(0, 5) });
                    }}
                    className={`${inputClass} font-mono tracking-widest`} placeholder="12/28" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo</label>
                  <div className="flex bg-[#161616] rounded-xl p-1 border border-white/10">
                    <button type="button" onClick={() => setNewCard({ ...newCard, card_type: 'credit' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${newCard.card_type === 'credit' ? 'bg-purple-500/20 text-purple-400' : 'text-white/40'}`}>
                      Crédito
                    </button>
                    <button type="button" onClick={() => setNewCard({ ...newCard, card_type: 'debit' })}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${newCard.card_type === 'debit' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40'}`}>
                      Débito
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Limite (R$)</label>
                  <input type="number" step="0.01" value={newCard.card_limit}
                    onChange={e => setNewCard({ ...newCard, card_limit: e.target.value })}
                    className={inputClass} placeholder="5000.00" />
                </div>
              </div>
              <button type="submit" disabled={submittingCard}
                className="w-full bg-[#c1ff72] text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#b0e666] transition-colors flex items-center justify-center gap-2">
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
            <button onClick={() => setIsBillModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CalendarClock size={20} className="text-[#e6a06e]" /> Nova Conta
            </h3>
            <form onSubmit={handleCreateBill} className="space-y-4">
              <div>
                <label className={labelClass}>Descrição</label>
                <input type="text" value={newBill.description}
                  onChange={e => setNewBill({ ...newBill, description: e.target.value })}
                  className={inputClass} placeholder={financeScope === 'pj' ? 'Ex: Aluguel escritório, Contador...' : 'Ex: Aluguel, Internet, Luz...'} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Valor (R$)</label>
                  <input type="number" step="0.01" value={newBill.amount}
                    onChange={e => setNewBill({ ...newBill, amount: e.target.value })}
                    className={inputClass} placeholder="0.00" required />
                </div>
                <div>
                  <label className={labelClass}>Vencimento</label>
                  <input type="date" value={newBill.due_date}
                    onChange={e => setNewBill({ ...newBill, due_date: e.target.value })}
                    className={inputClass} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Recorrência</label>
                  <div className="flex bg-[#161616] rounded-xl p-1 border border-white/10">
                    <button type="button" onClick={() => setNewBill({ ...newBill, recurrence: 'once' })}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newBill.recurrence === 'once' ? 'bg-[#e6a06e]/20 text-[#e6a06e]' : 'text-white/40'}`}>
                      Única
                    </button>
                    <button type="button" onClick={() => setNewBill({ ...newBill, recurrence: 'weekly' })}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newBill.recurrence === 'weekly' ? 'bg-[#e6a06e]/20 text-[#e6a06e]' : 'text-white/40'}`}>
                      Semanal
                    </button>
                    <button type="button" onClick={() => setNewBill({ ...newBill, recurrence: 'monthly' })}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newBill.recurrence === 'monthly' ? 'bg-[#e6a06e]/20 text-[#e6a06e]' : 'text-white/40'}`}>
                      Mensal
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Categoria</label>
                  <select value={newBill.category}
                    onChange={e => setNewBill({ ...newBill, category: e.target.value })}
                    className={inputClass}>
                    {CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
              </div>
              {cards.length > 0 && (
                <div>
                  <label className={labelClass}>Cartão <span className="text-white/20">(opcional)</span></label>
                  <select value={newBill.card_id}
                    onChange={e => setNewBill({ ...newBill, card_id: e.target.value })}
                    className={inputClass}>
                    <option value="">Nenhum cartão</option>
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.bank_name} •••• {card.last_four_digits} ({card.card_type === 'credit' ? 'Crédito' : 'Débito'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" disabled={submittingBill}
                className="w-full bg-[#e6a06e] text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#d4905e] transition-colors flex items-center justify-center gap-2">
                {submittingBill ? <Loader2 size={18} className="animate-spin" /> : <><CalendarClock size={18} /> Adicionar Conta</>}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* New Invoice Modal (PJ) */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-[#8fb0bc]/20 relative">
            <button onClick={() => setIsInvoiceModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FileText size={20} className="text-[#8fb0bc]" /> Nova Nota Fiscal
            </h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nº da NF</label>
                  <input type="text" value={newInvoice.invoice_number}
                    onChange={e => setNewInvoice({ ...newInvoice, invoice_number: e.target.value })}
                    className={inputClass} placeholder="001" required />
                </div>
                <div>
                  <label className={labelClass}>Cliente</label>
                  <input type="text" value={newInvoice.client_name}
                    onChange={e => setNewInvoice({ ...newInvoice, client_name: e.target.value })}
                    className={inputClass} placeholder="Nome do cliente" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <input type="text" value={newInvoice.description}
                  onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })}
                  className={inputClass} placeholder="Serviço prestado..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Valor (R$)</label>
                  <input type="number" step="0.01" value={newInvoice.amount}
                    onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    className={inputClass} placeholder="0.00" required />
                </div>
                <div>
                  <label className={labelClass}>Data Emissão</label>
                  <input type="date" value={newInvoice.issue_date}
                    onChange={e => setNewInvoice({ ...newInvoice, issue_date: e.target.value })}
                    className={inputClass} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo</label>
                  <div className="flex bg-[#161616] rounded-xl p-1 border border-white/10">
                    <button type="button" onClick={() => setNewInvoice({ ...newInvoice, type: 'emitida' })}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newInvoice.type === 'emitida' ? 'bg-[#8fb0bc]/20 text-[#8fb0bc]' : 'text-white/40'}`}>
                      Emitida
                    </button>
                    <button type="button" onClick={() => setNewInvoice({ ...newInvoice, type: 'recebida' })}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newInvoice.type === 'recebida' ? 'bg-purple-500/20 text-purple-400' : 'text-white/40'}`}>
                      Recebida
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={newInvoice.status}
                    onChange={e => setNewInvoice({ ...newInvoice, status: e.target.value as any })}
                    className={inputClass}>
                    <option value="pendente">Pendente</option>
                    <option value="emitida">Emitida</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={submittingInvoice}
                className="w-full bg-[#8fb0bc] text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#7da0ac] transition-colors flex items-center justify-center gap-2">
                {submittingInvoice ? <Loader2 size={18} className="animate-spin" /> : <><FileText size={18} /> Adicionar NF</>}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* New Receivable Modal (PJ) */}
      {isReceivableModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-[#c1ff72]/20 relative">
            <button onClick={() => setIsReceivableModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users size={20} className="text-[#c1ff72]" /> Nova Conta a Receber
            </h3>
            <form onSubmit={handleCreateReceivable} className="space-y-4">
              <div>
                <label className={labelClass}>Cliente</label>
                <input type="text" value={newReceivable.client_name}
                  onChange={e => setNewReceivable({ ...newReceivable, client_name: e.target.value })}
                  className={inputClass} placeholder="Nome do cliente" required />
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <input type="text" value={newReceivable.description}
                  onChange={e => setNewReceivable({ ...newReceivable, description: e.target.value })}
                  className={inputClass} placeholder="Ex: Projeto website, Consultoria..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Valor (R$)</label>
                  <input type="number" step="0.01" value={newReceivable.amount}
                    onChange={e => setNewReceivable({ ...newReceivable, amount: e.target.value })}
                    className={inputClass} placeholder="0.00" required />
                </div>
                <div>
                  <label className={labelClass}>Vencimento</label>
                  <input type="date" value={newReceivable.due_date}
                    onChange={e => setNewReceivable({ ...newReceivable, due_date: e.target.value })}
                    className={inputClass} required />
                </div>
              </div>
              <button type="submit" disabled={submittingReceivable}
                className="w-full bg-[#c1ff72] text-black font-bold py-4 rounded-xl mt-4 hover:bg-[#b0e666] transition-colors flex items-center justify-center gap-2">
                {submittingReceivable ? <Loader2 size={18} className="animate-spin" /> : <><Users size={18} /> Adicionar Cobrança</>}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* New Tax Modal (PJ) */}
      {isTaxModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-red-500/20 relative">
            <button onClick={() => setIsTaxModalOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Landmark size={20} className="text-red-400" /> Novo Imposto
            </h3>
            <form onSubmit={handleCreateTax} className="space-y-4">
              <div>
                <label className={labelClass}>Nome do Imposto</label>
                <input type="text" value={newTax.tax_name}
                  onChange={e => setNewTax({ ...newTax, tax_name: e.target.value })}
                  className={inputClass} placeholder="Ex: DAS, ISS, IRPJ..." required />
              </div>
              <div>
                <label className={labelClass}>Descrição <span className="text-white/20">(opcional)</span></label>
                <input type="text" value={newTax.description}
                  onChange={e => setNewTax({ ...newTax, description: e.target.value })}
                  className={inputClass} placeholder="Ex: Simples Nacional competência Jan/2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Valor (R$)</label>
                  <input type="number" step="0.01" value={newTax.amount}
                    onChange={e => setNewTax({ ...newTax, amount: e.target.value })}
                    className={inputClass} placeholder="0.00" required />
                </div>
                <div>
                  <label className={labelClass}>Vencimento</label>
                  <input type="date" value={newTax.due_date}
                    onChange={e => setNewTax({ ...newTax, due_date: e.target.value })}
                    className={inputClass} required />
                </div>
              </div>
              <div>
                <label className={labelClass}>Recorrência</label>
                <div className="flex bg-[#161616] rounded-xl p-1 border border-white/10">
                  {(['once', 'monthly', 'quarterly', 'yearly'] as const).map(rec => (
                    <button key={rec} type="button" onClick={() => setNewTax({ ...newTax, recurrence: rec })}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${newTax.recurrence === rec ? 'bg-red-500/20 text-red-400' : 'text-white/40'}`}>
                      {recurrenceLabels[rec]}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={submittingTax}
                className="w-full bg-red-500 text-white font-bold py-4 rounded-xl mt-4 hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                {submittingTax ? <Loader2 size={18} className="animate-spin" /> : <><Landmark size={18} /> Adicionar Imposto</>}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
