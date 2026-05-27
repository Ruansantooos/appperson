// Assistente Corelys — agente de IA in-app (substitui o fluxo do n8n).
//
// SEGURANÇA (a grande mudança vs. n8n):
//   - Roda com o JWT do usuário autenticado -> o RLS do Supabase é aplicado.
//   - O user_id vem do token validado, NUNCA do modelo. As tools não recebem userId.
//   - A SERVICE_ROLE key não é usada aqui. Um bug/prompt-injection não vaza dados
//     entre usuários, porque o banco só devolve as linhas do próprio usuário.
//
// Secrets (Supabase > Edge Functions > Secrets):
//   ANTHROPIC_API_KEY        (sua chave da Claude API)
//   (SUPABASE_URL e SUPABASE_ANON_KEY são injetados automaticamente)
//
// Request (POST, com header Authorization: Bearer <access_token> do usuário):
//   { "messages": [{ "role": "user", "content": "marca o treino de hoje" }, ...],
//     "today": "2026-05-27",            // opcional: data local do cliente (YYYY-MM-DD)
//     "now": "2026-05-27T14:30:00-03:00" // opcional: instante local do cliente (ISO)
//   }
// Response: { "reply": "..." }

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Opus 4.7 por padrão. Para um assistente de CRUD sensível a custo, troque por
// 'claude-haiku-4-5' (mais barato/rápido) — basta alterar esta linha.
const MODEL = 'claude-opus-4-7';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MAX_ITERS = 8;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Contexto de data/hora (usa o relógio LOCAL do cliente quando enviado, para
// "hoje"/"amanhã" baterem com o fuso do usuário; cai para o servidor se ausente).
// ---------------------------------------------------------------------------
interface Ctx {
  now: Date;
  today: string; // YYYY-MM-DD (local)
}

function dayBoundsISO(now: Date): [string, string] {
  const s = new Date(now); s.setHours(0, 0, 0, 0);
  const e = new Date(now); e.setHours(23, 59, 59, 999);
  return [s.toISOString(), e.toISOString()];
}
const fmtD = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
const fmtT = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const id8 = (id: string) => (id ?? '').substring(0, 8);

// ---------------------------------------------------------------------------
// Tools — cada uma roda escopada ao usuário (RLS) via o client `sb`.
// ---------------------------------------------------------------------------
interface Tool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  handler: (input: any, sb: SupabaseClient, userId: string, ctx: Ctx) => Promise<string>;
}

const str = (d: string) => ({ type: 'string', description: d });
const obj = (props: Record<string, unknown>, required: string[] = []) => ({
  type: 'object', properties: props, required,
});

