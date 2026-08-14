<div align="center">
  <img src="./public/IPM-Logo.png" alt="IPM Logo" width="120" />
  
  # Intelligent Project Management (IPM) - Frontend

  <p>A modern, highly responsive, and beautiful project management interface.</p>

  [![React](https://img.shields.io/badge/React-19.0-blue?logo=react&logoColor=white)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
</div>

---

## 🌟 Overview

The frontend for the **Intelligent Project Management (IPM)** system is a feature-rich Single Page Application (SPA) designed for speed, usability, and a premium aesthetic. It provides users with powerful tools to manage Epics, Sprints, and Tasks, complete with dynamic board views, real-time activity feeds, notifications, and complex data visualization.

## 🚀 Features

* **Dynamic Dashboard**: Visualizes real-time metrics, sprint progress, weekly trends (via Recharts), and team workload.
* **Advanced Task Management**:
  * Seamlessly toggle between List and Kanban Board views.
  * Search and filter tasks by status, priority, assignee, and sprint.
  * Deep task details including comments, file attachments, dependencies, time logging, and watcher management.
* **Role-Based Access Control (RBAC)**: Interface adapts based on project roles (Owner, Admin, Member, Viewer).
* **Real-time Notifications**: Get alerted instantly when assigned to a task or when watched tasks are updated.
* **Activity Tracking**: Comprehensive event-driven activity logging for all project and task changes.

## 🛠️ Tech Stack

This project leverages modern frontend technologies for maximum performance and developer experience:

- **Core**: [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/) for blazing fast HMR and optimized builds.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) for utility-first styling.
- **Routing**: [React Router v7](https://reactrouter.com/) for declarative routing.
- **Data Fetching**: [Axios](https://axios-http.com/) for API communication.
- **Icons**: [Lucide React](https://lucide.dev/) for clean, consistent iconography.
- **Charts**: [Recharts](https://recharts.org/) for beautiful, responsive data visualizations.
- **Testing**: [Vitest](https://vitest.dev/) + React Testing Library for comprehensive end-to-end and unit testing.

## 📦 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) installed.

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the local development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

*(Note: The backend must be running simultaneously on port 3000 for full functionality).*

## 🧪 Testing

The frontend is backed by an extensive suite of over 100 end-to-end and component tests to ensure total reliability.

To run the test suite:
```bash
npm run test
```

To run tests in watch mode during development:
```bash
npm run test:watch
```

## 🏗️ Project Structure

```text
frontend/
├── public/                 # Static assets (including IPM-Logo)
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── dashboard/      # Dashboard widgets and charts
│   │   ├── layout/         # Topbar, Sidebar, AppShell
│   │   └── projects/       # Project boards, lists, and forms
│   ├── context/            # React contexts (e.g., AuthContext)
│   ├── data/               # Types and constants
│   ├── lib/                # API clients (axios wrappers) and utilities
│   ├── pages/              # Top-level route components
│   └── test/               # Vitest test suites
├── index.html              # Main HTML entry point
├── tailwind.css            # Global CSS and Tailwind directives
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies and scripts
```
