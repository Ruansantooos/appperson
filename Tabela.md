# Tabelas do Supabase - Corelys App

Guia completo de todas as tabelas, colunas e o que preencher em cada uma.

---

## 1. PROFILES

> Dados do perfil do usuario. Criada automaticamente ao registrar.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | ID do usuario (vem do auth.users) |
| `email` | text | Sim | Email do usuario |
| `full_name` | text | Sim | Nome completo |
| `avatar_url` | text | Nao | URL da foto de perfil |
| `gender` | text | Nao | Sexo: `Male`, `Female` ou `Other` |
| `birth_date` | date | Nao | Data de nascimento (YYYY-MM-DD) |
| `height` | numeric | Nao | Altura em cm (ex: 175) |
| `activity_level` | text | Nao | Nivel de atividade (ex: Sedentario, Moderado, Ativo) |
| `goal` | text | Nao | Objetivo (ex: Perder peso, Ganhar massa) |
| `plan` | text | Auto | Plano: `free` ou `premium` (default: premium) |
| `plan_expires_at` | timestamp | Nao | Data de expiracao do plano |
| `stripe_customer_id` | text | Nao | ID do cliente no Stripe |
| `stripe_subscription_id` | text | Nao | ID da assinatura no Stripe |
| `phone` | text | Nao | Telefone (unico, usado no WhatsApp) |
| `updated_at` | timestamp | Auto | Data da ultima atualizacao |

---

## 2. TASKS

> Tarefas do usuario (to-do list).

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `title` | text | Sim | Titulo da tarefa (ex: "Estudar React") |
| `description` | text | Nao | Descricao detalhada da tarefa |
| `priority` | text | Nao | Prioridade: `High`, `Medium` ou `Low` |
| `status` | text | Nao | Status: `Pending` ou `Completed` |
| `due_date` | timestamp | Nao | Data limite para completar |
| `category` | text | Nao | Categoria (ex: Trabalho, Pessoal, Estudo) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 3. PROJECTS

> Projetos do usuario para organizar trabalho/ideias.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `name` | text | Sim | Nome do projeto (ex: "App Mobile") |
| `description` | text | Nao | Descricao do projeto |
| `status` | text | Nao | Status: `Active`, `Slowburn`, `Idle` ou `Archived` |
| `tags` | text[] | Nao | Tags/etiquetas (array, ex: ["react", "frontend"]) |
| `links` | text[] | Nao | IDs de projetos/notas relacionados |
| `last_edited` | timestamp | Auto | Ultima edicao |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 4. NOTES

> Notas e anotacoes do usuario.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `title` | text | Nao | Titulo da nota |
| `content` | text | Sim | Conteudo da nota |
| `tags` | text[] | Nao | Tags (array, ex: ["ideia", "trabalho"]) |
| `category` | text | Nao | Categoria (default: "general") |
| `created_at` | timestamp | Auto | Data de criacao |
| `updated_at` | timestamp | Auto | Ultima atualizacao |

---

## 5. HABITS

> Habitos que o usuario quer acompanhar.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `name` | text | Sim | Nome do habito (ex: "Beber 2L de agua") |
| `streak` | integer | Auto | Sequencia atual de dias (default: 0) |
| `best_streak` | integer | Auto | Melhor sequencia ja alcancada (default: 0) |
| `progress` | integer | Auto | Progresso 0-100 (default: 0) |
| `target` | text | Nao | Meta do habito (ex: "30 dias seguidos") |
| `completed_today` | boolean | Auto | Se foi completado hoje (default: false) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 6. HABIT_LOGS

> Registro diario de conclusao dos habitos.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `habit_id` | uuid | Sim | ID do habito (referencia habits) |
| `user_id` | uuid | Sim | ID do usuario |
| `date` | date | Auto | Data do registro (default: hoje) |
| `completed` | boolean | Auto | Se completou (default: true) |
| `created_at` | timestamp | Auto | Data de criacao |

> **Restricao:** Apenas 1 registro por habito por dia (UNIQUE habit_id + date)

---

