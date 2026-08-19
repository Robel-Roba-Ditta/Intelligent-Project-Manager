const fs = require('fs');
const path = require('path');

const map = {
  'pages/Login': 'modules/auth/pages/Login',
  'pages/Signup': 'modules/auth/pages/Signup',
  'pages/TeamDirectory': 'modules/user/pages/TeamDirectory',
  'pages/ProjectsList': 'modules/project/pages/ProjectsList',
  'pages/ProjectDetail': 'modules/project/pages/ProjectDetail',
  'pages/MyTasks': 'modules/task/pages/MyTasks',
  'pages/TaskDetail': 'modules/task/pages/TaskDetail',
  'pages/GlobalSprints': 'modules/sprint/pages/GlobalSprints',
  'pages/Dashboard': 'modules/dashboard/pages/Dashboard',
  
  'components/Button': 'common/components/Button',
  'components/FormField': 'common/components/FormField',
  'components/Modal': 'common/components/Modal',
  'components/ProtectedRoute': 'common/components/ProtectedRoute',
  'components/AuthLayout': 'common/components/AuthLayout',
  'components/layout/Sidebar': 'common/components/layout/Sidebar',
  'components/layout/Header': 'common/components/layout/Header',
  'components/layout/Layout': 'common/components/layout/Layout',
  'components/layout/AppShell': 'common/components/layout/AppShell',
  'components/layout/Topbar': 'common/components/layout/Topbar',
  
  'components/projects/CreateProjectModal': 'modules/project/components/CreateProjectModal',
  'components/projects/ProjectCard': 'modules/project/components/ProjectCard',
  'components/projects/TasksTab': 'modules/project/components/TasksTab',
  'components/projects/SprintsTab': 'modules/project/components/SprintsTab',
  'components/projects/EpicsTab': 'modules/project/components/EpicsTab',
  'components/projects/DependenciesTab': 'modules/project/components/DependenciesTab',
  'components/projects/ActivityTab': 'modules/project/components/ActivityTab',
  'components/projects/TimeLogsTab': 'modules/project/components/TimeLogsTab',
  'components/projects/WatchersTab': 'modules/project/components/WatchersTab',
  'components/projects/ProjectAttachmentsTab': 'modules/project/components/ProjectAttachmentsTab',
  'components/projects/ProjectFormModal': 'modules/project/components/ProjectFormModal',
  'components/projects/MembersModal': 'modules/project/components/MembersModal',
  'components/projects/MembersPanel': 'modules/project/components/MembersPanel',
  'components/projects/TasksPanel': 'modules/project/components/TasksPanel',
  'components/projects/EpicsPanel': 'modules/project/components/EpicsPanel',
  'components/projects/SprintsPanel': 'modules/project/components/SprintsPanel',
  'components/projects/BoardView': 'modules/project/components/BoardView',
  'components/projects/BurndownChart': 'modules/project/components/BurndownChart',
  
  'components/dashboard/PriorityDistributionChart': 'modules/dashboard/components/PriorityDistributionChart',
  'components/dashboard/StatusDistributionChart': 'modules/dashboard/components/StatusDistributionChart',
  'components/dashboard/PriorityDistribution': 'modules/dashboard/components/PriorityDistribution',
  'components/dashboard/StatusChart': 'modules/dashboard/components/StatusChart',
  'components/dashboard/BurndownChart': 'modules/dashboard/components/BurndownChart',
  'components/dashboard/RecentActivity': 'modules/dashboard/components/RecentActivity',
  'components/dashboard/ActivityFeed': 'modules/dashboard/components/ActivityFeed',
  'components/dashboard/MyTasksList': 'modules/dashboard/components/MyTasksList',
  'components/dashboard/ProjectsOverview': 'modules/dashboard/components/ProjectsOverview',
  'components/dashboard/SprintProgressCard': 'modules/dashboard/components/SprintProgressCard',
  'components/dashboard/StatCard': 'modules/dashboard/components/StatCard',
  'components/dashboard/TeamWorkloadList': 'modules/dashboard/components/TeamWorkloadList',
  'components/dashboard/WeeklyTrendChart': 'modules/dashboard/components/WeeklyTrendChart',
  
  'components/labels/LabelsManager': 'modules/label/components/LabelsManager',
  'components/labels/LabelBadge': 'modules/label/components/LabelBadge',
  
  'lib/activityApi': 'modules/activity/api/activityApi',
  'lib/attachmentsApi': 'modules/attachment/api/attachmentsApi',
  'lib/commentsApi': 'modules/comment/api/commentsApi',
  'lib/dependenciesApi': 'modules/dependency/api/dependenciesApi',
  'lib/epicsApi': 'modules/epic/api/epicsApi',
  'lib/labelsApi': 'modules/label/api/labelsApi',
  'lib/notificationsApi': 'modules/notification/api/notificationsApi',
  'lib/projectsApi': 'modules/project/api/projectsApi',
  'lib/searchApi': 'modules/search/api/searchApi',
  'lib/sprintsApi': 'modules/sprint/api/sprintsApi',
  'lib/tasksApi': 'modules/task/api/tasksApi',
  'lib/timeLogsApi': 'modules/time-log/api/timeLogsApi',
  'lib/usersApi': 'modules/user/api/usersApi',
  'lib/watchersApi': 'modules/watcher/api/watchersApi',
  'lib/api': 'common/lib/api',
  'lib/utils': 'common/lib/utils',
  
  'context/AuthContext': 'common/context/AuthContext',
  'data/types': 'common/types/types'
};

const srcDir = path.resolve(__dirname, 'src');

const newToOldMap = Object.entries(map).reduce((acc, [oldPath, newPath]) => {
  acc[newPath] = oldPath;
  return acc;
}, {});
newToOldMap['App'] = 'App';
newToOldMap['main'] = 'main';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk(srcDir, (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  let relToSrc = path.relative(srcDir, filePath).replace(/\\/g, '/').replace(/\.tsx?$/, '');
  
  // If it's not mapped to a new location, it means it didn't move
  let currentFileOldPath = newToOldMap[relToSrc] || relToSrc;

  const newContent = content.replace(/(import\s+[^'"]*from\s+['"])([^'"]+)(['"])/g, (match, prefix, importPath, suffix) => {
    if (!importPath.startsWith('.')) return match;
    
    const oldDir = path.dirname(currentFileOldPath);
    let absoluteOldTarget = path.join(oldDir, importPath).replace(/\\/g, '/');
    
    // If the target didn't move either, newTarget is the same as absoluteOldTarget
    let newTarget = map[absoluteOldTarget] || absoluteOldTarget;
    
    const currentNewDir = path.dirname(relToSrc);
    let newRelative = path.relative(currentNewDir, newTarget).replace(/\\/g, '/');
    if (!newRelative.startsWith('.')) {
      newRelative = './' + newRelative;
    }
    
    return prefix + newRelative + suffix;
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated imports in ' + relToSrc);
  }
});
