# 🏥 Corelys - Documentação do Sistema

Bem-vindo à documentação oficial do **Corelys**. Este documento fornece uma visão detalhada da arquitetura, tecnologias, funcionalidades e estrutura de dados do sistema.

---

## 🚀 Visão Geral
O **Corelys** é um ecossistema completo para gestão de rotina, saúde e finanças. Ele integra diversas funcionalidades em uma interface moderna e intuitiva, permitindo que o usuário monitore desde seus treinos e dieta até seus projetos e contas a pagar.

---

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 19 | Biblioteca base para construção da interface. |
| **Framework** | Vite | Ferramenta de build e servidor de desenvolvimento ultrarrápido. |
| **Estilização** | Tailwind CSS | Framework de CSS utilitário para design responsivo. |
| **Roteamento** | React Router 7 | Gestão de navegação entre páginas. |
| **Banco de Dados** | Supabase | Backend-as-a-Service (PostgreSQL) para dados e autenticação. |
| **Ícones** | Lucide React | Conjunto de ícones consistentes e modernos. |
| **Gráficos** | Recharts | Biblioteca para visualização de dados e estatísticas. |

---

## 📁 Estrutura de Pastas

```text
/
├── components/          # Componentes React reutilizáveis
│   ├── shared/          # Componentes globais (Sidebar, Header, etc.)
│   └── ui/              # Componentes de interface base
├── contexts/            # Provedores de estado global (Auth, Theme)
├── lib/                 # Configurações de bibliotecas (Supabase, Mocks)
├── pages/               # Páginas principais da aplicação
├── types/ or types.ts   # Definições de tipos TypeScript
├── App.tsx              # Componente raiz e roteamento
└── index.tsx            # Ponto de entrada da aplicação
```

---

## 📑 Funcionalidades Principais

### 1. Dashboard
- Visualização consolidada de métricas.
- Resumo de tarefas e compromissos do dia.

### 2. Gestão de Tarefas (Tasks)
- Criação, edição e exclusão de tarefas.
- Organização por prioridade e status.

### 3. Projetos e Mapas Mentais
- Gestão de projetos com tags e links.
- Sistema de interconexão entre projetos.

### 4. Controle Financeiro (Finance)
- Gestão de transações (Receitas/Despesas).
- Suporte para finanças PF (Pessoa Física) e PJ (Pessoa Jurídica).
- Cadastro de cartões de crédito/débito e gestão de limites.
- Controle de contas a pagar (Bills).

### 5. Saúde e Fitness (Gym)
- Acompanhamento de peso e composição corporal.
- Monitoramento de macros (Calorias, Proteínas, Carbos, Gorduras).
- Gestão de treinos e suplementação.

### 6. Hábitos e Rotina
- Registro de hábitos diários.
- Acompanhamento de streaks (sequências).

### 7. Calendário
- Agendamento de eventos e compromissos.

---

## 🗄️ Dicionário de Dados (Supabase)

Abaixo estão as principais tabelas que compõem o banco de dados do sistema:

| Tabela | Descrição | Campos Principais |
| :--- | :--- | :--- |
| `profiles` | Perfil estendido do usuário. | `id`, `full_name`, `goal`, `plan`, `height`, `activity_level` |
| `tasks` | Tarefas do usuário. | `id`, `title`, `priority`, `status`, `due_date`, `category` |
| `projects` | Projetos cadastrados. | `id`, `name`, `description`, `status`, `tags`, `links` |
| `habits` | Hábitos monitorados. | `id`, `name`, `streak`, `progress`, `completed_today` |
| `gym_stats` | Estatísticas corporais. | `user_id`, `weight`, `body_fat`, `calories_consumed`, `protein` |
| `workouts` | Planos de treino. | `id`, `name`, `day_of_week`, `muscle_group` |
| `calendar_events` | Eventos do calendário. | `id`, `title`, `start_time`, `end_time`, `category` |
| `cards` | Cartões financeiros. | `bank_name`, `last_four_digits`, `card_type`, `card_limit`, `finance_scope` |
| `transactions` | Movimentações financeiras. | `description`, `amount`, `type`, `category`, `finance_scope` |
| `bills` | Contas a pagar. | `description`, `amount`, `due_date`, `recurrence`, `status` |

---

## 🔐 Segurança (RLS)
Todas as tabelas possuem **Row Level Security (RLS)** habilitada, garantindo que usuários autenticados só possam acessar e modificar seus próprios dados.

---

## 🎨 Design System
- **Cores:** Paleta moderna com tons de preto/branco e destaque para a cor `#c1ff72` (Brand).
- **Modos:** Suporte nativo para Modo Claro (Light) e Modo Escuro (Dark).
- **Tipografia:** Fonte *Inter* para máxima legibilidade.