## 7. GYM_STATS

> Estatisticas de saude/academia do usuario.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `weight` | numeric | Nao | Peso atual em kg (ex: 75.5) |
| `target_weight` | numeric | Nao | Peso meta em kg (ex: 70) |
| `body_fat` | numeric | Nao | Percentual de gordura corporal (ex: 18.5) |
| `muscle_mass` | numeric | Nao | Massa muscular em kg (ex: 35) |
| `calories_consumed` | numeric | Nao | Calorias consumidas hoje |
| `target_calories` | numeric | Nao | Meta de calorias diarias |
| `protein` | numeric | Nao | Proteina em gramas (default: 0) |
| `carbs` | numeric | Nao | Carboidratos em gramas (default: 0) |
| `fat` | numeric | Nao | Gordura em gramas (default: 0) |
| `updated_at` | timestamp | Auto | Ultima atualizacao |

---

## 8. WEIGHT_HISTORY

> Historico de peso do usuario ao longo do tempo.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `weight` | numeric | Sim | Peso em kg (ex: 74.2) |
| `date` | date | Auto | Data do registro (default: hoje) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 9. SUPPLEMENTS

> Suplementos que o usuario toma.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `name` | text | Sim | Nome do suplemento (ex: "Creatina") |
| `dosage` | text | Nao | Dosagem (ex: "5g") |
| `frequency` | text | Nao | Frequencia (ex: "Diario", "Pos-treino") |
| `instructions` | text | Nao | Instrucoes (ex: "Tomar com agua") |
| `current_stock` | integer | Nao | Estoque atual (quantidade restante) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 10. WORKOUTS

> Treinos do usuario.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `name` | text | Sim | Nome do treino (ex: "Treino A - Peito") |
| `day_of_week` | text | Nao | Dia da semana (ex: "Segunda", "Terca") |
| `muscle_group` | text | Nao | Grupo muscular (ex: "Peito", "Costas", "Pernas") |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 11. WORKOUT_EXERCISES

> Exercicios dentro de cada treino.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `workout_id` | uuid | Sim | ID do treino (referencia workouts) |
| `user_id` | uuid | Nao | ID do usuario |
| `name` | text | Sim | Nome do exercicio (ex: "Supino Reto") |
| `sets` | text | Nao | Numero de series (ex: "4") |
| `reps` | text | Nao | Numero de repeticoes (ex: "12") |
| `weight` | text | Nao | Peso usado (ex: "60kg") |
| `notes` | text | Nao | Observacoes (ex: "Focar na descida") |
| `order_index` | integer | Nao | Ordem do exercicio no treino (default: 0) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 12. CALENDAR_EVENTS

> Eventos do calendario.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `title` | text | Sim | Titulo do evento (ex: "Reuniao com cliente") |
| `description` | text | Nao | Descricao do evento |
| `start_time` | timestamp | Sim | Data/hora de inicio |
| `end_time` | timestamp | Sim | Data/hora de fim |
| `category` | text | Nao | Categoria: `Work`, `Personal`, `Health` ou `Finance` |
| `location` | text | Nao | Local do evento |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 13. CARDS

> Cartoes de credito/debito do usuario.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `bank_name` | text | Sim | Nome do banco (ex: "Nubank", "Itau") |
| `last_four_digits` | text | Sim | Ultimos 4 digitos do cartao (ex: "1234") |
| `expiration_date` | text | Sim | Validade no formato MM/AA (ex: "12/27") |
| `card_type` | text | Sim | Tipo: `credit` ou `debit` |
| `card_limit` | numeric | Nao | Limite do cartao em R$ (default: 0) |
| `finance_scope` | text | Nao | Escopo: `pf` (pessoa fisica) ou `pj` (pessoa juridica) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 14. TRANSACTIONS

