import type { DashboardData, Task, TeamWorkload } from './types';

function daysFromNow(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
function hoursAgo(offset: number): string {
  const d = new Date();
  d.setHours(d.getHours() - offset);
  return d.toISOString();
}

const TEAM = [
  { id: 'u1', name: 'Selam Girma' },
  { id: 'u2', name: 'Dawit Bekele' },
  { id: 'u3', name: 'Hana Tesfaye' },
  { id: 'u4', name: 'Yonas Alemu' },
];

const PROJECTS = [
  { id: 'p1', name: 'Intelligent PMS', totalTasks: 42, completedTasks: 27 },
  { id: 'p2', name: 'Mobile App Redesign', totalTasks: 23, completedTasks: 19 },
  { id: 'p3', name: 'Marketing Website', totalTasks: 15, completedTasks: 6 },
  { id: 'p4', name: 'Q3 Data Migration', totalTasks: 9, completedTasks: 2 },
];

function buildMyTasks(currentUserName: string): Task[] {
  const assignee = { id: 'me', name: currentUserName };
  return [
    {
      id: 't1',
      title: 'Wire up JWT refresh flow',
      status: 'in_progress',
      priority: 'high',
      assignee,
      dueDate: daysFromNow(1),
      projectName: 'Intelligent PMS',
    },
    {
      id: 't2',
      title: 'Design sprint board drag states',
      status: 'todo',
      priority: 'medium',
      assignee,
      dueDate: daysFromNow(4),
      projectName: 'Intelligent PMS',
    },
    {
      id: 't3',
      title: 'Fix overdue-task badge color',
      status: 'todo',
      priority: 'urgent',
      assignee,
      dueDate: daysFromNow(-3),
      projectName: 'Intelligent PMS',
    },
    {
      id: 't4',
      title: 'Review PR: task filtering API',
      status: 'in_progress',
      priority: 'medium',
      assignee,
      dueDate: daysFromNow(2),
      projectName: 'Mobile App Redesign',
    },
    {
      id: 't5',
      title: 'Write onboarding checklist copy',
      status: 'done',
      priority: 'low',
      assignee,
      dueDate: daysFromNow(-5),
      projectName: 'Marketing Website',
    },
  ];
}

const TEAM_WORKLOAD: TeamWorkload[] = [
  { memberId: 'u1', memberName: 'Selam Girma', assignedTaskCount: 9 },
  { memberId: 'u2', memberName: 'Dawit Bekele', assignedTaskCount: 7 },
  { memberId: 'u3', memberName: 'Hana Tesfaye', assignedTaskCount: 5 },
  { memberId: 'u4', memberName: 'Yonas Alemu', assignedTaskCount: 3 },
];

const ACTIVITY = [
  { id: 'a1', actorName: 'Selam Girma', action: 'completed' as const, targetTitle: 'Set up CI pipeline', timestamp: hoursAgo(1) },
  { id: 'a2', actorName: 'Dawit Bekele', action: 'moved' as const, targetTitle: 'Task filtering API', timestamp: hoursAgo(3) },
  { id: 'a3', actorName: 'Hana Tesfaye', action: 'commented' as const, targetTitle: 'Sprint 4 planning', timestamp: hoursAgo(9) },
  { id: 'a4', actorName: 'Yonas Alemu', action: 'created' as const, targetTitle: 'Data migration checklist', timestamp: hoursAgo(20) },
  { id: 'a5', actorName: 'Selam Girma', action: 'moved' as const, targetTitle: 'Onboarding checklist copy', timestamp: hoursAgo(27) },
];

export function getDashboardData(currentUserName: string): DashboardData {
  return {
    stats: {
      activeProjects: PROJECTS.length,
      openTasks: 27,
      completedThisSprint: 18,
      overdueTasks: 3,
    },
    sprint: {
      id: 's4',
      name: 'Sprint 4',
      goal: 'Ship authentication and start project CRUD',
      startDate: daysFromNow(-5),
      endDate: daysFromNow(8),
      plannedPoints: 40,
      completedPoints: 27,
    },
    tasksByStatus: { todo: 12, in_progress: 9, done: 18 },
    weeklyTrend: [
      { day: 'Mon', completed: 2 },
      { day: 'Tue', completed: 4 },
      { day: 'Wed', completed: 3 },
      { day: 'Thu', completed: 5 },
      { day: 'Fri', completed: 6 },
      { day: 'Sat', completed: 1 },
      { day: 'Sun', completed: 2 },
    ],
    myTasks: buildMyTasks(currentUserName),
    teamWorkload: TEAM_WORKLOAD,
    projects: PROJECTS,
    activity: ACTIVITY,
  };
}

export const TEAM_MEMBERS = TEAM;
