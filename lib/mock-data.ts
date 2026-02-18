
import { Task, Transaction, Habit, CalendarEvent, GymStats, Nutrition, Workout, Project, GraphNode, GraphLink } from '../types';

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Corelys v2', description: 'Revolução da interface pessoal', status: 'Active', tags: ['#dev', '#design'], lastEdited: '2024-05-19', links: ['p2', 'p3'] },
  { id: 'p2', name: 'Health MOC', description: 'Mapa de controle de saúde e biohacking', status: 'Active', tags: ['#health', '#bio'], lastEdited: '2024-05-18', links: ['p1'] },
  { id: 'p3', name: 'Finance Q2 Strategy', description: 'Planejamento de investimentos', status: 'Slowburn', tags: ['#money'], lastEdited: '2024-05-15', links: ['p1'] },
  { id: 'p4', name: 'Reading List 2024', description: 'Livros para expandir a mente', status: 'Idle', tags: ['#growth'], lastEdited: '2024-05-10', links: [] },
];

export const GRAPH_DATA: { nodes: GraphNode[], links: GraphLink[] } = {
  nodes: [
    { id: 'root', label: 'Nexus Home', type: 'root', x: 400, y: 300 },
    { id: 'p1', label: 'Nexus App', type: 'project', x: 550, y: 250 },
    { id: 'p2', label: 'Health MOC', type: 'project', x: 250, y: 350 },
    { id: 'p3', label: 'Finance MOC', type: 'project', x: 400, y: 150 },
    { id: 'p4', label: 'Personal Management', type: 'project', x: 300, y: 200 },
    { id: 't1', label: 'UI Review', type: 'task', x: 650, y: 200 },
    { id: 't2', label: 'Leg Day', type: 'task', x: 150, y: 400 },
    { id: 'h1', label: 'Reading', type: 'habit', x: 500, y: 450 },
  ],
  links: [
    { source: 'root', target: 'p1' },
    { source: 'root', target: 'p2' },
    { source: 'root', target: 'p3' },
    { source: 'root', target: 'p4' },
    { source: 'p1', target: 't1' },
    { source: 'p2', target: 't2' },
    { source: 'p4', target: 'h1' },
    { source: 'p1', target: 'p3' },
  ]
};

export const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Apresentação Resultados Q4', priority: 'High', status: 'Pending', dueDate: '2024-05-19', category: 'Work' },
  { id: '2', title: 'Comprar Suplementos', priority: 'Medium', status: 'Completed', dueDate: '2024-05-18', category: 'Personal' },
  { id: '3', title: 'Treino de Pernas (Foco Quadríceps)', priority: 'Medium', status: 'Pending', dueDate: '2024-05-19', category: 'Health' },
  { id: '4', title: 'Revisão de Código Auth', priority: 'High', status: 'Pending', dueDate: '2024-05-20', category: 'Work' },
  { id: '5', title: 'Ligar para os pais', priority: 'Low', status: 'Pending', dueDate: '2024-05-21', category: 'Personal' },
  { id: '6', title: 'Leitura: Hábitos Atômicos', priority: 'Low', status: 'Completed', dueDate: '2024-05-19', category: 'Growth' },
  { id: '7', title: 'Atualizar Portfólio', priority: 'Medium', status: 'Pending', dueDate: '2024-05-25', category: 'Work' },
  { id: '9', title: 'Revisar Relatório de Despesas', priority: 'High', status: 'Pending', dueDate: '2024-05-19', category: 'Finance' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2024-05-18', description: 'Starbucks Coffee', category: 'Food', amount: 5.50, type: 'expense' },
  { id: 't2', date: '2024-05-17', description: 'Amazon Purchase', category: 'Shopping', amount: 45.99, type: 'expense' },
  { id: 't3', date: '2024-05-16', description: 'Salary Deposit', category: 'Income', amount: 3500.00, type: 'income' },
  { id: 't4', date: '2024-05-15', description: 'Monthly Rent', category: 'Housing', amount: 1200.00, type: 'expense' },
  { id: 't5', date: '2024-05-14', description: 'Netflix Subscription', category: 'Entertainment', amount: 15.99, type: 'expense' },
];

export const MOCK_HABITS: Habit[] = [
  { id: 'h1', name: 'Beber 2L de Água', streak: 12, bestStreak: 28, progress: 75, target: '2L', completedToday: false, history: [] },
  { id: 'h2', name: 'Leitura 30min', streak: 5, bestStreak: 15, progress: 100, target: '30m', completedToday: true, history: [] },
  { id: 'h5', name: 'Sem Redes Sociais', streak: 20, bestStreak: 45, progress: 100, target: 'All day', completedToday: true, history: [] },
];

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Reunião de Produto', start: '2024-05-19T10:00:00', end: '2024-05-19T11:30:00', category: 'Work', location: 'Sala A' },
  { id: 'e2', title: 'Consulta Dentista', start: '2024-05-19T14:00:00', end: '2024-05-19T15:00:00', category: 'Health' },
  { id: 'e3', title: 'Jantar Comemorativo', start: '2024-05-20T20:00:00', end: '2024-05-20T22:00:00', category: 'Personal' },
];

export const MOCK_GYM_STATS: GymStats = {
  weight: 82.5,
  targetWeight: 78.0,
  bodyFat: 18.4,
  muscleMass: 38.2,
  caloriesConsumed: 1650,
  targetCalories: 2400
};

export const MOCK_NUTRITION: Nutrition = {
  protein: 160,
  carbs: 220,
  fat: 65
};

export const MOCK_WORKOUT: Workout = {
  day: 'Segunda-feira',
  muscleGroup: 'Peito e Tríceps',
  exercises: [
    { name: 'Supino Reto', sets: '4', reps: '10-12' },
    { name: 'Supino Inclinado Halteres', sets: '3', reps: '12' },
    { name: 'Crucifixo Máquina', sets: '3', reps: '15' },
    { name: 'Tríceps Corda', sets: '4', reps: '12-15' },
    { name: 'Tríceps Testa', sets: '3', reps: '10' }
  ]
};

export const WEIGHT_HISTORY = [
  { month: 'Jan', weight: 85.0 },
  { month: 'Fev', weight: 84.2 },
  { month: 'Mar', weight: 84.5 },
  { month: 'Abr', weight: 83.1 },
  { month: 'Mai', weight: 82.5 },
];