> Transacoes financeiras (receitas e despesas).

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `description` | text | Sim | Descricao (ex: "Almoco", "Salario") |
| `amount` | numeric | Sim | Valor em R$ (ex: 150.00) |
| `category` | text | Nao | Categoria (ex: "Alimentacao", "Transporte") |
| `type` | text | Nao | Tipo: `income` (receita) ou `expense` (despesa) |
| `date` | date | Auto | Data da transacao (default: hoje) |
| `card_id` | uuid | Nao | ID do cartao usado (referencia cards) |
| `finance_scope` | text | Nao | Escopo: `pf` ou `pj` (default: pf) |
| `classification` | text | Nao | Classificacao PJ: `Custo`, `Despesa`, `Investimento` ou `Outros` |
| `project_id` | uuid | Nao | ID do projeto vinculado (referencia projects) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 15. BILLS

> Contas a pagar (boletos, assinaturas, etc).

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `description` | text | Sim | Descricao da conta (ex: "Netflix", "Aluguel") |
| `amount` | numeric | Sim | Valor em R$ |
| `due_date` | date | Sim | Data de vencimento |
| `recurrence` | text | Nao | Recorrencia: `once`, `weekly` ou `monthly` (default: once) |
| `category` | text | Sim | Categoria (default: "Others") |
| `status` | text | Auto | Status: `pending`, `paid` ou `overdue` (default: pending) |
| `card_id` | uuid | Nao | ID do cartao vinculado |
| `finance_scope` | text | Nao | Escopo: `pf` ou `pj` (default: pf) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 16. MEALS

> Refeicoes registradas pelo usuario.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `name` | text | Sim | Nome da refeicao (ex: "Almoco", "Frango grelhado") |
| `calories` | numeric | Nao | Calorias (default: 0) |
| `protein` | numeric | Nao | Proteina em gramas (default: 0) |
| `carbs` | numeric | Nao | Carboidratos em gramas (default: 0) |
| `fat` | numeric | Nao | Gordura em gramas (default: 0) |
| `date` | date | Sim | Data da refeicao (default: hoje) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 17. SAVED_FOODS

> Alimentos salvos para reutilizar nas refeicoes.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `name` | text | Sim | Nome do alimento (ex: "Arroz branco 100g") |
| `calories` | numeric | Nao | Calorias (default: 0) |
| `protein` | numeric | Nao | Proteina em gramas (default: 0) |
| `carbs` | numeric | Nao | Carboidratos em gramas (default: 0) |
| `fat` | numeric | Nao | Gordura em gramas (default: 0) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 18. INVOICES (PJ)

> Notas fiscais para pessoa juridica.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `invoice_number` | text | Sim | Numero da nota fiscal (ex: "NF-001") |
| `description` | text | Sim | Descricao do servico/produto |
| `amount` | numeric | Sim | Valor em R$ |
| `type` | text | Sim | Tipo: `emitida` ou `recebida` (default: emitida) |
| `status` | text | Sim | Status: `emitida`, `pendente` ou `cancelada` (default: pendente) |
| `issue_date` | date | Sim | Data de emissao (default: hoje) |
| `client_name` | text | Nao | Nome do cliente |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 19. RECEIVABLES (PJ)

> Contas a receber de clientes.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `client_name` | text | Sim | Nome do cliente |
| `description` | text | Sim | Descricao do servico prestado |
| `amount` | numeric | Sim | Valor a receber em R$ |
| `due_date` | date | Sim | Data prevista de recebimento |
| `status` | text | Auto | Status: `pending`, `received` ou `overdue` (default: pending) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 20. TAXES (PJ)

> Impostos e tributos a pagar.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `tax_name` | text | Sim | Nome do imposto (ex: "DAS", "ISS", "IRPJ") |
| `description` | text | Nao | Descricao/observacoes |
| `amount` | numeric | Sim | Valor em R$ |
| `due_date` | date | Sim | Data de vencimento |
| `status` | text | Auto | Status: `pending`, `paid` ou `overdue` (default: pending) |
| `recurrence` | text | Nao | Recorrencia: `once`, `monthly`, `quarterly` ou `yearly` (default: monthly) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 21. PAYMENT_HISTORY

