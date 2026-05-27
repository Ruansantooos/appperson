/**
 * Exportação de dados financeiros — CSV (dados crus) e PDF (relatório).
 * O jsPDF é carregado sob demanda (dynamic import) para não pesar o bundle.
 */
import type { Transaction } from '../types';
import { toLocalDateStr } from './date';

interface CategoryDatum {
  name: string;
  value: number;
}

interface FinanceExportData {
  scope: 'pf' | 'pj';
  transactions: Transaction[];
  totalBalance: number;
  incomeMonth: number;
  expenseMonth: number;
  categoryData: CategoryDatum[];
  getCardName?: (cardId?: string) => string;
}

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const scopeLabel = (scope: 'pf' | 'pj') => (scope === 'pj' ? 'PJ' : 'PF');

/** Escapa um campo para CSV (aspas, vírgulas, quebras de linha). */
const csvCell = (value: unknown): string => {
  const s = value == null ? '' : String(value);
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/** Exporta as transações em CSV (separador ";", compatível com Excel pt-BR). */
export function exportTransactionsCSV(data: FinanceExportData) {
  const { transactions, scope, getCardName } = data;
  const header = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Classificação', 'Cartão', 'Valor (R$)'];

  const rows = transactions.map((tx) => [
    tx.date,
    tx.description,
    tx.type === 'income' ? 'Receita' : 'Despesa',
    tx.category,
    tx.classification || '',
    getCardName && tx.card_id ? getCardName(tx.card_id) : '',
    Number(tx.amount).toFixed(2).replace('.', ','),
  ]);

  const lines = [header, ...rows].map((cols) => cols.map(csvCell).join(';'));
  // BOM para o Excel reconhecer UTF-8 (acentos).
  const csv = '﻿' + lines.join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `corelys-financas-${scopeLabel(scope).toLowerCase()}-${toLocalDateStr()}.csv`);
}

/** Gera um relatório PDF com resumo + tabela de transações. */
export async function exportFinancePDF(data: FinanceExportData) {
  const { scope, transactions, totalBalance, incomeMonth, expenseMonth, categoryData, getCardName } = data;

  // Carregado só no clique para manter o bundle leve.
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const brand: [number, number, number] = [12, 12, 12];
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(...brand);
  doc.text('Corelys', 14, 20);
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(`Relatório Financeiro (${scopeLabel(scope)})`, 14, 27);
  doc.text(`Gerado em ${today}`, 14, 33);

  // Resumo
  autoTable(doc, {
    startY: 40,
    head: [['Resumo', 'Valor']],
    body: [
      ['Saldo total', brl(totalBalance)],
      [scope === 'pj' ? 'Faturamento (mês)' : 'Receitas (mês)', brl(incomeMonth)],
      ['Despesas (mês)', brl(expenseMonth)],
      ['Resultado (mês)', brl(incomeMonth - expenseMonth)],
    ],
    theme: 'grid',
    headStyles: { fillColor: brand },
    styles: { fontSize: 10 },
  });

  // Gastos por categoria
  if (categoryData.length > 0) {
    autoTable(doc, {
      head: [['Categoria', 'Total gasto']],
      body: categoryData.map((c) => [c.name, brl(Number(c.value))]),
      theme: 'striped',
      headStyles: { fillColor: brand },
      styles: { fontSize: 10 },
    });
  }

  // Transações
  autoTable(doc, {
    head: [['Data', 'Descrição', 'Categoria', 'Cartão', 'Valor']],
    body: transactions.map((tx) => [
      tx.date,
      tx.description,
      tx.category,
      getCardName && tx.card_id ? getCardName(tx.card_id) : '—',
      `${tx.type === 'income' ? '+' : '-'} ${brl(Number(tx.amount))}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: brand },
    styles: { fontSize: 9 },
    columnStyles: { 4: { halign: 'right' } },
  });

  doc.save(`corelys-financas-${scopeLabel(scope).toLowerCase()}-${toLocalDateStr()}.pdf`);
}