const TOOLS: Tool[] = [
  // ---------------- Agenda ----------------
  {
    name: 'criar_evento',
    description: 'Criar evento no calendário. Requer titulo e dataInicio (ISO 8601). Opcionais: dataFim, categoria (Work/Personal/Health/Finance), local.',
    input_schema: obj({
      titulo: str('Título do evento'),
      dataInicio: str('Data/hora de início, ISO 8601'),
      dataFim: str('Data/hora de fim, ISO 8601'),
      categoria: str('Work, Personal, Health ou Finance'),
      local: str('Local do evento'),
    }, ['titulo', 'dataInicio']),
    handler: async (i, sb, userId) => {
      const end = i.dataFim || new Date(new Date(i.dataInicio).getTime() + 3600000).toISOString();
      const { error } = await sb.from('calendar_events').insert({
        user_id: userId, title: i.titulo, start_time: i.dataInicio, end_time: end,
        category: i.categoria || 'Personal', location: i.local || null,
      });
      if (error) throw error;
      return 'Evento criado: ' + i.titulo;
    },
  },
  {
    name: 'listar_eventos',
    description: 'Listar eventos da agenda. Opcional: periodo (hoje/semana/mes).',
    input_schema: obj({ periodo: str('hoje, semana ou mes') }),
    handler: async (i, sb, userId, ctx) => {
      const now = ctx.now, p = i.periodo || 'hoje';
      let sd: string, ed: string;
      if (p === 'hoje') {
        [sd, ed] = dayBoundsISO(now);
      } else if (p === 'semana') {
        const dw = now.getDay();
        sd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dw).toISOString();
        ed = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - dw)).toISOString();
      } else {
        sd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        ed = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      }
      const { data, error } = await sb.from('calendar_events')
        .select('title,start_time,category')
        .eq('user_id', userId).gte('start_time', sd).lte('start_time', ed)
        .order('start_time', { ascending: true });
      if (error) throw error;
      if (!data?.length) return 'Nenhum evento para ' + p + '.';
      return data.map((e) => `- ${e.title} | ${fmtD(e.start_time)} ${fmtT(e.start_time)} | ${e.category || ''}`).join('\n');
    },
  },
  {
    name: 'editar_evento',
    description: 'Editar evento. Requer eventoId. Opcionais: titulo, dataInicio, dataFim, categoria, local.',
    input_schema: obj({
      eventoId: str('ID do evento'), titulo: str('Novo título'),
      dataInicio: str('Nova data início'), dataFim: str('Nova data fim'),
      categoria: str('Nova categoria'), local: str('Novo local'),
    }, ['eventoId']),
    handler: async (i, sb, userId) => {
      const u: Record<string, unknown> = {};
      if (i.titulo) u.title = i.titulo;
      if (i.dataInicio) u.start_time = i.dataInicio;
      if (i.dataFim) u.end_time = i.dataFim;
      if (i.categoria) u.category = i.categoria;
      if (i.local) u.location = i.local;
      const { data, error } = await sb.from('calendar_events').update(u)
        .eq('id', i.eventoId).eq('user_id', userId).select('title');
      if (error) throw error;
      return data?.length ? 'Evento atualizado: ' + data[0].title : 'Evento não encontrado.';
    },
  },
  {
    name: 'deletar_evento',
    description: 'Cancelar/remover evento. Requer eventoId.',
    input_schema: obj({ eventoId: str('ID do evento') }, ['eventoId']),
    handler: async (i, sb, userId) => {
      const { error } = await sb.from('calendar_events').delete().eq('id', i.eventoId).eq('user_id', userId);
      if (error) throw error;
      return 'Evento cancelado.';
    },
  },
  // ---------------- Tarefas ----------------
  {
    name: 'criar_tarefa',
    description: 'Criar tarefa. Requer titulo. Opcionais: descricao, prioridade (High/Medium/Low), categoria, data_entrega (ISO).',
    input_schema: obj({
      titulo: str('Título'), descricao: str('Descrição'),
      prioridade: str('High, Medium ou Low'), categoria: str('Categoria'),
      data_entrega: str('Data de entrega, ISO 8601'),
    }, ['titulo']),
    handler: async (i, sb, userId) => {
      const { error } = await sb.from('tasks').insert({
        user_id: userId, title: i.titulo, description: i.descricao || null,
        priority: i.prioridade || 'Medium', status: 'Pending',
        category: i.categoria || 'Geral', due_date: i.data_entrega || null,
      });
      if (error) throw error;
      return `Tarefa criada: ${i.titulo} | ${i.prioridade || 'Medium'}`;
    },
  },
  {
    name: 'listar_tarefas',
    description: 'Listar tarefas. Opcionais: status (Pending/Completed/all), prioridade.',
    input_schema: obj({ status: str('Pending, Completed ou all'), prioridade: str('Filtro de prioridade') }),
    handler: async (i, sb, userId) => {
      let q = sb.from('tasks').select('id,title,priority,status,due_date,category')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
      if (i.status && i.status !== 'all') q = q.eq('status', i.status);
      if (i.prioridade) q = q.eq('priority', i.prioridade);
      const { data, error } = await q;
      if (error) throw error;
      if (!data?.length) return 'Nenhuma tarefa encontrada.';
      return data.map((x) => {
        const d = x.due_date ? fmtD(x.due_date) : 'sem prazo';
        const ic = x.status === 'Completed' ? '✅' : x.priority === 'High' ? '🔴' : x.priority === 'Medium' ? '🟡' : '🟢';
        return `${ic} ${x.title} | ${x.priority} | ${d} | ID: ${id8(x.id)}`;
      }).join('\n');
    },
  },
  {
    name: 'completar_tarefa',
    description: 'Concluir tarefa. Requer tarefaId.',
    input_schema: obj({ tarefaId: str('ID da tarefa') }, ['tarefaId']),
    handler: async (i, sb, userId) => {
      const { data, error } = await sb.from('tasks').update({ status: 'Completed' })
        .eq('id', i.tarefaId).eq('user_id', userId).select('title');
      if (error) throw error;
      return data?.length ? `Tarefa "${data[0].title}" concluída!` : 'Tarefa não encontrada.';
    },
  },
  {
    name: 'editar_tarefa',
    description: 'Editar tarefa. Requer tarefaId. Opcionais: titulo, descricao, prioridade, categoria, data_entrega.',
    input_schema: obj({
      tarefaId: str('ID da tarefa'), titulo: str('Novo título'), descricao: str('Nova descrição'),
      prioridade: str('Nova prioridade'), categoria: str('Nova categoria'), data_entrega: str('Nova data'),
    }, ['tarefaId']),
    handler: async (i, sb, userId) => {
      const u: Record<string, unknown> = {};
      if (i.titulo) u.title = i.titulo;
      if (i.descricao) u.description = i.descricao;
      if (i.prioridade) u.priority = i.prioridade;
      if (i.categoria) u.category = i.categoria;
      if (i.data_entrega) u.due_date = i.data_entrega;
      const { data, error } = await sb.from('tasks').update(u)
        .eq('id', i.tarefaId).eq('user_id', userId).select('title');
      if (error) throw error;
      return data?.length ? `Tarefa "${data[0].title}" atualizada.` : 'Tarefa não encontrada.';
    },
  },
  {
    name: 'deletar_tarefa',
    description: 'Remover tarefa. Requer tarefaId.',
    input_schema: obj({ tarefaId: str('ID da tarefa') }, ['tarefaId']),
    handler: async (i, sb, userId) => {
      const { error } = await sb.from('tasks').delete().eq('id', i.tarefaId).eq('user_id', userId);
      if (error) throw error;
      return 'Tarefa removida.';
    },
  },
  // ---------------- Notas ----------------
  {
    name: 'criar_nota',
    description: 'Criar nota. Requer conteudo. Opcional: titulo.',
    input_schema: obj({ titulo: str('Título'), conteudo: str('Conteúdo') }, ['conteudo']),
    handler: async (i, sb, userId) => {
      const { error } = await sb.from('notes').insert({
        user_id: userId, title: i.titulo || 'Nota rápida', content: i.conteudo,
      });
      if (error) throw error;
      return `Nota criada: "${i.titulo || 'Nota rápida'}"`;
    },
  },
  {
    name: 'buscar_notas',
    description: 'Buscar notas. Opcional: busca (texto).',
    input_schema: obj({ busca: str('Texto para buscar') }),
    handler: async (i, sb, userId) => {
      const { data, error } = await sb.from('notes').select('id,title,content,created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      let rows = data || [];
      if (i.busca) {
        const t = i.busca.toLowerCase();
        rows = rows.filter((x) => (x.title?.toLowerCase().includes(t)) || (x.content?.toLowerCase().includes(t)));
      }
      if (!rows.length) return 'Nenhuma nota encontrada.';
      return rows.map((x) => `📝 ${x.title || 'Sem título'} | ${(x.content || '').substring(0, 80)} | ID: ${id8(x.id)}`).join('\n');
    },
  },
  {
    name: 'editar_nota',
    description: 'Editar nota. Requer notaId. Opcionais: titulo, conteudo.',
    input_schema: obj({ notaId: str('ID da nota'), titulo: str('Novo título'), conteudo: str('Novo conteúdo') }, ['notaId']),
    handler: async (i, sb, userId) => {
      const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (i.titulo) u.title = i.titulo;
      if (i.conteudo) u.content = i.conteudo;
      const { data, error } = await sb.from('notes').update(u).eq('id', i.notaId).eq('user_id', userId).select('title');
      if (error) throw error;
      return data?.length ? `Nota "${data[0].title}" atualizada.` : 'Nota não encontrada.';
    },
  },
  {
    name: 'deletar_nota',
    description: 'Remover nota. Requer notaId.',
    input_schema: obj({ notaId: str('ID da nota') }, ['notaId']),
    handler: async (i, sb, userId) => {
      const { error } = await sb.from('notes').delete().eq('id', i.notaId).eq('user_id', userId);
      if (error) throw error;
      return 'Nota removida.';
    },
  },
  // ---------------- Hábitos ----------------
  {
    name: 'criar_habito',
    description: 'Criar hábito. Requer nome. Opcional: meta.',
    input_schema: obj({ nome: str('Nome do hábito'), meta: str('Meta, ex: todos os dias, 3x por semana') }, ['nome']),
    handler: async (i, sb, userId) => {
      const { error } = await sb.from('habits').insert({
        user_id: userId, name: i.nome, target: i.meta || 'todos os dias',
        streak: 0, best_streak: 0, progress: 0, completed_today: false,
      });
      if (error) throw error;
      return `Hábito criado: "${i.nome}" | Meta: ${i.meta || 'todos os dias'}`;
    },
  },
  {
    name: 'listar_habitos',
    description: 'Listar hábitos com streaks.',
    input_schema: obj({}),
    handler: async (_i, sb, userId) => {
      const { data, error } = await sb.from('habits')
        .select('id,name,streak,best_streak,target,completed_today')
        .eq('user_id', userId).order('created_at', { ascending: true });
      if (error) throw error;
      if (!data?.length) return 'Nenhum hábito cadastrado.';
      return data.map((x) => `${x.completed_today ? '✅' : '⬜'} ${x.name} | Streak: ${x.streak}🔥 (melhor: ${x.best_streak}) | Meta: ${x.target} | ID: ${id8(x.id)}`).join('\n');
    },
  },
  {
    name: 'marcar_habito',
    description: 'Marcar hábito como feito hoje. Requer habitoId.',
    input_schema: obj({ habitoId: str('ID do hábito') }, ['habitoId']),
    handler: async (i, sb, userId, ctx) => {
      const { data, error } = await sb.from('habits').select('*').eq('id', i.habitoId).eq('user_id', userId);
      if (error) throw error;
      const h = data?.[0];
      if (!h) return 'Hábito não encontrado.';
      if (h.completed_today) return `"${h.name}" já marcado hoje!`;
      const ns = h.streak + 1, nb = Math.max(ns, h.best_streak);
      await sb.from('habit_logs').insert({ habit_id: i.habitoId, user_id: userId, date: ctx.today, completed: true });
      const { error: e2 } = await sb.from('habits').update({ completed_today: true, streak: ns, best_streak: nb })
        .eq('id', i.habitoId).eq('user_id', userId);
      if (e2) throw e2;
      return `"${h.name}" marcado! Streak: ${ns}🔥 (melhor: ${nb})`;
    },
  },
  {
    name: 'deletar_habito',
    description: 'Remover hábito. Requer habitoId.',
    input_schema: obj({ habitoId: str('ID do hábito') }, ['habitoId']),
    handler: async (i, sb, userId) => {
      const { error } = await sb.from('habits').delete().eq('id', i.habitoId).eq('user_id', userId);
      if (error) throw error;
      return 'Hábito removido.';
    },
  },
  // ---------------- Finanças ----------------
  {
    name: 'registrar_gasto',
    description: 'Registrar despesa. Requer descricao e valor. Opcionais: categoria, escopo (pf/pj), data (YYYY-MM-DD).',
    input_schema: obj({
      descricao: str('Descrição'), valor: str('Valor numérico'), categoria: str('Categoria'),
      escopo: str('pf ou pj'), data: str('Data YYYY-MM-DD'),
    }, ['descricao', 'valor']),
    handler: async (i, sb, userId, ctx) => {
      const amt = Math.abs(parseFloat(i.valor));
      const { error } = await sb.from('transactions').insert({
        user_id: userId, description: i.descricao, amount: amt, type: 'expense',
        category: i.categoria || 'Outros', finance_scope: i.escopo || 'pf', date: i.data || ctx.today,
      });
      if (error) throw error;
      return `Gasto: ${i.descricao} | R$ ${amt.toFixed(2)} | ${i.categoria || 'Outros'}`;
    },
  },
  {
    name: 'registrar_receita',
    description: 'Registrar receita. Requer descricao e valor. Opcionais: categoria, escopo (pf/pj), data (YYYY-MM-DD).',
    input_schema: obj({
      descricao: str('Descrição'), valor: str('Valor numérico'), categoria: str('Categoria'),
      escopo: str('pf ou pj'), data: str('Data YYYY-MM-DD'),
    }, ['descricao', 'valor']),
    handler: async (i, sb, userId, ctx) => {
      const amt = Math.abs(parseFloat(i.valor));
      const { error } = await sb.from('transactions').insert({
        user_id: userId, description: i.descricao, amount: amt, type: 'income',
        category: i.categoria || 'Outros', finance_scope: i.escopo || 'pf', date: i.data || ctx.today,
      });
      if (error) throw error;
      return `Receita: ${i.descricao} | R$ ${amt.toFixed(2)} | ${i.categoria || 'Outros'}`;
    },
  },
  {
    name: 'listar_transacoes',
    description: 'Listar transações. Opcionais: periodo (hoje/semana/mes), tipo (income/expense), categoria, escopo (pf/pj).',
    input_schema: obj({ periodo: str('hoje, semana ou mes'), tipo: str('income ou expense'), categoria: str('Categoria'), escopo: str('pf ou pj') }),
    handler: async (i, sb, userId, ctx) => {
      const now = ctx.now, p = i.periodo || 'mes';
      let sd: string;
      if (p === 'hoje') sd = ctx.today;
      else if (p === 'semana') { const d = new Date(now); d.setDate(d.getDate() - 7); sd = d.toISOString().split('T')[0]; }
      else sd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      let q = sb.from('transactions').select('description,amount,type,category,date,finance_scope')
        .eq('user_id', userId).gte('date', sd).order('date', { ascending: false }).limit(20);
      if (i.tipo) q = q.eq('type', i.tipo);
      if (i.categoria) q = q.eq('category', i.categoria);
      if (i.escopo) q = q.eq('finance_scope', i.escopo);
      const { data, error } = await q;
      if (error) throw error;
      if (!data?.length) return `Nenhuma transação (${p}).`;
      let ti = 0, to = 0;
      const lines = data.map((t) => {
        if (t.type === 'income') ti += t.amount; else to += t.amount;
        return `${t.type === 'income' ? '💚' : '🔴'} ${t.description} | R$ ${t.amount.toFixed(2)} | ${t.category}`;
      });
      lines.push(`\n📊 Receitas: R$ ${ti.toFixed(2)} | Gastos: R$ ${to.toFixed(2)} | Saldo: R$ ${(ti - to).toFixed(2)}`);
      return lines.join('\n');
    },
  },
  {
    name: 'resumo_financeiro',
    description: 'Resumo financeiro do mês. Opcional: escopo (pf/pj).',
    input_schema: obj({ escopo: str('pf ou pj') }),
    handler: async (i, sb, userId, ctx) => {
      const now = ctx.now;
      const sd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const ed = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      let q = sb.from('transactions').select('amount,type,category').eq('user_id', userId).gte('date', sd).lte('date', ed);
      if (i.escopo) q = q.eq('finance_scope', i.escopo);
      const { data, error } = await q;
      if (error) throw error;
      let ti = 0, to = 0; const cats: Record<string, number> = {};
      (data || []).forEach((t) => { if (t.type === 'income') ti += t.amount; else { to += t.amount; cats[t.category] = (cats[t.category] || 0) + t.amount; } });
      const tc = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5).map((e) => `  - ${e[0]}: R$ ${e[1].toFixed(2)}`).join('\n');
      return `Resumo Financeiro\n\n💚 Receitas: R$ ${ti.toFixed(2)}\n🔴 Despesas: R$ ${to.toFixed(2)}\n📊 Saldo: R$ ${(ti - to).toFixed(2)}\n\nTop gastos:\n${tc || '  Nenhum'}`;
    },
  },
  {
    name: 'listar_contas',
    description: 'Listar contas a pagar. Opcionais: status (pending/paid/overdue), escopo (pf/pj).',
    input_schema: obj({ status: str('pending, paid ou overdue'), escopo: str('pf ou pj') }),
    handler: async (i, sb, userId) => {
      let q = sb.from('bills').select('id,description,amount,due_date,status,category,finance_scope')
        .eq('user_id', userId).order('due_date', { ascending: true }).limit(15);
      if (i.status) q = q.eq('status', i.status);
      if (i.escopo) q = q.eq('finance_scope', i.escopo);
      const { data, error } = await q;
      if (error) throw error;
      if (!data?.length) return 'Nenhuma conta encontrada.';
      return data.map((x) => {
        const ic = x.status === 'paid' ? '✅' : x.status === 'overdue' ? '⚠️' : '📋';
        return `${ic} ${x.description} | R$ ${x.amount.toFixed(2)} | Venc: ${fmtD(x.due_date)} | ${x.status} | ID: ${id8(x.id)}`;
      }).join('\n');
    },
  },
  {
    name: 'pagar_conta',
    description: 'Marcar conta como paga. Requer contaId.',
    input_schema: obj({ contaId: str('ID da conta') }, ['contaId']),
    handler: async (i, sb, userId) => {
      const { data, error } = await sb.from('bills').update({ status: 'paid' })
        .eq('id', i.contaId).eq('user_id', userId).select('description');
      if (error) throw error;
      return data?.length ? `Conta "${data[0].description}" paga!` : 'Conta não encontrada.';
    },
  },
  // ---------------- Academia ----------------
  {
    name: 'listar_treinos',
    description: 'Listar treinos cadastrados.',
    input_schema: obj({}),
    handler: async (_i, sb, userId) => {
      const { data, error } = await sb.from('workouts').select('id,name,day_of_week,muscle_group')
        .eq('user_id', userId).order('created_at', { ascending: true });
      if (error) throw error;
      if (!data?.length) return 'Nenhum treino cadastrado.';
      return data.map((x) => `🏋 ${x.name} | ${x.day_of_week || 'Sem dia'} | ${x.muscle_group || ''} | ID: ${id8(x.id)}`).join('\n');
    },
  },
  {
    name: 'treino_do_dia',
    description: 'Ver o treino de hoje, com exercícios.',
    input_schema: obj({}),
    handler: async (_i, sb, userId, ctx) => {
      const days = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
      const today = days[ctx.now.getDay()];
      const { data: w, error } = await sb.from('workouts').select('id,name,muscle_group')
        .eq('user_id', userId).eq('day_of_week', today);
      if (error) throw error;
      if (!w?.length) return `Nenhum treino para hoje (${today}).`;
      const { data: ex } = await sb.from('workout_exercises').select('name,sets,reps,weight')
        .eq('workout_id', w[0].id).order('order_index', { ascending: true });
      let r = `🏋 Treino de ${today}: ${w[0].name}\n\n`;
      r += ex?.length
        ? ex.map((e, idx) => `${idx + 1}. ${e.name} | ${e.sets || '?'}x${e.reps || '?'} | ${e.weight || '-'}kg`).join('\n')
        : 'Nenhum exercício cadastrado.';
      return r;
    },
  },
  {
    name: 'registrar_peso',
    description: 'Registrar peso atual em kg. Requer peso.',
    input_schema: obj({ peso: str('Peso em kg') }, ['peso']),
    handler: async (i, sb, userId, ctx) => {
      const p = parseFloat(i.peso);
      await sb.from('weight_history').insert({ user_id: userId, weight: p, date: ctx.today });
      const { data: s } = await sb.from('gym_stats').select('id').eq('user_id', userId);
      if (s?.length) await sb.from('gym_stats').update({ weight: p, updated_at: new Date().toISOString() }).eq('user_id', userId);
      else await sb.from('gym_stats').insert({ user_id: userId, weight: p });
      return `Peso registrado: ${p}kg`;
    },
  },
  // ---------------- Nutrição ----------------
  {
    name: 'registrar_refeicao',
    description: 'Registrar refeição. Requer nome. Opcionais: calorias, proteina, carboidrato, gordura (gramas).',
    input_schema: obj({
      nome: str('Nome da refeição'), calorias: str('Calorias'), proteina: str('Proteína (g)'),
      carboidrato: str('Carboidrato (g)'), gordura: str('Gordura (g)'),
    }, ['nome']),
    handler: async (i, sb, userId, ctx) => {
      const c = parseFloat(i.calorias) || 0, pr = parseFloat(i.proteina) || 0, ca = parseFloat(i.carboidrato) || 0, g = parseFloat(i.gordura) || 0;
      const { error } = await sb.from('meals').insert({ user_id: userId, name: i.nome, calories: c, protein: pr, carbs: ca, fat: g, date: ctx.today });
      if (error) throw error;
      return `Refeição: ${i.nome} | ${c}kcal | P:${pr}g C:${ca}g G:${g}g`;
    },
  },
  {
    name: 'resumo_nutricional',
    description: 'Resumo calórico do dia.',
    input_schema: obj({}),
    handler: async (_i, sb, userId, ctx) => {
      const { data, error } = await sb.from('meals').select('name,calories,protein,carbs,fat')
        .eq('user_id', userId).eq('date', ctx.today).order('created_at', { ascending: true });
      if (error) throw error;
      if (!data?.length) return 'Nenhuma refeição hoje.';
      let tc = 0, tp = 0, tca = 0, tg = 0;
      const lines = data.map((x) => { tc += x.calories || 0; tp += x.protein || 0; tca += x.carbs || 0; tg += x.fat || 0; return `🍽 ${x.name} | ${x.calories}kcal`; });
      lines.push(`\n📊 Total: ${tc}kcal | P:${tp}g C:${tca}g G:${tg}g`);
      return lines.join('\n');
    },
  },
  // ---------------- Perfil ----------------
  {
    name: 'ver_perfil',
    description: 'Ver dados do perfil do usuário.',
    input_schema: obj({}),
    handler: async (_i, sb, userId) => {
      const { data, error } = await sb.from('profiles')
        .select('full_name,email,phone,gender,birth_date,height,activity_level,goal,plan')
        .eq('id', userId);
      if (error) throw error;
      const p = data?.[0];
      if (!p) return 'Perfil não encontrado.';
      return `👤 Perfil\n- Nome: ${p.full_name || '-'}\n- Email: ${p.email || '-'}\n- Plano: ${p.plan || 'free'}\n- Objetivo: ${p.goal || '-'}\n- Altura: ${p.height ? p.height + 'cm' : '-'}`;
    },
  },
  {
    name: 'atualizar_perfil',
    description: 'Atualizar perfil. Opcionais: nome, email, genero, altura, objetivo. (NÃO altera o plano.)',
    input_schema: obj({ nome: str('Novo nome'), email: str('Novo email'), genero: str('Gênero'), altura: str('Altura em cm'), objetivo: str('Objetivo') }),
    handler: async (i, sb, userId) => {
      const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (i.nome) u.full_name = i.nome;
      if (i.email) u.email = i.email;
      if (i.genero) u.gender = i.genero;
      if (i.altura) u.height = parseFloat(i.altura);
      if (i.objetivo) u.goal = i.objetivo;
      const { error } = await sb.from('profiles').update(u).eq('id', userId);
      if (error) throw error;
      return 'Perfil atualizado!';
    },
  },
  // ---------------- Resumo do dia ----------------
  {
    name: 'resumo_diario',
    description: 'Resumo do dia: eventos, tarefas, hábitos e calorias. Use ao receber oi/olá/bom dia.',
    input_schema: obj({}),
    handler: async (_i, sb, userId, ctx) => {
      const [ts, te] = dayBoundsISO(ctx.now);
      const [ev, tk, hb, ml] = await Promise.all([
        sb.from('calendar_events').select('title,start_time').eq('user_id', userId).gte('start_time', ts).lte('start_time', te).order('start_time', { ascending: true }).limit(5),
        sb.from('tasks').select('title,priority').eq('user_id', userId).eq('status', 'Pending').order('created_at', { ascending: false }).limit(5),
        sb.from('habits').select('name,completed_today,streak').eq('user_id', userId).order('created_at', { ascending: true }),
        sb.from('meals').select('calories').eq('user_id', userId).eq('date', ctx.today),
      ]);
      const evs = ev.data || [], tks = tk.data || [], hbs = hb.data || [], mls = ml.data || [];
      let r = `📊 Resumo - ${fmtD(ctx.now.toISOString())}\n\n📅 Agenda (${evs.length}):\n`;
      r += evs.length ? evs.map((e) => `  ${fmtT(e.start_time)} - ${e.title}`).join('\n') + '\n' : '  Nenhum evento\n';
      r += `\n📋 Tarefas (${tks.length}):\n`;
      r += tks.length ? tks.map((t) => `  ${t.priority === 'High' ? '🔴' : '🟡'} ${t.title}`).join('\n') + '\n' : '  Tudo em dia!\n';
      const dn = hbs.filter((h) => h.completed_today).length;
      r += `\n🎯 Hábitos (${dn}/${hbs.length}):\n`;
      r += hbs.map((h) => `  ${h.completed_today ? '✅' : '⬜'} ${h.name} (${h.streak}🔥)`).join('\n');
      const tc = mls.reduce((s, m) => s + (m.calories || 0), 0);
      if (mls.length) r += `\n\n🍽 Calorias: ${tc}kcal`;
      return r;
    },
  },
];

