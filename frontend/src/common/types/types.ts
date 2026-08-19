export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Assignee {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: Assignee;
  dueDate: string;
  projectName: string;
}

export interface Project {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
}

export interface TeamWorkload {
  memberId: string;
  memberName: string;
  assignedTaskCount: number;
}

export interface ActivityItem {
  id: string;
  actorName: string;
  action: 'moved' | 'completed' | 'created' | 'commented';
  targetTitle: string;
  timestamp: string;
}

export interface DashboardStats {
  activeProjects: number;
  openTasks: number;
  completedThisSprint: number;
  overdueTasks: number;
}

export interface WeeklyTrendPoint {
  day: string;
  completed: number;
}

export interface DashboardData {
  stats: DashboardStats;
  sprint: Sprint | null;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  weeklyTrend: WeeklyTrendPoint[];
  myTasks: Task[];
  teamWorkload: TeamWorkload[];
  projects: Project[];
  activity: ActivityItem[];
}
