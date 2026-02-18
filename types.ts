
export type Priority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  category: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Slowburn' | 'Idle' | 'Archived';
  tags: string[];
  lastEdited: string;
  links: string[]; // IDs de outros projetos ou notas conectadas
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'project' | 'task' | 'habit' | 'goal' | 'root';
  x: number;
  y: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  card_id?: string;
  finance_scope?: 'pf' | 'pj';
  project_id?: string;
  classification?: 'Custo' | 'Despesa' | 'Investimento' | 'Outros';
}

export interface FinanceCard {
  id: string;
  bank_name: string;
  last_four_digits: string;
  expiration_date: string;    // formato MM/AA
  card_type: 'credit' | 'debit';
  card_limit: number;
  user_id: string;
  created_at?: string;
  finance_scope?: 'pf' | 'pj';
}

export interface Bill {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  recurrence: 'once' | 'weekly' | 'monthly';
  category: string;
  status: 'pending' | 'paid' | 'overdue';
  card_id?: string;
  finance_scope: 'pf' | 'pj';
  user_id: string;
  created_at?: string;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  bestStreak: number;
  progress: number; // 0 to 100
  target: string;
  completedToday: boolean;
  history: { date: string; completed: boolean }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  category: 'Work' | 'Personal' | 'Health' | 'Finance';
  location?: string;
}

export interface GymStats {
  weight: number;
  targetWeight: number;
  bodyFat: number;
  muscleMass: number;
  caloriesConsumed: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeightEntry {
  id: string;
  weight: number;
  date: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
}

export interface Nutrition {
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
  created_at?: string;
}

export interface SavedFood {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}


export interface Supplement {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  currentStock: number;
  userId: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
  notes?: string;
  orderIndex: number;
}

export interface Workout {
  id: string;
  name: string;
  dayOfWeek: string;
  muscleGroup: string;
  exercises?: WorkoutExercise[];
  userId: string;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  gender?: 'Male' | 'Female' | 'Other';
  birthDate?: string;
  height?: number;
  activityLevel?: string;
  goal?: string;
  plan?: 'free' | 'premium';
  plan_expires_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

// PJ Types
export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  description: string;
  amount: number;
  type: 'emitida' | 'recebida';
  status: 'emitida' | 'pendente' | 'cancelada';
  issue_date: string;
  client_name?: string;
  created_at?: string;
}

export interface Receivable {
  id: string;
  user_id: string;
  client_name: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'received' | 'overdue';
  created_at?: string;
}

export interface Tax {
  id: string;
  user_id: string;
  tax_name: string;
  description?: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  recurrence: 'once' | 'monthly' | 'quarterly' | 'yearly';
  created_at?: string;
}

export interface WorkoutExerciseLog {
  exerciseId: string;
  name: string;
  targetSets: string;
  targetReps: string;
  weight: string;
  completed: boolean;
}

export interface WorkoutSession {
  workoutId: string;
  workoutName: string;
  muscleGroup: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  exercises: WorkoutExerciseLog[];
}