const TOOL_MAP = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

// ---------------------------------------------------------------------------
// System prompt (estático -> cacheado; só a data muda, 1x por dia).
// ---------------------------------------------------------------------------
function buildSystem(today: string): string {
  return `Você é o assistente do Corelys, um app de rotina, finanças, academia e bem-estar.
Hoje é ${today}. Responda sempre em português do Brasil, de forma curta, amigável e direta.

Use as ferramentas disponíveis para ler e alterar os dados do usuário (agenda, tarefas, notas, hábitos, finanças, academia, nutrição, perfil). Regras:
- Não invente IDs: para editar/concluir/remover algo, primeiro liste para obter o ID quando o usuário não o forneceu.
- Finanças têm escopo "pf" (pessoa física) e "pj" (negócio). Se o usuário não disser, assuma "pf".
- Datas relativas ("hoje", "amanhã", "sexta") devem ser convertidas para ISO 8601 considerando que hoje é ${today}.
- Ao receber uma saudação (oi/olá/bom dia), use a ferramenta resumo_diario.
- Confirme ações concluídas de forma breve. Se faltar informação obrigatória, pergunte antes de agir.
- Nunca tente alterar o plano de assinatura do usuário.`;
}

// ---------------------------------------------------------------------------
async function callAnthropic(apiKey: string, system: string, messages: unknown[]) {
  const anthropicTools = TOOLS.map((t, idx) => {
    const def: Record<string, unknown> = { name: t.name, description: t.description, input_schema: t.input_schema };
    // cacheia o bloco de tools (último item) -> tools ficam no prefixo cacheado.
    if (idx === TOOLS.length - 1) def.cache_control = { type: 'ephemeral' };
    return def;
  });

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      // CRUD simples: effort baixo para latência/custo; suba para 'medium' se a
      // seleção de ferramentas ficar imprecisa.
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      tools: anthropicTools,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Client escopado ao usuário: RLS aplicado. user_id vem do token, não do modelo.
    const sb = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );

    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : null;
    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'messages é obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = body.now ? new Date(body.now) : new Date();
    const today = typeof body.today === 'string' ? body.today : now.toISOString().split('T')[0];
    const ctx: Ctx = { now, today };
    const system = buildSystem(today);

    // Loop agêntico manual: executa tools escopadas ao usuário e devolve resultados.
    const convo = [...messages];
    let reply = '';
    for (let iter = 0; iter < MAX_ITERS; iter++) {
      const resp = await callAnthropic(apiKey, system, convo);

      if (resp.stop_reason === 'tool_use') {
        const toolUses = (resp.content as any[]).filter((b) => b.type === 'tool_use');
        convo.push({ role: 'assistant', content: resp.content });
        const results = [];
        for (const tu of toolUses) {
          let out: string;
          try {
            const tool = TOOL_MAP[tu.name];
            out = tool ? await tool.handler(tu.input, sb, user.id, ctx) : `Ferramenta desconhecida: ${tu.name}`;
          } catch (e) {
            out = 'Erro ao executar: ' + (e as Error).message;
          }
          results.push({ type: 'tool_result', tool_use_id: tu.id, content: String(out) });
        }
        convo.push({ role: 'user', content: results });
        continue;
      }

      reply = (resp.content as any[]).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      break;
    }

    return new Response(JSON.stringify({ reply: reply || 'Não consegui concluir agora. Tente novamente.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('assistant error:', (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
