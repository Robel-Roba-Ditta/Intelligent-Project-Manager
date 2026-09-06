export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'member';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export type ProjectMemberRole = 'owner' | 'admin' | 'member';

export interface ProjectMemberDto {
  id: number;
  userId: number;
  role: ProjectMemberRole;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface ProjectDto {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  createdBy: {
    id: number;
    fullName: string;
    email: string;
  };
  members: ProjectMemberDto[];
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskType = 'TASK' | 'BUG' | 'STORY';

export interface TaskDto {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  storyPoints: number | null;
  dueDate: string | null;
  isDeleted: boolean;
  completedAt: string | null;
  projectId: number;
  epicId: number | null;
  sprintId: number | null;
  assigneeId: number | null;
  parentTaskId: number | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  assignee: { id: number; fullName: string; email: string } | null;
  epic: { id: number; name: string } | null;
  sprint: { id: number; name: string } | null;
  parent: { id: number; title: string } | null;
  children: TaskDto[];
  labels: LabelDto[];
  createdBy: { id: number; fullName: string; email: string } | null;
  project?: { id: number; name: string };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  storyPoints?: number;
  dueDate?: string;
  epicId?: number;
  sprintId?: number;
  assigneeId?: number;
  parentTaskId?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  type?: TaskType;
  storyPoints?: number | null;
  dueDate?: string | null;
  epicId?: number | null;
  sprintId?: number | null;
  assigneeId?: number | null;
  parentTaskId?: number | null;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: number;
  sprintId?: number;
  search?: string;
}

export type EpicStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';

export interface EpicDto {
  id: number;
  name: string;
  description: string | null;
  status: EpicStatus;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

export interface SprintDto {
  id: number;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  projectId: number;
  createdAt: string;
  updatedAt: string;
  project?: { id: number; name: string };
}

export interface BurndownDay {
  date: string;
  idealRemaining: number;
  actualRemaining: number;
}

export interface BurndownData {
  sprintName: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  days: BurndownDay[];
}

export interface LabelDto {
  id: number;
  name: string;
  color: string;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelData {
  name: string;
  color: string;
}

export interface UpdateLabelData {
  name?: string;
  color?: string;
}

export interface CommentDto {
  id: number;
  taskId: number;
  authorId: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { id: number; fullName: string; email: string };
}

export interface AttachmentDto {
  id: number;
  taskId: number;
  fileName: string;
  fileUrl: string;
  addedById: number;
  createdAt: string;
  addedBy: { id: number; fullName: string; email: string };
}

export interface NotificationDto {
  id: number;
  userId: number;
  taskId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  task: { id: number; title: string } | null;
}

export interface NotificationsResponse {
  notifications: NotificationDto[];
  unreadCount: number;
}

export interface ActivityLogDto {
  id: number;
  taskId: number;
  actorId: number;
  action: string;
  details: Record<string, any>;
  createdAt: string;
  actor: { id: number; fullName: string; email: string };
}

export interface DependencyTaskRef {
  dependencyId: number;
  task: { id: number; title: string; status: TaskStatus };
}

export interface DependenciesResponse {
  blocks: DependencyTaskRef[];
  blockedBy: DependencyTaskRef[];
}

export interface TimeLogDto {
  id: number;
  taskId: number;
  userId: number;
  hours: number;
  date: string;
  createdAt: string;
  user: { id: number; fullName: string; email: string };
}

export interface TimeLogsResponse {
  entries: TimeLogDto[];
  totalHours: number;
}

export interface UserDto {
  id: number;
  email: string;
  fullName: string;
}

export interface SearchResult {
  projects: { id: number; name: string }[];
  tasks: { id: number; title: string; projectName: string; status: string }[];
}

export type DashboardTaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type DashboardTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface DashboardAssignee {
  id: string;
  name: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  status: DashboardTaskStatus;
  priority: DashboardTaskPriority;
  assignee: DashboardAssignee;
  dueDate: string;
  projectName: string;
}

export interface DashboardProject {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
}

export interface DashboardSprint {
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
  sprint: DashboardSprint | null;
  tasksByStatus: Record<DashboardTaskStatus, number>;
  tasksByPriority: Record<DashboardTaskPriority, number>;
  weeklyTrend: WeeklyTrendPoint[];
  myTasks: DashboardTask[];
  teamWorkload: TeamWorkload[];
  projects: DashboardProject[];
  activity: ActivityItem[];
}
