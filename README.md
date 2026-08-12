<div align="center">

# Intelligent Project Management System

**Plan sprints, assign work, and track progress as a team  a full-stack
project management platform built from the ground up.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Status](https://img.shields.io/badge/status-complete-1F9D7C)

</div>

---

## Overview

IPM is a Jira/Linear inspired system for planning and tracking work across
projects: organize work into projects, break it into epics, sprints, and
tasks, assign responsibility, move work through a controlled workflow, and
see where things stand at a glance from a single dashboard down to a
single task's activity history.

Every requirement in the original project brief is implemented, including
every item marked optional, plus a set of upgrades beyond what was asked
for (see [Beyond the brief](#-beyond-the-brief)).

## ✨ Features

### Project Management
- Create, edit, and delete projects
- Activate/deactivate projects (soft-disable rather than losing data)
- Manage project membership and per-project roles

### User & Access Management
- Email/password registration and login (JWT-based sessions)
- **Three-tier role system — Owner / Admin / Member** — per project, plus
  a site-wide Admin/Member role for platform-level management
- Activate/deactivate user accounts; a deactivated account is blocked at
  login, not just hidden in a list

### Task Management
- Full task CRUD: title, description, status, priority, due date
- Assign tasks to any member of the task's project
- Organize tasks under epics and sprints
- Subtasks via a parent/child link on the task itself
- Colored labels — create, attach/detach, shown as chips on every task
  card and in the task detail sidebar
- A dedicated task detail page: main content (title/description) plus a
  sidebar for every structured field and an activity feed beneath it

### Workflow Management
- A defined task lifecycle (To Do → In Progress → Done)
- Board view with per-status columns
- Illegal state jumps (e.g. To Do straight to Done) are rejected by the
  **backend itself** — not just prevented in the UI — via a dedicated
  status-transition endpoint

### Sprint / Iteration Planning
- Create and manage sprints as time-bound cycles
- Explicit Start/Complete actions (not a generic edit) that stamp the
  real start and end dates
- Only one active sprint per project at a time, enforced server-side
- Sprint goals and per-sprint task assignment

### Collaboration
- Threaded comments on tasks, author + timestamp, chronological order
- Link-based attachments (fileName + URL)
- Watch/unwatch a task to track it without being assigned
- Task dependencies — mark one task as blocking another; both tasks
  reflect the relationship from a single write
- Activity history generated automatically as a side effect of other
  actions (status changes, assignment, comments) rather than logged by
  hand from each feature

### Time & Progress Tracking
- Log hours against a task with a running total
- Planned vs. actual progress at the sprint level

### Dashboard & Visibility
- Project overview, task distribution by status/assignee/priority
- Sprint and project-level progress visualization
- Wired to real aggregate queries — the numbers reflect actual data

### Search & Filtering
- Filter by status, assignee, priority, and sprint — individually or
  combined
- Keyword search across tasks

### Insights & Analytics
- Completed vs. pending tasks, workload distribution per person
- Trends over time (weekly completion, sprint burndown)

### Notifications
- In-app notification on assignment and on status change
- Bell icon with a dropdown and mark-as-read
- Real-time delivery over WebSocket rather than polling

## 🚀 Beyond the brief

A few places this goes further than the original requirements asked for:

- **Real hierarchy, not a flat role.** The brief suggested a simple
  "e.g., Admin, Member" role. IPM implements a proper three-tier
  Owner → Admin → Member chain of authority per project — an Owner can
  manage Admins, an Admin can't touch another Admin or the Owner, and a
  project can never be left without at least one Owner.
- **RBAC enforced where it can't be bypassed.** Every permission check
  lives in the backend service layer, keyed off the acting user's actual
  rank on that specific project (with a site-admin override). The
  frontend hides controls a user can't use as good UX, but hiding a
  button is never the thing actually stopping the request — the API
  rejects it either way, verified by calling the API directly rather
  than trusting the UI.
- **Self-bootstrapping admin.** The very first account ever created on
  the system automatically becomes a site admin, so there's always a way
  to manage users without a manual database edit.
- **Workflow enforcement at the data layer.** Status transitions go
  through a dedicated endpoint that validates the move is legal, checked
  by attempting an illegal transition directly against the API — not just
  by confirming the UI doesn't offer the button.
- **Two-tier design system.** A distinct dark, motion-accented look for
  the sign-in experience and a clean, Jira-inspired white/light-blue
  interior for the working app, sharing one typographic and color
  language throughout rather than feeling like two different products
  stitched together.
- **Tested against a real backend, not mocks.** Frontend tests drive the
  actual UI — typing into real fields, clicking real buttons — against a
  live NestJS API and a live PostgreSQL database. A test passing means
  the feature actually works end to end.

## 🔐 Roles & Permissions

| Action | Member | Admin | Owner |
|---|:---:|:---:|:---:|
| View project, tasks, sprints, epics | ✅ | ✅ | ✅ |
| Create/edit tasks, comments, time logs, labels | ✅ | ✅ | ✅ |
| Edit project details, activate/deactivate | ❌ | ✅ | ✅ |
| Add/remove members, change **Member ↔ Admin** roles | ❌ | ✅ | ✅ |
| Manage other Admins or Owners | ❌ | ❌ | ✅ |
| Delete the project | ❌ | ❌ | ✅ |

A site-wide Admin (the account that bootstrapped the system, or anyone
promoted since) can manage any project regardless of their membership on
it.

## 🛠 Tech Stack

| | |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7 |
| **Backend** | NestJS 11, TypeORM, PostgreSQL 16 |
| **Real-time** | WebSocket (notifications) |
| **Auth** | JWT (Passport), bcrypt password hashing |
| **Validation** | class-validator / class-transformer |
| **Data viz** | Recharts |
| **Icons** | Lucide |
| **Testing** | Vitest, React Testing Library, direct API integration tests |

## 🏁 Getting Started

**Prerequisites:** Node.js (LTS), PostgreSQL, and a code editor.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # fill in DB_PASSWORD and JWT_SECRET
npm run start:dev         # http://localhost:3000

# 2. Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                # http://localhost:5173
```

The database schema is created automatically on first connection — no
manual migration step for local development.

### Running the tests

```bash
# Backend: direct API tests against a live server
cd backend && npm run start:dev &
node test-projects.mjs && node test-rbac.mjs

# Frontend: drives the real UI against the real backend
cd frontend && npm run test
```

## 📁 Project Structure

```
ipm/
├── backend/
│   └── src/
│       ├── auth/            registration, login, JWT strategy/guard
│       ├── users/            user entity, site-admin management
│       ├── projects/         projects, members, roles
│       ├── epics/            epics
│       ├── sprints/          sprints, start/complete actions
│       ├── tasks/            tasks, subtasks, status workflow, dependencies
│       ├── labels/            labels + task attachment
│       ├── comments/         task comments
│       ├── attachments/       link-based task attachments
│       ├── watchers/          task watch/unwatch
│       ├── time-logs/         time tracking per task
│       ├── activity/          auto-generated activity log
│       └── notifications/     assignment/status notifications, WebSocket gateway
└── frontend/
    └── src/
        ├── pages/            top-level routed pages
        ├── components/       layout, shared UI, and per-feature components
        ├── context/          auth state
        ├── lib/               typed API clients
        └── test/              integration test suites
```

