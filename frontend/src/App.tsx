import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './modules/auth/pages/Login';
import { Signup } from './modules/auth/pages/Signup';
import { Dashboard } from './modules/dashboard/pages/Dashboard';
import { ProjectsList } from './modules/project/pages/ProjectsList';
import { ProjectDetail } from './modules/project/pages/ProjectDetail';
import { TaskDetail } from './modules/task/pages/TaskDetail';
import { GlobalSprints } from './modules/sprint/pages/GlobalSprints';
import { MyTasks } from './modules/task/pages/MyTasks';
import { TeamDirectory } from './modules/user/pages/TeamDirectory';
import { ProtectedRoute, GuestRoute } from './common/components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectsList />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/sprints" element={<GlobalSprints />} />
        <Route path="/tasks" element={<MyTasks />} />
        <Route path="/team" element={<TeamDirectory />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
