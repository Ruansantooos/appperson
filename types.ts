
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
}

export interface Nutrition {
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
}
