# IPM Mobile

React Native companion app built with **Expo SDK 57**, sharing the same NestJS
backend as the web frontend via the `@ipm/shared` package.

---

## Architecture

```
mobile/
├── App.tsx                         Navigation container + push tap handler
├── app.json                        Expo config (icon, splash, notifications)
├── src/
│   ├── context/AuthContext.tsx      Auth state + push token registration
│   ├── lib/
│   │   ├── api.ts                  Axios instance via @ipm/shared
│   │   └── authStorage.ts          AsyncStorage token persistence
│   ├── navigation/
│   │   └── RootNavigator.tsx       Bottom tabs + stack navigators
│   └── screens/
│       ├── HomeScreen.tsx          Dashboard (9 widgets, SVG charts)
│       ├── LoginScreen.tsx         Login form
│       ├── SignupScreen.tsx        Registration form
│       ├── ProjectsScreen.tsx      Project list + create
│       ├── ProjectDetailScreen.tsx Top tabs (Details/Members/Epics/Sprints/Tasks)
│       ├── TaskDetailScreen.tsx    Full task detail (11 sections)
│       ├── SearchScreen.tsx        Global search
│       ├── NotificationsScreen.tsx Notifications + live WebSocket updates
│       ├── ProfileScreen.tsx       User info + logout
│       └── project/
│           ├── DetailsTab.tsx      Project info + edit
│           ├── MembersTab.tsx      RBAC-aware member management
│           ├── EpicsTab.tsx        Epic CRUD
│           ├── SprintsTab.tsx      Sprint lifecycle + burndown chart
│           └── TasksTab.tsx        Task list + filters + Kanban board
```

---

## Screens

| Screen | Features |
|---|---|
| **Login / Signup** | Email + password auth, JWT stored in AsyncStorage |
| **Home** | 9 dashboard widgets: stat cards, status/priority charts, weekly trend, sprint progress, team workload, activity feed |
| **Projects** | Project list, create project, pull to refresh |
| **Project Detail** | 5 swipeable tabs — Details, Members, Epics, Sprints, Tasks |
| **Task Detail** | Status, priority, assignee, labels, comments, attachments, time logs, dependencies, activity feed, watcher toggle |
| **Search** | Full-screen search across projects and tasks |
| **Notifications** | Live WebSocket updates, mark as read |
| **Profile** | Avatar, user info, role badge, logout with confirmation |

---

## Running

```bash
cd mobile
npm install

# Set backend URL (replace with your machine's IP)
$env:EXPO_PUBLIC_API_URL = "http://YOUR_IP:3000"

npx expo start
```

Scan QR code with **Expo Go** on your phone.

---

## Platform Notes

- **Push notifications** require a development build — Expo Go removed push support in SDK 53+. In-app WebSocket notifications work in Expo Go.
- **Kanban board** uses tap-to-move (mobile UX pattern) instead of drag-and-drop.
- **Charts** use `react-native-svg` directly for full visual control.
- **Offline support** is not implemented — network connectivity required.
