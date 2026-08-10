# IPM — Authentication module

This is the first working feature of the Intelligent Project Management
System: account creation and login, with a NestJS + PostgreSQL backend and
a React + Tailwind frontend, connected by a JWT.

Everything in this package has been built and tested end-to-end already:
12 automated checks against the live backend (registration, duplicate
emails, wrong passwords, protected routes, token validation) and 7
automated checks that drive the actual React UI — filling in the forms and
clicking the actual "Create account" / "Log in" / "Log out" buttons —
against that same live backend. All 19 pass. Section 6 shows you how to
re-run them yourself once it's set up.

---

## 0. What you're installing

Three separate pieces of software, all free:

1. **Node.js** — lets your computer run JavaScript/TypeScript outside a
   browser. Both the backend and frontend run on it.
2. **PostgreSQL** — the database that stores users.
3. **VS Code** — the code editor you'll work in.

If you already have any of these, skip that step.

---

## 1. Install Node.js

1. Go to **https://nodejs.org**
2. Download the **LTS** version (not "Current") for your OS.
3. Run the installer, accepting the defaults.
4. Verify it worked — open a terminal (Windows: **Command Prompt** or
   **PowerShell**; Mac: **Terminal**) and run:
   ```
   node --version
   npm --version
   ```
   You should see version numbers (Node 20 or newer is fine). If you get
   "command not found", restart your computer and try again — the
   installer needs a fresh terminal session to update your PATH.

## 2. Install VS Code

1. Go to **https://code.visualstudio.com**
2. Download and install for your OS.
3. Open VS Code, go to the **Extensions** icon in the left sidebar
   (or `Ctrl+Shift+X` / `Cmd+Shift+X`), and install:
   - **ESLint** (by Microsoft)
   - **Tailwind CSS IntelliSense** (by Tailwind Labs)
   - **PostgreSQL** (by Chris Kolkman) — optional, lets you browse the
     database from inside VS Code

## 3. Install PostgreSQL

1. Go to **https://www.postgresql.org/download/**
2. Pick your OS and follow the installer.
3. **Windows/Mac installer will ask you to set a password for the
   `postgres` user — write this down, you'll need it in a moment.**
4. Keep the default port (`5432`).
5. Verify it worked — in a terminal:
   ```
   psql --version
   ```
   If `psql` isn't found on Windows, use the **SQL Shell (psql)** app
   that the installer added to your Start Menu instead — it's the same
   tool, just pre-configured.
6. Create the database this project uses. Open `psql` (or the SQL Shell)
   and run:
   ```sql
   CREATE DATABASE pms_db;
   ```
   Type `\q` to exit.

## 4. Open the project in VS Code

1. Unzip the file you downloaded from this chat.
2. In VS Code: **File → Open Folder…** and select the unzipped
   `pms-project` folder. You should see `backend/` and `frontend/` in
   the sidebar.
3. Open a terminal **inside VS Code**: **Terminal → New Terminal**. This
   opens a terminal already pointed at the project — use this for every
   command below instead of a separate terminal window.

## 5. Configure and run the backend

In the VS Code terminal:

```bash
cd backend
npm install
```

This downloads all the packages the backend needs (~1-2 minutes).

Now create your environment file:

```bash
cp .env.example .env
```

Open the new `.env` file in VS Code and fill in the two values that
matter:

- `DB_PASSWORD` — the postgres password you set in Step 3
- `JWT_SECRET` — any long random string. You can generate one by
  running this in the terminal and pasting the result in:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

Start the backend:

```bash
npm run start:dev
```

You should see NestJS log lines ending in something like
`Backend running on http://localhost:3000`. **Leave this terminal
running** — this is your live server. TypeORM automatically creates the
`users` table in `pms_db` the first time it connects, so there's nothing
else to set up.

**Quick sanity check** — open a *second* VS Code terminal
(`Terminal → New Terminal`) and run:

```bash
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d "{\"email\":\"you@example.com\",\"password\":\"password123\",\"fullName\":\"Your Name\"}"
```

You should get back JSON with a `user` object and an `accessToken`. If
you get "connection refused," the backend isn't running yet — check the
first terminal for errors (almost always a wrong `DB_PASSWORD`).

## 6. Configure and run the frontend

Open a **third** terminal (keep the backend running in the first one):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

VS Code will show a link like `http://localhost:5173` — `Ctrl+Click`
(Windows/Linux) or `Cmd+Click` (Mac) it to open the app in your browser.
You should land on the login page with the split dark/light layout.
Try creating an account — it's talking to your real backend and
database right now.

### Re-running the automated tests yourself

With the backend running (Step 5), open another terminal:

```bash
cd frontend
npm run test
```

This drives the real Login and Signup pages the same way a person
would — typing into fields and clicking buttons — against your live
backend, and reports pass/fail for each scenario.

---

## Project structure

```
pms-project/
├── backend/                  NestJS API
│   └── src/
│       ├── auth/             register / login / JWT / route guard
│       ├── users/             User entity + database queries
│       └── main.ts           app entry point
└── frontend/                 React + Tailwind UI
    └── src/
        ├── pages/            Login.tsx, Signup.tsx, Dashboard.tsx
        ├── context/          AuthContext.tsx - shared login state
        ├── components/       AuthLayout, FormField, Button, route guards
        ├── lib/api.ts        talks to the backend
        └── test/             the 7 automated UI tests
```

## What's already decided, and why

- **PostgreSQL, not SQLite** — matches the assignment's required stack
  and the data model you already designed with your supervisor.
- **JWT in `localStorage`** — simplest mental model for a first pass
  (no cookie/CORS complexity). The tradeoff: a JWT in `localStorage` is
  readable by any JS that runs on your page, so it's more exposed to XSS
  than an httpOnly cookie. Fine for a course project; worth knowing if
  this ever goes to production.
- **Role and active/inactive status are on the User already** (defaulting
  every signup to `member` / active) even though nothing in the UI
  exposes them yet — the assignment's role-based access and
  active/inactive-user features will need them, and adding a column
  later means a migration instead of just building on what's there.
- One dependency pin worth knowing about: this environment shipped with
  TypeScript 7 by default, which NestJS's build tooling doesn't support
  yet, so the backend pins `typescript@^6`. If a future `npm install`
  ever pulls in TypeScript 7 again, `nest build` will fail with a clear
  error telling you to reinstall `typescript@^6`.

## Next features to build on this

Project management, sprints, and tasks are the natural next slices —
each one is a NestJS module (entity + service + controller) plus a
React page, following the exact same pattern `auth/` and `Login.tsx`
already establish.
