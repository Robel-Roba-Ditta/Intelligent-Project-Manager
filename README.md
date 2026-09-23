<div align="center">

# IPM — Intelligent Project Management System

**A full-stack, cross-platform project management platform built from the ground up.**

One backend. Two clients. Complete feature parity.

![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-Expo_57-000020?logo=expo&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## Overview

IPM is a Jira/Linear-inspired system for planning and tracking work across projects.
Organize work into projects, break it down into epics, sprints, and tasks, assign
responsibility, enforce workflows, and visualize progress — from a high-level dashboard
down to a single task's activity history.

The system is built as a **monorepo with three packages**: a NestJS backend API, a React
web application, and a React Native mobile app. Both clients share the same backend and
a common `@ipm/shared` TypeScript package for API functions and type definitions — zero
duplication between platforms.

---

## Architecture

```
                  ┌──────────────┐     ┌──────────────┐
                  │  Web Client  │     │ Mobile Client │
                  │  React 19    │     │ React Native  │
                  │  Vite + TW   │     │   Expo 57     │
                  └──────┬───────┘     └──────┬────────┘
                         │                     │
                         │  @ipm/shared        │
                         │  (types + API)      │
                         ▼                     ▼
                  ┌────────────────────────────────────┐
                  │       NestJS Backend API            │
                  │  REST + JWT Auth + WebSocket        │
                  │  16 modules · RBAC · Workflow       │
                  └────────────────┬───────────────────┘
                                   │
                              ┌────▼────┐
                              │ Postgres │
                              │  16 DB   │
                              └──────────┘
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | NestJS 11, TypeORM, PostgreSQL 16, Passport JWT, bcrypt, Socket.io, class-validator, Expo Server SDK |
| **Web Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router v7, Recharts, @dnd-kit, Lucide icons |
| **Mobile App** | React Native, Expo SDK 57, React Navigation, React Native SVG, AsyncStorage, Socket.io Client |
| **Shared** | `@ipm/shared` — Axios API client factory, TypeScript DTOs, endpoint functions for all 16 modules |
| **Testing** | Vitest, React Testing Library, custom E2E journey test script |

---

## Features

### Core Project Management
- Project CRUD with activation/deactivation (soft-disable)
- Epics for high-level goal grouping
- Sprint lifecycle — create, start, complete with enforced single-active rule
- Burndown charts for sprint progress tracking

### Task Management
- Full task CRUD with title, description, status, priority, due date
- Assign to project members · Subtask hierarchy via parent/child links
- Colored labels — create, attach, detach
- Kanban board with drag-and-drop (web) and tap-to-move (mobile)
- **Workflow enforcement** — illegal status transitions rejected server-side

### Collaboration
- Threaded comments on tasks
- Link-based file attachments
- Watch/unwatch tasks for notifications
- Task dependencies (blocking/blocked-by)
- Auto-generated activity history for every action

### Time & Progress Tracking
- Log hours per task with running totals
- Sprint burndown with planned vs. actual progress
- Dashboard with 9 real-time widgets and aggregate charts

### Notifications
- Real-time delivery via WebSocket (no polling)
- Native push notifications on mobile (Expo Server SDK)
- Bell icon with unread count, mark-as-read

### Search
- Global search across projects and tasks
- Multi-filter: status, priority, assignee, sprint, keyword

### Access Control (RBAC)
Three-tier per-project role system — **Owner → Admin → Member** — plus site-wide admin.

| Action | Member | Admin | Owner |
|---|:---:|:---:|:---:|
| View project, tasks, sprints, epics | ✅ | ✅ | ✅ |
| Create/edit tasks, comments, time logs, labels | ✅ | ✅ | ✅ |
| Edit project details, manage members | ❌ | ✅ | ✅ |
| Manage Admins and Owners | ❌ | ❌ | ✅ |
| Delete project | ❌ | ❌ | ✅ |

All permissions enforced at the API layer — not just hidden in the UI.

---

## Backend Modules

The backend is organized into 16 independent NestJS modules:

| Module | Responsibility |
|---|---|
| Auth | Registration, login, JWT issuance |
| User | User management, account activation, push token storage |
| Project | Project CRUD, membership, role assignment |
| Epic | Epic CRUD, task grouping |
| Sprint | Sprint lifecycle, burndown data |
| Task | Task CRUD, status workflow, subtasks |
| Label | Colored labels, attach/detach |
| Comment | Threaded task comments |
| Attachment | Link-based file attachments |
| Watcher | Watch/unwatch tasks |
| Dependency | Task-blocks-task relationships |
| Time Log | Hours logging per task |
| Activity | Auto-generated audit trail |
| Notification | In-app + push + WebSocket delivery |
| Dashboard | Aggregated stats and chart data |
| Search | Cross-project keyword search |

---

## Project Structure

```
IPM/
├── backend/                  NestJS API server
│   └── src/modules/          16 feature modules
├── frontend/                 React web application
│   ├── src/modules/          16 feature modules (matching backend)
│   └── src/test/             22 integration test suites
├── mobile/                   React Native / Expo app
│   └── src/
│       ├── screens/          10 screens + 5 project tabs
│       ├── context/          Auth state + push token
│       └── navigation/       Tab + stack navigators
├── shared/                   @ipm/shared package
│   └── src/endpoints/        16 API endpoint modules
└── test-journeys.mjs         Cross-platform E2E test script
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **PostgreSQL** 16+ running locally
- A database named `pms_db`

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # edit DB_PASSWORD and JWT_SECRET
npm run start:dev            # → http://localhost:3000
```

The database schema auto-creates on first connection.

### 2. Web Frontend

```bash
cd frontend
npm install
npm run dev                  # → http://localhost:5173
```

### 3. Mobile App

```bash
cd mobile
npm install

# Set your machine's local IP (replace with yours)
# Windows PowerShell:
$env:EXPO_PUBLIC_API_URL = "http://YOUR_IP:3000"

npx expo start
```

Scan the QR code with **Expo Go** on your phone.

### First Login

The **first account registered** automatically becomes a site admin.
Create any email/password via Sign Up — no default accounts needed.

---

## Testing

### Integration Tests (22 suites)

```bash
cd frontend
npm run test
```

Tests run against a **live backend and database** — not mocks.

| Suite | Coverage |
|---|---|
| auth, rbac | Registration, login, logout, role enforcement |
| tasks, workflow, task-detail | CRUD, status transitions, detail rendering |
| dashboard, search, filters | Widgets, global search, multi-filter |
| sprints, epics | Lifecycle, burndown, grouping |
| comments, attachments, labels | Collaboration features |
| notifications, watchers, dependencies | Real-time, subscriptions, relationships |
| time-logs, activity | Tracking, audit trail |
| smoke, global-views | End-to-end user flows |

### Cross-Platform E2E (39 scenarios)

```bash
node test-journeys.mjs http://localhost:3000
```

Three user journeys testing data consistency across web and mobile clients.

---

## Design Highlights

- **Two-tier design** — dark animated auth pages, clean light Jira-inspired working app
- **Responsive** — adapts to desktop, tablet, and mobile viewports
- **Real-time** — WebSocket notifications with zero polling
- **Cross-platform** — single `@ipm/shared` package eliminates API duplication
- **Self-bootstrapping** — first user becomes admin, no manual DB seeding

---

## License

This project was built as a university capstone project.
</div>