> Historico de pagamentos do plano (Stripe).

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `user_id` | uuid | Sim | ID do usuario |
| `amount` | numeric | Sim | Valor pago |
| `currency` | text | Auto | Moeda (default: "BRL") |
| `status` | text | Sim | Status do pagamento (ex: "succeeded", "failed") |
| `stripe_payment_id` | text | Nao | ID do pagamento no Stripe |
| `payment_method` | text | Nao | Metodo de pagamento (ex: "card", "pix") |
| `plan` | text | Auto | Plano (default: "premium") |
| `period_start` | date | Nao | Inicio do periodo pago |
| `period_end` | date | Nao | Fim do periodo pago |
| `created_at` | timestamp | Auto | Data de criacao |

---

## 22. WHATSAPP_SESSIONS

> Sessoes de WhatsApp dos usuarios.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `phone` | text | Sim | Numero de telefone (unico) |
| `user_id` | uuid | Nao | ID do usuario vinculado |
| `last_message_at` | timestamp | Auto | Ultima mensagem recebida |
| `message_count` | integer | Auto | Total de mensagens (default: 0) |
| `is_blocked` | boolean | Auto | Se esta bloqueado (default: false) |
| `blocked_until` | timestamp | Nao | Bloqueado ate quando |
| `created_at` | timestamp | Auto | Data de criacao |
| `updated_at` | timestamp | Auto | Ultima atualizacao |

---

## 23. WHATSAPP_MESSAGE_LOGS

> Log de mensagens trocadas pelo WhatsApp.

| Coluna | Tipo | Obrigatorio | O que preencher |
|---|---|---|---|
| `id` | uuid | Auto | Gerado automaticamente |
| `phone` | text | Sim | Numero de telefone |
| `user_id` | uuid | Nao | ID do usuario |
| `direction` | text | Sim | Direcao: `incoming` ou `outgoing` |
| `message_type` | text | Auto | Tipo: `text`, `audio`, `image`, `document` ou `other` (default: text) |
| `content` | text | Nao | Conteudo da mensagem |
| `ai_response` | text | Nao | Resposta gerada pela IA |
| `tools_used` | text[] | Nao | Ferramentas usadas pela IA (array) |
| `processing_time_ms` | integer | Nao | Tempo de processamento em milissegundos |
| `error` | text | Nao | Mensagem de erro (se houver) |
| `created_at` | timestamp | Auto | Data de criacao |

---

## Legenda

| Termo | Significado |
|---|---|
| **Auto** | Preenchido automaticamente pelo banco (nao precisa enviar) |
| **Sim** | Campo obrigatorio - deve ser preenchido |
| **Nao** | Campo opcional - pode ser deixado vazio |
| **uuid** | Identificador unico universal |
| **text** | Texto livre |
| **numeric** | Numero (aceita decimais) |
| **integer** | Numero inteiro |
| **date** | Data no formato YYYY-MM-DD |
| **timestamp** | Data + hora com fuso horario |
| **boolean** | Verdadeiro ou Falso |
| **text[]** | Lista/array de textos |

---

## Relacionamentos entre tabelas

```
profiles (1) ----< tasks (N)
profiles (1) ----< projects (N)
profiles (1) ----< notes (N)
profiles (1) ----< habits (N)
habits   (1) ----< habit_logs (N)
profiles (1) ----< gym_stats (N)
profiles (1) ----< weight_history (N)
profiles (1) ----< supplements (N)
profiles (1) ----< workouts (N)
workouts (1) ----< workout_exercises (N)
profiles (1) ----< calendar_events (N)
profiles (1) ----< cards (N)
profiles (1) ----< transactions (N)
cards    (1) ----< transactions (N)
projects (1) ----< transactions (N)
profiles (1) ----< bills (N)
cards    (1) ----< bills (N)
profiles (1) ----< meals (N)
profiles (1) ----< saved_foods (N)
profiles (1) ----< invoices (N)
profiles (1) ----< receivables (N)
profiles (1) ----< taxes (N)
profiles (1) ----< payment_history (N)
profiles (1) ----< whatsapp_sessions (N)
profiles (1) ----< whatsapp_message_logs (N)
```
