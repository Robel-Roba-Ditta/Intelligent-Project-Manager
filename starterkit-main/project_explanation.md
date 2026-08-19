# 🎓 Guide to the NestJS Enterprise Starter Kit

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Folder Structure](#3-folder-structure)
4. [File-by-File Explanation](#4-file-by-file-explanation)
5. [Code Explanation](#5-code-explanation)
6. [Important Concepts](#6-important-concepts)
7. [Execution Flow](#7-execution-flow)
8. [Dependencies](#8-dependencies)
9. [Learning Guide](#9-learning-guide)
10. [Visualization](#10-visualization)
11. [Summary & Self-Check Questions](#11-summary--self-check-questions)

---

## 1. Project Overview

### What is the main purpose of this project?

Imagine you're building a house. You *could* start from scratch every time — dig the foundation, wire the electricity, install plumbing. Or, you could buy a **pre-built house frame** that already has all of that done, and just focus on decorating the rooms and making it yours.

This project is that **pre-built house frame** — but for software. It's called a **"starter kit"**, which means it gives developers a head start when they need to build a web application. Instead of spending weeks setting up user accounts, security, database connections, and other boring-but-essential things, a developer can use this starter kit and jump straight into building the unique features their app needs.

Specifically, this is a **backend application** — the invisible engine that powers websites and mobile apps. When you open Instagram and see your feed, a backend server somewhere is fetching your photos from a database and sending them to your phone. This project is the blueprint for building that kind of server.

### What problem does it solve?

Every time a developer starts a new project, they face the same repetitive setup tasks:

| Problem | How this project solves it |
|---------|--------------------------|
| "How do I let users register and log in?" | ✅ Built-in user registration, login with secure tokens |
| "How do I protect certain pages from unauthorized users?" | ✅ Built-in security guards and role-based access |
| "How do I store data safely?" | ✅ Pre-configured database connection with safe migration system |
| "How do I organize my code so it doesn't become a mess?" | ✅ Clear folder structure following Clean Architecture |
| "How do I make my API documentation?" | ✅ Auto-generated interactive API documentation |
| "How do I run all the required services?" | ✅ Docker setup that starts everything with one command |

### Who are the intended users?

The intended users are **software developers** (specifically backend developers) who want to build professional web applications using the NestJS framework and TypeScript language. This is particularly useful for:

- **Development teams** in companies who need a standardized starting point
- **Solo developers** who want to skip repetitive setup work
- **Learners** who want to study how a professional project is organized

### What happens when someone uses this application?

When a developer uses this starter kit, here's what they get out of the box:

1. **A running web server** that listens for requests (like a restaurant waiter waiting for orders)
2. **User management** — the ability to create, view, update, and delete users
3. **Role management** — the ability to create roles (like "admin", "editor", "viewer") and assign them to users
4. **Blog post management** — a sample feature showing how to add your own features
5. **Interactive API documentation** — a webpage where you can test all the features by clicking buttons
6. **A database** to store all the data permanently
7. **Monitoring tools** — dashboards to watch how the application is performing

> **Summary:** This is a pre-built backend application framework. It's like a house with the plumbing, wiring, and foundation already done — developers just need to add their own rooms (features). It comes with user management, security, a database, and monitoring, all ready to go.

> **Self-check questions:**
> - Can you explain in your own words what a "starter kit" is?
> - What's the difference between a "frontend" and a "backend"?
> - Why would a developer use this instead of building from scratch?

---

## 2. High-Level Architecture

### How the project works from start to finish

Think of this application like a **restaurant**:

| Restaurant Analogy | Application Part |
|---|---|
| 🚪 The front door | The **API endpoints** — where requests come in |
| 👨‍🍳 The waiter | The **Controller** — receives the request and passes it to the kitchen |
| 🍳 The kitchen | The **Service** — does the actual work (cooking = business logic) |
| 🧊 The refrigerator | The **Repository** — gets ingredients (data) from storage |
| 🗄️ The pantry | The **Database** — where all the ingredients (data) are stored permanently |
| 📋 The menu | **Swagger/API Docs** — tells customers (developers) what's available |
| 🔒 The bouncer | **Auth Guard** — checks if you're allowed to enter |

### The flow of data through the system

Here's what happens step by step when someone sends a request (for example, "Give me the list of all users"):

```
1. User/App sends HTTP request
         ↓
2. Helmet middleware adds security headers
         ↓
3. CORS middleware checks if the request source is allowed
         ↓
4. Logging interceptor starts a timer
         ↓
5. Validation Pipe checks: "Is this request properly formatted?"
         ↓
6. Auth Guard checks: "Does this person have a valid login token?"
         ↓
7. Controller receives the request and figures out what to do
         ↓
8. Service performs the business logic (the actual work)
         ↓
9. Repository talks to the database to get/save data
         ↓
10. Database returns the data
         ↓
11. Response is formatted into a standardized JSON shape
         ↓
12. Logging interceptor records how long it took
         ↓
13. User/App receives the response
```

### How the different components communicate

The components talk to each other in a **one-way chain**, like a bucket brigade:

```
Controller  →  Service  →  Repository  →  Database
   ↑                                         |
   |_________________________________________|
                  (response flows back)
```

- The **Controller** never talks to the database directly
- The **Service** never handles HTTP requests directly
- The **Repository** never contains business logic

This separation is intentional — it keeps things organized and easy to change later.

### Step-by-step workflow when the application starts

1. **Node.js** reads [main.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/main.ts) — this is the first file that runs
2. **OpenTelemetry** starts up (monitoring/tracing system)
3. **NestJS creates the application** by reading [app.module.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/app.module.ts)
4. **Database connection** is established to PostgreSQL
5. **All modules load**: UserModule, BlogModule, ObservabilityModule
6. **Swagger documentation** is generated automatically
7. **Security** (Helmet, CORS) is activated
8. **Validation** is turned on globally
9. **API versioning** is set up (`/api/v1/...`)
10. **The server starts listening** on the configured port (default: 8090)
11. **Admin user is seeded** — if no admin user exists in the database, one is created automatically

> **Summary:** The application works like a restaurant. Requests come in through the front door (API), a waiter (Controller) takes the order, the kitchen (Service) prepares it, ingredients are fetched from the refrigerator (Repository/Database), and the meal (response) is served back. A bouncer (Auth Guard) checks everyone at the door.

> **Self-check questions:**
> - Can you trace what happens when you send a request to create a new user?
> - Why doesn't the Controller talk to the database directly?
> - What is the first file that runs when the application starts?

---

## 3. Folder Structure

Here's a visual map of every folder and what it's for:

```
starterkit-main/
├── src/                          ← 🏠 All the application source code lives here
│   ├── main.ts                   ← 🚀 The "front door" — the application starts here
│   ├── app.module.ts             ← 🧩 The "master blueprint" — connects all pieces together
│   │
│   ├── common/                   ← 🧰 Shared toolbox used by every module
│   │   ├── collection-query/     ← 🔍 Search, filter, sort, and paginate tools
│   │   ├── decorators/           ← 🏷️ Custom labels (annotations) for code
│   │   ├── dto/                  ← 📦 Data shape definitions (shared)
│   │   ├── filters/              ← 🚨 Error handling tools
│   │   ├── guards/               ← 🛡️ Security checkpoints
│   │   └── response-format/      ← 📋 Standardized response wrappers
│   │
│   ├── database/                 ← 🗄️ Database configuration and migrations
│   │   ├── data-source.ts        ← 🔌 Database connection settings
│   │   └── migrations/           ← 📝 Database change history
│   │
│   ├── modules/                  ← 📁 Feature-specific code
│   │   ├── user/                 ← 👤 Everything about users and roles
│   │   │   ├── api/              ← 🌐 HTTP endpoints (controllers, DTOs, responses)
│   │   │   ├── application/      ← 🧠 Business logic (services)
│   │   │   ├── domain/           ← 📊 Data models (entities)
│   │   │   └── infrastructure/   ← 🔧 Database access (repositories)
│   │   │
│   │   └── blog/                 ← 📝 Example blog feature (same structure)
│   │       ├── api/
│   │       ├── application/
│   │       ├── domain/
│   │       └── infrastructure/
│   │
│   └── observability/            ← 📊 Monitoring, logging, and metrics
│
├── test/                         ← 🧪 Test files
├── dist/                         ← 📦 Compiled output (generated, not edited by hand)
├── node_modules/                 ← 📚 Downloaded libraries (generated, not edited)
│
├── .env / .env.example           ← 🔐 Secret settings (passwords, keys)
├── Dockerfile                    ← 🐳 Instructions to build a Docker container
├── docker-compose.yaml           ← 🐳 Instructions to run ALL services together
├── package.json                  ← 📋 Project manifest (name, scripts, dependencies)
├── tsconfig.json                 ← ⚙️ TypeScript compiler settings
└── nest-cli.json                 ← ⚙️ NestJS-specific settings
```

### Why does each folder exist?

| Folder | Real-World Analogy | Why It Exists |
|--------|-------------------|---------------|
| `src/` | The actual house | Contains all the code that makes the application work |
| `src/common/` | A shared toolbox in the garage | Holds reusable tools that every room (module) needs |
| `src/common/guards/` | Security cameras and locks | Protects certain areas from unauthorized access |
| `src/common/filters/` | A fire alarm system | Catches and handles errors across the whole application |
| `src/common/decorators/` | Sticky notes and labels | Adds special behaviors to functions and classes |
| `src/common/collection-query/` | A librarian's search system | Lets you search, filter, sort, and page through data |
| `src/common/dto/` | Order forms | Defines the shape of data shared across modules |
| `src/common/response-format/` | Standardized report templates | Ensures all responses look the same |
| `src/database/` | The building's foundation | Sets up and manages the database |
| `src/database/migrations/` | Renovation permits | Records every change made to the database structure |
| `src/modules/` | Individual rooms in the house | Each module is a self-contained feature |
| `src/modules/user/` | The HR office | Manages everything about users and roles |
| `src/modules/blog/` | The newsletter office | Example feature showing blog post management |
| `src/observability/` | Security cameras and monitoring room | Tracks performance, logs events, records metrics |
| `test/` | Quality inspection reports | Contains tests to verify the code works correctly |
| `dist/` | The finished, painted house | Compiled JavaScript code ready to run |
| `node_modules/` | Building materials warehouse | Downloaded libraries the project needs |

> **Summary:** The project is organized like a well-designed building. Shared tools go in `common/`, each feature gets its own folder in `modules/`, database stuff goes in `database/`, and monitoring tools go in `observability/`. Each module follows the same internal structure (api → application → domain → infrastructure) to keep things predictable.

> **Self-check questions:**
> - If you wanted to add a "Products" feature, where would you create the folder?
> - What's the difference between `common/` and `modules/`?
> - Why is `dist/` not something you edit by hand?

---

## 4. File-by-File Explanation

### 📁 Root Configuration Files

---

#### [package.json](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/package.json)

- **What it does:** This is the project's **identity card and instruction manual**. It lists the project name, all the libraries it needs, and all the commands you can run.
- **Why it's needed:** Without this file, the computer wouldn't know what libraries to download or how to start the project.
- **When it's used:** Every time you run `npm install` (to download libraries) or `npm run start:dev` (to start the server).
- **What happens if removed:** The project cannot be installed, started, or managed. Nothing works.

---

#### [tsconfig.json](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/tsconfig.json)

- **What it does:** Configures the **TypeScript compiler** — the tool that translates TypeScript code into JavaScript that the computer can actually run.
- **Why it's needed:** TypeScript has many settings (like how strict to be, where to put compiled files, what shortcut paths to use). This file sets all those preferences.
- **Key feature — Path Aliases:** This file defines shortcuts like `@common/*` → `./src/common/*`. So instead of writing `import { Util } from '../../../common/util'`, you can write `import { Util } from '@common/util'`. It's like setting up speed-dial on your phone.
- **What happens if removed:** TypeScript won't know how to compile the code. The project won't build.

---

#### [.env.example](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/.env.example) / .env

- **What it does:** Stores **secret settings** like database passwords, security keys, and port numbers.
- **Real-world analogy:** Think of it as a **combination lock code** — you need it to open the safe, but you'd never write it on the outside of the safe.
- **Why there are two files:** `.env.example` is a **template** that's safe to share (it shows what settings are needed). `.env` contains the **real secrets** and should never be shared.
- **What happens if removed:** The application won't know where the database is, what passwords to use, or which port to listen on. It will crash on startup.

---

#### [Dockerfile](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/Dockerfile)

- **What it does:** Contains step-by-step instructions for building a **Docker container** — a packaged, portable version of the application.
- **Real-world analogy:** If your application were a meal, the Dockerfile is the **recipe**. Docker follows the recipe to "cook" a container that can run anywhere.
- **What happens if removed:** You can't use Docker to run the application (but you can still run it directly with Node.js).

---

#### [docker-compose.yaml](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/docker-compose.yaml)

- **What it does:** Defines how to start **multiple services at once** — the application server, the database (PostgreSQL), the cache (Redis), file storage (MinIO), and monitoring tools (Grafana, Prometheus, Loki, Jaeger).
- **Real-world analogy:** If each service is a musician, Docker Compose is the **orchestra conductor** that tells everyone when to start, how loud to play, and how to communicate.
- **What happens if removed:** You'd have to start each service manually, one by one, and configure them to talk to each other yourself.

---

#### [nest-cli.json](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/nest-cli.json)

- **What it does:** Configures the NestJS command-line tool. It tells NestJS where the source code is (`src/`) and to delete old compiled files before building new ones.
- **What happens if removed:** NestJS CLI commands (`nest build`, `nest start`) might not work correctly.

---

### 📁 src/ — The Application Source Code

---

#### [main.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/main.ts) — ⭐ THE ENTRY POINT

- **What it does:** This is **THE FIRST FILE** that runs. It's like turning the ignition key in a car. It creates the application, sets up security, configures API documentation, and starts the server.
- **Why it's needed:** Every application needs a starting point. This is it.
- **What it sets up:**
  1. OpenTelemetry (monitoring)
  2. Swagger API documentation
  3. Helmet (security headers)
  4. CORS (cross-origin access)
  5. Global error handling
  6. Input validation
  7. API versioning
- **Depends on:** [app.module.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/app.module.ts), [http-exception.filter.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/filters/http-exception.filter.ts), [otel.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/observability/otel.ts)
- **What happens if removed:** The application literally cannot start. Game over.

---

#### [app.module.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/app.module.ts) — THE MASTER BLUEPRINT

- **What it does:** This is the **central nervous system** of the application. It registers all modules (User, Blog, Observability), sets up the database connection, and configures the event system.
- **Real-world analogy:** If the application were a school, this file would be the **principal's office** — it knows about every classroom (module) and coordinates everything.
- **Why it's needed:** NestJS needs one "root module" that connects all the pieces together.
- **Depends on:** Every module in the project (BlogModule, UserModule, ObservabilityModule)
- **What happens if removed:** NestJS has no modules to load. The application starts but does absolutely nothing.

---

### 📁 src/common/ — The Shared Toolbox

---

#### [common.entity.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/common.entity.ts) — THE BASE TEMPLATE

- **What it does:** Defines the **common fields** that EVERY database table should have: a unique ID, creation date, update date, who created it, who updated it, and soft-delete tracking.
- **Real-world analogy:** It's like a **standard form header** that every document in an office must have (date, author, document ID).
- **Why it's needed:** Without this, you'd have to manually add these 7 fields to every single entity. That's repetitive and error-prone.
- **Used by:** Every entity in the project (UserEntity, RoleEntity, PostEntity, UserRoleEntity)
- **What happens if removed:** Every entity would lose its ID, timestamps, and audit fields. The entire database structure breaks.

---

#### [base.repository.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/base.repository.ts) — THE UNIVERSAL DATA ACCESS TOOL

- **What it does:** Provides **reusable database operations** — get all records, get by ID, insert, update, delete, soft-delete (archive), and restore.
- **Real-world analogy:** It's a **universal TV remote** — it works with any TV brand (entity type) and has all the basic buttons (operations) you need.
- **Why it's needed:** Without this, every repository (UserRepository, PostRepository, RoleRepository) would have to write the same database code from scratch.
- **Used by:** [user.repository.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/infrastructure/user.repository.ts), [role.repository.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/infrastructure/role.repository.ts), [post.repostitory.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/blog/infrastructure/post.repostitory.ts)
- **What happens if removed:** Every repository loses all its database operations. You'd have to rewrite them individually.

---

#### [base.repository.interface.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/base.repository.interface.ts) — THE CONTRACT

- **What it does:** Defines a **contract** (interface) that lists what operations every repository must support.
- **Real-world analogy:** It's like a **job description** — it says "whoever takes this job must be able to do these specific tasks."
- **Why it's needed:** Ensures consistency. If a repository doesn't implement all required methods, TypeScript will show an error during development.
- **What happens if removed:** Repositories would still work, but you'd lose the guarantee that they all have the same set of operations.

---

#### [util.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/util.ts) — THE SWISS ARMY KNIFE

- **What it does:** A collection of **helper functions** used throughout the project:
  - `hashPassword()` — scrambles a password so it's safe to store
  - `comparePassword()` — checks if a typed password matches the stored scrambled version
  - `generateToken()` — creates a login token (like a temporary ID badge)
  - `generateRefreshToken()` — creates a longer-lasting token
  - `formatNumber()` — makes numbers look nice (1234567 → "1,234,567")
  - `numberToWord()` — converts numbers to words (1234 → "One Thousand Two Hundred Thirty Four")
  - `formatDateWithDayName()` — formats dates nicely
  - File system helpers — read, check, and delete files
- **Used by:** [user.service.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/application/user.service.ts) and potentially any service
- **What happens if removed:** Password hashing breaks, token generation breaks, user registration and login stop working.

---

#### [current-user.dto.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/current-user.dto.ts) — THE ID BADGE

- **What it does:** Defines the **shape of the logged-in user's information**. After someone logs in, this is the data the system remembers about them.
- **Real-world analogy:** It's like the information printed on a **company ID badge** — name, email, photo, role.
- **Used by:** Auth Guard, controllers (via `@CurrentUser()` decorator)
- **What happens if removed:** The system wouldn't know what information to extract from the login token.

---

#### [auth.guard.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/guards/auth.guard.ts) — THE BOUNCER

- **What it does:** Checks every incoming request for a valid **login token**. If the token is missing or fake, the request is rejected with a "401 Unauthorized" error.
- **Real-world analogy:** A **nightclub bouncer** who checks everyone's ID at the door. No ID = no entry.
- **Special feature:** If a route is decorated with `@AllowAnonymous()`, the bouncer steps aside and lets anyone in.
- **Depends on:** [allow-anonymous.decorator.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/decorators/allow-anonymous.decorator.ts), [current-user.dto.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/current-user.dto.ts)
- **What happens if removed:** All routes become either completely open (anyone can access) or you'd need to add security checks manually to every single route.

---

#### [role.guard.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/guards/role.guard.ts) — THE VIP CHECKER

- **What it does:** After the bouncer (AuthGuard) lets someone in, the RoleGuard checks if that person has the **right role** for a specific action. For example, only "admin" users can delete other users.
- **Real-world analogy:** You've entered the building, but this guard checks if you have a **VIP pass** to enter the executive lounge.
- **Special feature:** Users with the role `super_admin` automatically pass all role checks.
- **What happens if removed:** Any authenticated user could access any endpoint, regardless of their role.

---

#### [http-exception.filter.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/filters/http-exception.filter.ts) — THE ERROR HANDLER

- **What it does:** Catches **ALL errors** in the application and formats them into a consistent, clean response. Without this, errors would look different depending on where they happened.
- **Real-world analogy:** A **customer service representative** who takes any complaint and writes it up in a standard form, regardless of how the customer expressed it.
- **Output format:**
  ```json
  {
    "success": false,
    "error": {
      "code": "NOT_FOUND",
      "message": "User not found with id abc123"
    }
  }
  ```
- **What happens if removed:** Errors would be inconsistent and harder to handle on the frontend.

---

#### [allow-anonymous.decorator.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/decorators/allow-anonymous.decorator.ts) — THE "OPEN DOOR" SIGN

- **What it does:** A label you put on a route to say "this route is public, no login required."
- **Real-world analogy:** A sign on a store door that says **"Walk-ins Welcome — No Appointment Needed."**
- **Used by:** The user registration endpoint (you can't require login to register!)
- **What happens if removed:** You can't mark any routes as public. Every route would require authentication.

---

#### [current-user.decorator.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/decorators/current-user.decorator.ts) — THE "WHO AM I?" SHORTCUT

- **What it does:** Lets a controller easily grab the **currently logged-in user's information** from the request with a simple annotation.
- **Instead of:** `const user = request.user;`
- **You write:** `@CurrentUser() user: CurrentUserDto`
- **What happens if removed:** Controllers would have to manually dig into the request object to find the user data.

---

#### [match.decorator.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/decorators/match.decorator.ts) — THE "DO THESE MATCH?" CHECKER

- **What it does:** A validation tool that checks if two fields match. For example, ensuring "password" and "confirm password" are the same.
- **What happens if removed:** You'd lose the ability to validate field matching in forms.

---

#### [collection-query.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/collection-query/collection-query.ts) — THE SEARCH FORM

- **What it does:** Defines the **shape of a search request**. When you want to search, filter, sort, or paginate through a list of items, you fill out this "form" with your preferences.
- **Real-world analogy:** It's like the **advanced search page** on Amazon — you can specify category, price range, sort order, and how many items per page.
- **Key parameters:** `top` (how many), `skip` (start from where), `search` (search term), `filter` (conditions), `orderBy` (sort order), `includes` (related data to load)

---

#### [query-constructor.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/collection-query/query-constructor.ts) — THE SEARCH ENGINE

- **What it does:** Takes the search form (CollectionQuery) and **translates it into an actual database query**. It's the engine that powers filtering, sorting, pagination, and text search.
- **Real-world analogy:** If CollectionQuery is a customer's order slip, the QueryConstructor is the **chef who reads the slip and makes the dish**.
- **What happens if removed:** You'd lose all searching, filtering, sorting, and pagination capabilities.

---

#### [filter-operators.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/collection-query/filter-operators.ts) — THE FILTER MENU

- **What it does:** Lists all the **comparison operations** you can use in filters: equals, not equals, greater than, less than, contains, between, etc.
- **Real-world analogy:** The list of options in a dropdown menu: "equals", "contains", "starts with", etc.

---

#### [data-response-format.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/response-format/data-response-format.ts) — THE STANDARD ENVELOPE

- **What it does:** Defines how **list responses** should look. Every list response includes: `success` (boolean), `count` (total items), `data` (the items), `pageNumber`, and `pageSize`.
- **Real-world analogy:** A standardized **shipping box** — no matter what you put inside, the outside always has the same label format.

---

#### [file-dto.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/dto/file-dto.ts) & [user-address.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/common/dto/user-address.ts) — DATA SHAPES

- **What they do:** Define the shape of a file (name, type, size) and a user's address (country, state, city).
- **Why they're separate:** These shapes are used in multiple places, so they live in the shared `common/dto/` folder.

---

### 📁 src/database/ — The Foundation

---

#### [data-source.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/database/data-source.ts) — THE DATABASE CONNECTION

- **What it does:** Defines **how to connect to the PostgreSQL database** and which entities (tables) the database contains.
- **Why it's separate from app.module.ts:** This file is used by the **command-line migration tool** (which runs outside the application). The app module uses its own configuration for runtime.
- **Critical:** Every new entity must be registered here for migrations to work.
- **What happens if removed:** Database migrations (schema changes) stop working.

---

#### migrations/ folder — THE RENOVATION HISTORY

Contains three migration files that record database changes:
1. **AddPostTable** — Created the `posts` table
2. **add-user-and-role-tables** — Created `users`, `roles`, and `user_roles` tables
3. **rename-auditing-related-columns** — Renamed some columns for consistency

Each migration has an `up` method (apply the change) and a `down` method (undo the change).

---

### 📁 src/modules/user/ — The User Feature

---

#### [user.module.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/user.module.ts) — THE REGISTRATION DESK

- **What it does:** Registers everything related to users: the controllers (endpoints), services (business logic), repositories (data access), and entities (data models).
- **Real-world analogy:** The **department directory** — it lists everyone who works in the User department and what they do.

---

#### [user.entity.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/domain/user.entity.ts) — THE USER DATA MODEL

- **What it does:** Defines what a **User** looks like in the database: first name, last name, email, password, phone, job title, gender, profile picture, active status, date of birth, address, and roles.
- **Real-world analogy:** A **personnel file template** — it lists every piece of information you'd store about an employee.
- **Special features:**
  - Password is marked with `@Exclude()` so it's never accidentally sent in responses
  - Address and profile picture are stored as JSON (a flexible format)
  - Has methods to add, update, and remove roles

---

#### [role.entity.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/domain/role.entity.ts) — THE ROLE DATA MODEL

- **What it does:** Defines a **Role** with a name (e.g., "Administrator"), a unique key (e.g., "admin"), a description, and an active status.

---

#### [user-role.entity.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/domain/user-role.entity.ts) — THE CONNECTION TABLE

- **What it does:** Connects users to roles. One user can have multiple roles, and one role can be assigned to multiple users. This is called a **many-to-many relationship**, and this table is the bridge between them.
- **Real-world analogy:** A sign-up sheet where people write their name next to the clubs they belong to.

---

#### [user.repository.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/infrastructure/user.repository.ts) — THE USER DATA ACCESS

- **What it does:** Extends BaseRepository specifically for User data. It inherits all the standard operations (get, insert, update, delete) without writing any extra code.
- **Only 16 lines long!** That's the power of the BaseRepository — all the heavy lifting is already done.

---

#### [user.service.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/application/user.service.ts) — THE USER BRAIN

- **What it does:** Contains all the **business logic** for users:
  - Create a user (with duplicate email check and password hashing)
  - Update a user
  - Archive a user (soft-delete)
  - Restore an archived user
  - Permanently delete a user
  - Get one user or a list of users (with search, filter, pagination)
  - Manage user roles (add, update, remove)
  - **Seed a default admin** on first startup
- **Most important file** for the user feature — it's where all the rules live.

---

#### [user.controller.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/api/controllers/user.controller.ts) — THE USER WAITER

- **What it does:** Defines all the **HTTP endpoints** (URLs) for user operations:
  - `GET /api/v1/users` — Get all users
  - `GET /api/v1/users/get-user/:id` — Get one user
  - `POST /api/v1/users` — Create a user (public)
  - `PUT /api/v1/users` — Update a user
  - `DELETE /api/v1/users/archive` — Soft-delete a user
  - `DELETE /api/v1/users/:id` — Permanently delete a user
  - `POST /api/v1/users/restore/:id` — Restore an archived user
  - And more for user roles...
- **Does NOT contain business logic** — it just receives requests and passes them to the service.

---

#### [user.command.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/api/dto/user.command.ts) — THE USER ORDER FORM

- **What it does:** Defines the **shape of data required** to create or update a user. It includes validation rules (e.g., email must be a valid email, first name is required).
- **Contains a `toEntity` method:** Translates the incoming request data into a UserEntity that can be saved to the database.

---

#### [user.response.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/api/responses/user.response.ts) — THE USER RECEIPT

- **What it does:** Defines the **shape of data returned** to the client after a user operation. Notice it does NOT include the password — the password is never sent back.
- **Contains a `toResponse` method:** Translates a UserEntity from the database into a safe response to send to the client.

---

### 📁 src/modules/blog/ — The Blog Feature (Example Module)

The blog module follows the **exact same structure** as the user module, just simpler:

| User Module Equivalent | Blog Module File | Purpose |
|---|---|---|
| user.module.ts | [blog.module.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/blog/blog.module.ts) | Registers blog components |
| user.entity.ts | [post.entity.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/blog/domain/post.entity.ts) | Defines a Post (title, description) |
| user.repository.ts | [post.repostitory.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/blog/infrastructure/post.repostitory.ts) | Data access for posts |
| user.service.ts | [post.service.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/blog/application/post.service.ts) | Business logic for posts |
| user.controller.ts | [post.controller.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/blog/api/controllers/post.controller.ts) | HTTP endpoints for posts |
| user.command.ts | [post.command.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/blog/api/dto/post.command.ts) | Input shape for creating/updating posts |
| user.response.ts | [post.response.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/blog/api/responses/post.response.ts) | Output shape for post data |

The blog module exists as a **reference implementation** — a working example showing developers how to add their own features.

---

### 📁 src/observability/ — The Monitoring System

---

#### [otel.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/observability/otel.ts) — THE GPS TRACKER

- **What it does:** Sets up **OpenTelemetry** — a system that tracks the path of every request through the application. If something goes wrong, you can trace exactly where it happened.
- **Real-world analogy:** A GPS tracker on a delivery truck — you can see exactly where the package went.

---

#### [logger.service.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/observability/logger.service.ts) — THE DIARY

- **What it does:** Provides structured **logging** in JSON format. Every log entry includes: timestamp, severity level, which service generated it, the message, and a correlation ID.
- **Real-world analogy:** A **ship's logbook** — records everything that happens, when, and who was involved.

---

#### [logging.interceptor.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/observability/logging.interceptor.ts) — THE STOPWATCH

- **What it does:** Automatically measures **how long every request takes** and logs the result.
- **Real-world analogy:** A **drive-through timer** that records how long each car took from ordering to receiving their food.

---

#### [correlation.middleware.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/observability/correlation.middleware.ts) — THE TRACKING NUMBER

- **What it does:** Assigns a unique **tracking number** (called a "correlation ID") to every request. This lets you follow a single request through all the logs.
- **Real-world analogy:** The **tracking number** on a package — you can use it to find where your package is at any point.

---

#### [prometheus-metrics.controller.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/observability/prometheus-metrics.controller.ts) & [metrics.providers.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/observability/metrics.providers.ts) — THE DASHBOARD GAUGES

- **What they do:** Expose an endpoint (`/api/metrics`) where **Prometheus** (a monitoring tool) can scrape performance data like "total number of HTTP requests."
- **Real-world analogy:** The **gauges on a car dashboard** — speed, fuel level, engine temperature.

---

> **Summary:** Every file has a specific job. Entry files (`main.ts`, `app.module.ts`) start the application. Common files provide shared tools. Module files (entities, repositories, services, controllers) handle specific features. Observability files monitor everything.

> **Self-check questions:**
> - Which file would you modify to add a new API endpoint?
> - Which file would you modify to change the database connection?
> - What's the difference between a "service" and a "controller"?

---

## 5. Code Explanation

### The Application Startup — [main.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/main.ts) Line by Line

```typescript
import './observability/otel';
```
**Line 1:** Before anything else, start the monitoring system (OpenTelemetry). This is imported first because it needs to hook into everything else.

```typescript
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
```
**Lines 2-3:** Import the "factory" that builds NestJS apps, and import our master blueprint (AppModule).

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
```
**Line 4:** Import tools to build the interactive API documentation page.

```typescript
async function bootstrap() {
```
**Line 14:** Define a function called `bootstrap` — this is the startup sequence. The word `async` means "this function does things that take time (like connecting to a database) and will wait for them."

```typescript
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
```
**Line 15:** **Create the application.** This is like saying "build me an Express.js web server using the AppModule blueprint." The `await` keyword means "wait until it's fully built before continuing."

```typescript
  const config = new DocumentBuilder()
    .setTitle('StarterKit API')
    .setDescription('The StarterKit API description')
    .setVersion('1.0')
    .addTag('StarterKit')
    .setContact('Aemiro Mekete', ...)
    .addBearerAuth()
    .build();
```
**Lines 16-27:** Configure the Swagger documentation page — set its title, description, version, and add a "login with token" button.

```typescript
  app.setGlobalPrefix('api');
```
**Line 30:** Make all URLs start with `/api`. So instead of `/users`, it becomes `/api/users`.

```typescript
  app.use(helmet());
```
**Line 31:** Enable **Helmet** — a security tool that adds protective headers to every response. It's like putting a helmet on every response to protect against common web attacks.

```typescript
  app.enableCors();
```
**Line 32:** Enable **CORS** — allow requests from other websites/apps. Without this, a browser would block requests from a different domain.

```typescript
  app.useGlobalFilters(new HttpExceptionFilter(app.get(EventEmitter2)));
```
**Line 34:** Set up the global error handler. Every error, no matter where it happens, goes through this filter to get a consistent format.

```typescript
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
```
**Lines 39-42:** Turn on **automatic input validation**. Every incoming request is checked against the rules defined in the DTOs (like "email must be a valid email"). The `transform: true` option automatically converts incoming data to the right types.

```typescript
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
```
**Lines 45-48:** Enable **API versioning**. URLs now include a version number: `/api/v1/users`. This allows the team to create `/api/v2/users` in the future without breaking existing clients.

```typescript
  await app.listen(process.env.PORT ?? 3000);
```
**Line 49:** **Start listening for requests** on the port specified in the `.env` file (or port 3000 if not specified). This is like opening the restaurant's doors.

```typescript
bootstrap();
```
**Line 55:** Actually **call the bootstrap function** — press the start button!

---

### Creating a User — How the Code Flows

Let's trace what happens when someone sends a POST request to create a new user:

**Step 1: The Controller receives the request** — [user.controller.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/api/controllers/user.controller.ts#L55-L60)

```typescript
@Post()                                    // This handles POST requests
@ApiOkResponse({ type: UserResponse })     // Swagger: "the response looks like this"
@AllowAnonymous()                          // No login required (you can't require login to register!)
async createUser(@Body() createUserCommand: CreateUserCommand) {
    return await this.userService.createUser(createUserCommand);
}
```

- `@Post()` — "When someone sends a POST request to `/api/v1/users`, run this function"
- `@Body()` — "Take the data from the request body and put it in `createUserCommand`"
- `@AllowAnonymous()` — "Anyone can access this, no login needed"
- The controller does nothing except pass the data to the service

**Step 2: The Service does the work** — [user.service.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/application/user.service.ts#L65-L76)

```typescript
async createUser(command: CreateUserCommand): Promise<UserResponse> {
    // Convert the incoming data into a database entity
    const userDomain = CreateUserCommand.toEntity(command);

    // Check if a user with this email already exists
    if (command.email && (await this.userRepository.getOneBy('email', command.email, [], true))) {
        throw new BadRequestException(`User already exist with this email`);
    }

    // Scramble the password before storing it
    userDomain.password = Util.hashPassword(command.password);

    // Save the user to the database
    const user = await this.userRepository.insert(userDomain);

    // Convert the database entity to a safe response (without password)
    return UserResponse.toResponse(user);
}
```

This is where the real logic happens:
1. Convert incoming data to database format
2. Check for duplicate email (throw error if found)
3. Hash (scramble) the password for security
4. Save to database
5. Return a safe response (without the password)

---

> **Summary:** The code follows a clear pattern: Controllers receive requests and delegate to Services. Services contain the business rules and delegate database work to Repositories. Data flows through DTOs (commands in, responses out) to keep things safe and organized.

> **Self-check questions:**
> - Why is the password hashed before storing it?
> - Why is the `createUser` endpoint marked as `@AllowAnonymous()`?
> - What happens if someone tries to register with an email that already exists?

---

## 6. Important Concepts

### API (Application Programming Interface)

**Simple definition:** A set of **rules and URLs** that let different software programs talk to each other.

**Analogy:** A restaurant menu. You (the customer/client) look at the menu (the API documentation) and place an order (send a request). The kitchen (the server) makes your food (processes the request) and brings it to you (sends a response). You don't need to know how the kitchen works — you just need to know what's on the menu.

**In this project:** The API is a set of URLs like `/api/v1/users` where you can send requests to create, read, update, and delete users.

---

### REST API (REpresentational State Transfer)

**Simple definition:** A specific style of API that uses **standard HTTP methods** (GET, POST, PUT, DELETE) to perform operations on resources.

**Analogy:** Think of a library system:
- **GET** `/books` = "Show me all the books" (reading)
- **POST** `/books` = "Add this new book" (creating)
- **PUT** `/books/123` = "Update book #123" (updating)
- **DELETE** `/books/123` = "Remove book #123" (deleting)

**In this project:** All endpoints follow REST conventions. `GET /api/v1/users` gets users, `POST /api/v1/users` creates a user.

---

### Database

**Simple definition:** An organized collection of data that persists (survives) even when the application restarts.

**Analogy:** A **filing cabinet**. When you turn off the lights and go home, the files are still there tomorrow. In contrast, data in your computer's memory (RAM) disappears when you restart.

**In this project:** PostgreSQL is the database. It stores users, roles, and blog posts in organized tables.

---

### Entity / Model

**Simple definition:** A blueprint that describes the **shape of data** in a database table. It defines what columns exist and what type of data each column holds.

**Analogy:** A **spreadsheet template**. Before you enter data, you decide the columns: "Name", "Email", "Phone", etc. The entity is that template.

**In this project:** [UserEntity](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/domain/user.entity.ts) defines the `users` table with columns like `first_name`, `email`, `password`, etc.

---

### Controller

**Simple definition:** The component that **receives HTTP requests** and decides what to do with them. It's the "front desk" of your application.

**Analogy:** A **hotel receptionist**. Guests (requests) arrive and tell the receptionist what they want. The receptionist doesn't clean rooms or cook food — they just pass the request to the right department (service).

**In this project:** [UserController](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/api/controllers/user.controller.ts) has methods like `getUser()`, `createUser()`, `updateUser()`.

---

### Service

**Simple definition:** The component that contains the **business logic** — the actual rules and processing.

**Analogy:** The **hotel manager**. The receptionist (controller) tells the manager "a guest wants a room upgrade." The manager checks if rooms are available, verifies the guest's loyalty status, processes the payment, and then tells the housekeeper (repository) to prepare the room.

**In this project:** [UserService](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/application/user.service.ts) handles logic like "check if email already exists before creating a user."

---

### Repository

**Simple definition:** The component that **talks to the database**. It handles reading from and writing to the database.

**Analogy:** A **librarian**. When the manager (service) says "find me the book with ID 123," the librarian walks to the correct shelf, finds the book, and brings it back.

**In this project:** [UserRepository](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/modules/user/infrastructure/user.repository.ts) extends BaseRepository and can perform getById, insert, update, delete, etc.

---

### Class

**Simple definition:** A **template** for creating objects. It defines what data (properties) and what actions (methods) an object has.

**Analogy:** A **cookie cutter**. The cutter (class) defines the shape, and each cookie you cut out (object) is an individual instance. All cookies have the same shape, but different decorations (data).

**In this project:** `UserEntity` is a class. Each actual user (like "John Doe" or "Jane Smith") is an object created from that class.

---

### Function

**Simple definition:** A reusable block of code that performs a specific task. You give it some input, it does some work, and gives you back an output.

**Analogy:** A **vending machine**. You put in money (input), press a button (call the function), and get a drink (output). Same machine, same process, every time.

**In this project:** `Util.hashPassword("mypassword")` is a function that takes a plain password and returns a scrambled version.

---

### Object

**Simple definition:** A specific **instance** of a class. It's a concrete thing with actual data.

**Analogy:** The cookie cutter is the class. A specific chocolate chip cookie is the object.

**In this project:** When you create a new user, `new UserEntity()` creates an object. When you set `user.firstName = "John"`, you're filling that object with data.

---

### DTO (Data Transfer Object)

**Simple definition:** A simple container that defines **what data should be included** when transferring information between parts of the application.

**Analogy:** An **order form** at a restaurant. It has specific fields (appetizer, main course, drink) that must be filled out. You can't add random fields, and some fields are required.

**In this project:** `CreateUserCommand` is a DTO that defines what data is needed to create a user (firstName, email, password, etc.).

---

### Dependency Injection

**Simple definition:** Instead of a component creating its own tools, the tools are **given to it** from the outside.

**Analogy:** Imagine you're a chef. Instead of going to the store to buy your own knives every morning, the restaurant (NestJS framework) **gives you the knives** when you start your shift. The chef just says "I need knives" and the restaurant provides them.

**In this project:** When UserService says `constructor(private readonly userRepository: UserRepository)`, it's saying "I need a UserRepository." NestJS automatically provides one.

---

### Middleware

**Simple definition:** Code that runs **in between** a request arriving and the controller handling it. It can modify the request, add data to it, or block it entirely.

**Analogy:** Airport security checkpoints between the entrance and the gate. Your luggage (request) passes through X-ray machines (middleware) that can inspect, modify, or reject it.

**In this project:** The correlation middleware adds a tracking ID to every request. Helmet middleware adds security headers.

---

### Authentication

**Simple definition:** The process of **proving who you are**. "Are you who you claim to be?"

**Analogy:** Showing your **ID card** at the airport. The guard checks if the photo matches your face and if the ID is valid (not expired, not fake).

**In this project:** Users authenticate by logging in and receiving a JWT token. Every subsequent request includes this token as proof of identity.

---

### Authorization (Role-Based Access Control / RBAC)

**Simple definition:** The process of **checking what you're allowed to do** after your identity is confirmed. "You are John, but are you allowed in this VIP area?"

**Analogy:** Having a **backstage pass** at a concert. Everyone has a general ticket (authentication), but only some people have backstage access (authorization).

**In this project:** The `RoleGuard` checks if a user has the right role (e.g., "admin") to access certain endpoints.

---

### Environment Variables

**Simple definition:** **Settings stored outside the code** that can be different for each computer or environment (development, testing, production).

**Analogy:** The **address on a letter**. The letter (code) stays the same, but the address (environment variable) changes depending on where you want to send it.

**In this project:** `POSTGRES_HOST=localhost` tells the app where the database is. In production, this might be `POSTGRES_HOST=db.company.com`.

---

### JWT (JSON Web Token)

**Simple definition:** A compact, encoded **digital pass** that proves someone is logged in. It's like a tamper-proof wristband at a festival.

**How it works:**
1. You log in with email and password
2. The server creates a JWT containing your user info
3. You include this JWT in every future request
4. The server verifies the JWT is valid (not expired, not tampered with)

**In this project:** `Util.generateToken()` creates access tokens (short-lived), and `Util.generateRefreshToken()` creates refresh tokens (long-lived).

---

### Docker

**Simple definition:** A tool that packages your application and all its dependencies into a **portable container** that runs the same everywhere.

**Analogy:** A **shipping container**. Whether it's on a truck, a train, or a ship, the container is the same and the contents are undisturbed. Docker containers work the same on your laptop, your colleague's laptop, and the production server.

**In this project:** The Dockerfile builds the application container, and docker-compose.yaml orchestrates the application plus its database, cache, and other services.

---

### Migration (Database Migration)

**Simple definition:** A **scripted, versioned change** to the database structure. Instead of manually changing the database, you write migration files that can be applied (and undone) in order.

**Analogy:** **Renovation permits** for a building. Each permit documents exactly what was changed, when, and how to undo it if needed.

**In this project:** Migration files in `src/database/migrations/` track every structural change to the database tables.

---

> **Summary:** These concepts are the building blocks of modern web development. Controllers are waiters, Services are chefs, Repositories are pantry keepers, DTOs are order forms, Guards are bouncers, and Middleware is airport security.

> **Self-check questions:**
> - Can you explain Dependency Injection in your own words?
> - What's the difference between authentication and authorization?
> - Why are environment variables stored outside the code?

---

## 7. Execution Flow

### Which file runs first?

**[main.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/main.ts)** — always. This is the entry point.

But before `main.ts` even runs its own code, it imports [otel.ts](file:///c:/Users/robel/Downloads/starterkit-main/starterkit-main/src/observability/otel.ts) on line 1. In JavaScript/TypeScript, imports are executed immediately, so **otel.ts actually runs first**.

### Complete startup sequence

```
1. otel.ts runs → starts OpenTelemetry monitoring

2. main.ts bootstrap() is called
   ├── 3. NestFactory.create(AppModule) is called
   │   ├── 4. app.module.ts is loaded
   │   │   ├── 5. dotenv loads .env file (database passwords, etc.)
   │   │   ├── 6. EventEmitterModule starts (for internal events)
   │   │   ├── 7. TypeOrmModule connects to PostgreSQL database
   │   │   ├── 8. BlogModule loads
   │   │   │   ├── PostEntity registered
   │   │   │   ├── PostRepository created
   │   │   │   ├── PostService created
   │   │   │   └── PostController registered
   │   │   ├── 9. UserModule loads
   │   │   │   ├── UserEntity, RoleEntity, UserRoleEntity registered
   │   │   │   ├── UserRepository, RoleRepository created
   │   │   │   ├── UserService created
   │   │   │   │   └── 10. onModuleInit() runs → seeds default admin user
   │   │   │   ├── RoleService created
   │   │   │   └── UserController, RoleController registered
   │   │   ├── 11. ObservabilityModule loads
   │   │   │   ├── AppLogger created
   │   │   │   └── LoggingInterceptor registered
   │   │   └── 12. PrometheusModule loads
   │   │       └── PrometheusMetricsController registered
   │   └── Application fully assembled ✅
   ├── 13. Swagger documentation is generated
   ├── 14. Global prefix 'api' is set
   ├── 15. Helmet security headers enabled
   ├── 16. CORS enabled
   ├── 17. Global exception filter set
   ├── 18. Global validation pipe set
   ├── 19. URI versioning enabled (v1)
   └── 20. Server starts listening on port 8090 🎉
```

### How a request moves through the system

Let's trace `GET /api/v1/users` (get all users):

```
Browser/Client
    │
    ▼
[HTTP Request: GET /api/v1/users?top=10&skip=0]
    │
    ▼
┌─────────────────────────────────┐
│ 1. Express receives the request │  ← The web server layer
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 2. Helmet adds security headers│  ← Middleware
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 3. CORS checks origin          │  ← Middleware
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 4. LoggingInterceptor starts   │  ← Interceptor (starts timer)
│    timer                        │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 5. ValidationPipe validates     │  ← Pipe
│    query parameters             │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 6. NestJS Router finds          │
│    UserController.getUsers()    │  ← Routing
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 7. UserController.getUsers()    │
│    passes query to UserService  │  ← Controller
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 8. UserService.getUsers()       │
│    - QueryConstructor builds    │  ← Service
│      SQL query from parameters  │
│    - Executes query via         │
│      TypeORM                    │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 9. PostgreSQL executes SQL      │  ← Database
│    SELECT * FROM users          │
│    LIMIT 10 OFFSET 0            │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 10. Results mapped to           │
│     UserResponse objects        │  ← Service (response mapping)
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 11. DataResponseFormat wraps    │
│     the results with count,     │  ← Response formatting
│     pageNumber, pageSize        │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 12. LoggingInterceptor logs     │  ← Interceptor (stops timer)
│     duration                    │
└─────────────┬───────────────────┘
              │
              ▼
[HTTP Response: 200 OK]
{
  "success": true,
  "count": 42,
  "data": [...],
  "pageNumber": 1,
  "pageSize": 10
}
```

> **Summary:** The application starts with `main.ts` → `app.module.ts` → loads all modules → seeds admin user → starts listening. Requests flow through middleware → guards → controllers → services → repositories → database, then the response flows back.

> **Self-check questions:**
> - What happens during step 10 of the startup sequence?
> - Why does the LoggingInterceptor appear twice in the request flow?
> - What would happen if the database is not running when the application starts?

---

## 8. Dependencies

### Core Dependencies

| Package | What It Does | Why It Was Chosen | Analogy |
|---------|-------------|-------------------|---------|
| **@nestjs/core** | The main NestJS framework | Provides the foundation for building the application | The steel frame of a building |
| **@nestjs/common** | Common NestJS utilities (decorators, pipes, guards) | Essential tools for building features | The basic tool kit |
| **@nestjs/platform-express** | Connects NestJS to Express.js (the HTTP engine) | Express is the most popular Node.js web server | The engine of the car |
| **typescript** | The programming language used in this project | Adds type safety to JavaScript (catches errors before running) | A spell-checker for code |

### Database

| Package | What It Does | Analogy |
|---------|-------------|---------|
| **typeorm** | Talks to the database using TypeScript objects instead of raw SQL | A translator between your code and the database |
| **@nestjs/typeorm** | Integrates TypeORM with NestJS | A plug that connects the translator to the framework |
| **pg** | The PostgreSQL driver (the actual connection library) | The cable that physically connects to the database |

### Security

| Package | What It Does | Analogy |
|---------|-------------|---------|
| **bcrypt** | Scrambles (hashes) passwords so they can't be read | A paper shredder — you can verify a document matches, but can't reconstruct it |
| **jsonwebtoken** | Creates and verifies JWT tokens | A stamp machine that creates tamper-proof wristbands |
| **@nestjs/jwt** | Integrates JWT with NestJS | The plug that connects the stamp machine to the framework |
| **passport** / **passport-jwt** | Authentication framework | The bouncer's handbook of procedures |
| **helmet** | Adds security HTTP headers | A suit of armor for every response |

### Validation

| Package | What It Does | Analogy |
|---------|-------------|---------|
| **class-validator** | Checks if incoming data follows the rules (e.g., "email must be valid") | A form validator at a government office |
| **class-transformer** | Converts plain JSON objects into typed class instances | A mold that shapes raw clay into a specific form |

### Documentation

| Package | What It Does | Analogy |
|---------|-------------|---------|
| **@nestjs/swagger** | Auto-generates interactive API documentation | An automatic menu generator for the restaurant |

### Monitoring

| Package | What It Does | Analogy |
|---------|-------------|---------|
| **@opentelemetry/sdk-node** | Distributed tracing (track requests across services) | GPS tracking for packages |
| **prom-client** / **@willsoto/nestjs-prometheus** | Expose performance metrics | Dashboard gauges in a car |
| **@nestjs/event-emitter** | In-process event system | An internal intercom system |

### Utility

| Package | What It Does | Analogy |
|---------|-------------|---------|
| **rxjs** | Reactive programming library (handles async data streams) | A conveyor belt that processes items as they arrive |
| **dotenv** | Loads `.env` file settings | A settings reader |
| **to-words** | Converts numbers to words | A number-to-text translator |
| **reflect-metadata** | Enables TypeScript decorators | The foundation that makes @annotations work |

---

> **Summary:** The project uses NestJS as its framework, TypeORM for database access, bcrypt/JWT for security, class-validator for input checking, Swagger for documentation, and OpenTelemetry/Prometheus for monitoring. Each package was chosen because it's well-tested, widely used, and integrates well with NestJS.

> **Self-check questions:**
> - Why is bcrypt used instead of storing passwords as plain text?
> - What would you use instead of PostgreSQL? (Hint: MySQL, SQLite, MongoDB)
> - Why does the project need both `typeorm` and `pg`?

---

## 9. Learning Guide

### 🟢 Beginner Level — Learn These First

These are the absolute foundations. Don't skip them.

| Order | Concept | Why | Estimated Time |
|-------|---------|-----|----------------|
| 1 | **JavaScript Basics** | Everything is built on JavaScript | 2-4 weeks |
| 2 | **TypeScript Basics** | This project is written in TypeScript | 1-2 weeks |
| 3 | **What is a Server / HTTP** | Understand how the web works | 2-3 days |
| 4 | **JSON** | The data format used everywhere in this project | 1 day |
| 5 | **npm (Node Package Manager)** | How to install and manage libraries | 1 day |
| 6 | **Node.js Basics** | The runtime that executes the code | 1 week |

### 🟡 Intermediate Level — Learn These Next

These are needed to understand how the project works.

| Order | Concept | Why |
|-------|---------|-----|
| 7 | **REST APIs** | The communication style this project uses |
| 8 | **NestJS Fundamentals** | The framework the project is built with |
| 9 | **Databases & SQL** | How data is stored and queried |
| 10 | **TypeORM** | How this project talks to the database |
| 11 | **Authentication (JWT)** | How login and security work |
| 12 | **Object-Oriented Programming (Classes, Inheritance)** | The coding paradigm used throughout |
| 13 | **Decorators** | The `@Something()` syntax used everywhere in NestJS |
| 14 | **Dependency Injection** | How NestJS connects components together |

### 🔴 Advanced Level — Learn These Last

These are needed to master the project and build on it.

| Order | Concept | Why |
|-------|---------|-----|
| 15 | **Clean Architecture** | The organizational principle behind the folder structure |
| 16 | **Database Migrations** | How to safely change the database structure |
| 17 | **Docker & Docker Compose** | How to containerize and deploy the application |
| 18 | **Guards, Interceptors, Pipes, Middleware** | The NestJS request lifecycle |
| 19 | **OpenTelemetry & Prometheus** | Monitoring and observability |
| 20 | **Generic Types (Generics)** | The `<T>` syntax used in BaseRepository |
| 21 | **Testing (Jest)** | How to write automated tests |
| 22 | **CI/CD and Deployment** | How to deploy the application to production |

### 📍 Learning Roadmap Visualization

```
WEEK 1-4: JavaScript & TypeScript
    │
    ▼
WEEK 5-6: Node.js & npm & HTTP
    │
    ▼
WEEK 7-8: REST APIs & NestJS Basics
    │
    ▼
WEEK 9-10: Databases, SQL, TypeORM
    │
    ▼
WEEK 11-12: Authentication, Guards, OOP
    │
    ▼
WEEK 13-14: Clean Architecture, Migrations
    │
    ▼
WEEK 15-16: Docker, Monitoring, Testing
    │
    ▼
    🎉 You fully understand this project!
```

---

## 10. Visualization

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT / BROWSER                          │
│                   (Sends HTTP requests to API)                    │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                    HTTP Request (JSON)
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NESTJS APPLICATION                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     MIDDLEWARE LAYER                        │  │
│  │  Helmet → CORS → Correlation ID → Validation              │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                       │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │                      GUARD LAYER                           │  │
│  │  AuthGuard (JWT verification) → RoleGuard (permissions)    │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                       │
│  ┌────────────────────────▼───────────────────────────────────┐  │
│  │                   CONTROLLER LAYER                         │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐   │  │
│  │  │UserController│  │RoleController │  │PostController│   │  │
│  │  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘   │  │
│  └─────────┼─────────────────┼──────────────────┼────────────┘  │
│            │                 │                   │                │
│  ┌─────────▼─────────────────▼──────────────────▼────────────┐  │
│  │                    SERVICE LAYER                           │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐   │  │
│  │  │ UserService  │  │ RoleService   │  │ PostService  │   │  │
│  │  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘   │  │
│  └─────────┼─────────────────┼──────────────────┼────────────┘  │
│            │                 │                   │                │
│  ┌─────────▼─────────────────▼──────────────────▼────────────┐  │
│  │                  REPOSITORY LAYER                          │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐   │  │
│  │  │UserRepository│  │RoleRepository │  │PostRepository│   │  │
│  │  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘   │  │
│  │         └─────────────────┼──────────────────┘            │  │
│  │                    ┌──────▼────────┐                      │  │
│  │                    │BaseRepository │  ← shared CRUD       │  │
│  │                    └──────┬────────┘                      │  │
│  └───────────────────────────┼───────────────────────────────┘  │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                       SQL Queries (via TypeORM)
                               │
                               ▼
                 ┌──────────────────────────┐
                 │     PostgreSQL Database   │
                 │  ┌────────┐ ┌──────────┐│
                 │  │ users  │ │  roles   ││
                 │  ├────────┤ ├──────────┤│
                 │  │ posts  │ │user_roles││
                 │  └────────┘ └──────────┘│
                 └──────────────────────────┘
```

### Module Dependency Diagram

```
                    ┌─────────────┐
                    │ app.module   │ ← The root, connects everything
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────────┐
          │                │                    │
    ┌─────▼──────┐  ┌──────▼──────┐  ┌─────────▼──────────┐
    │ UserModule  │  │ BlogModule  │  │ObservabilityModule │
    └─────┬──────┘  └──────┬──────┘  └────────────────────┘
          │                │                    ▲
          │                │                    │
          │                └────────────────────┘
          │                  (BlogModule imports
          │                   ObservabilityModule)
          │
          ▼
    ┌───────────────────────────────────────────┐
    │               common/ (shared)             │
    │  BaseRepository, Guards, Filters, DTOs,    │
    │  CollectionQuery, ResponseFormat, Util     │
    └───────────────────────────────────────────┘
```

### Clean Architecture Layers (per module)

```
┌─────────────────────────────────────────────────┐
│                  API Layer                       │
│   Controllers, DTOs (Commands), Response shapes  │
│   "What can the outside world ask for?"          │
├─────────────────────────────────────────────────┤
│              APPLICATION Layer                   │
│   Services (business logic, validation, rules)   │
│   "How do we process those requests?"            │
├─────────────────────────────────────────────────┤
│                DOMAIN Layer                      │
│   Entities (data models), repository interfaces  │
│   "What does our data look like?"                │
├─────────────────────────────────────────────────┤
│            INFRASTRUCTURE Layer                  │
│   Repository implementations, external adapters  │
│   "How do we actually store/retrieve data?"      │
└─────────────────────────────────────────────────┘

    Dependency rule: outer layers depend on inner layers
    API → Application → Domain ← Infrastructure
```

### File Relationship Diagram

```
main.ts
  └── imports → app.module.ts
                  ├── imports → UserModule
                  │               ├── UserController
                  │               │    └── uses → UserService
                  │               │                 ├── uses → UserRepository
                  │               │                 │           └── extends → BaseRepository
                  │               │                 │                          └── uses → CommonEntity
                  │               │                 └── uses → QueryConstructor
                  │               ├── RoleController
                  │               │    └── uses → RoleService
                  │               │                 └── uses → RoleRepository
                  │               │                             └── extends → BaseRepository
                  │               └── entities: UserEntity, RoleEntity, UserRoleEntity
                  │
                  ├── imports → BlogModule
                  │               ├── PostController
                  │               │    └── uses → PostService
                  │               │                 ├── uses → PostRepository
                  │               │                 │           └── extends → BaseRepository
                  │               │                 ├── uses → QueryConstructor
                  │               │                 └── uses → AppLogger
                  │               └── entities: PostEntity
                  │
                  ├── imports → ObservabilityModule
                  │               ├── LoggingInterceptor
                  │               ├── AppLogger
                  │               └── MetricsProviders
                  │
                  └── imports → PrometheusModule
                                  └── PrometheusMetricsController
```

### Docker Services Diagram

```
┌──────────────────────────────────────────────────────┐
│                 docker-compose.yaml                   │
│                                                       │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    │
│  │  server   │    │ postgres  │    │   redis   │    │
│  │ (NestJS)  │───▶│ (Database)│    │  (Cache)  │    │
│  │ port:8090 │    │ port:5432 │    │ port:6380 │    │
│  └───────────┘    └───────────┘    └───────────┘    │
│                                                       │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    │
│  │   minio   │    │   loki    │    │ promtail  │    │
│  │ (Storage) │    │ (Log DB)  │    │(Log Agent)│    │
│  │ port:9000 │    │ port:3100 │    │           │    │
│  └───────────┘    └───────────┘    └───────────┘    │
│                                                       │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    │
│  │prometheus │    │  grafana  │    │  jaeger   │    │
│  │ (Metrics) │    │(Dashboard)│    │ (Tracing) │    │
│  │ port:9090 │    │ port:3000 │    │port:16686 │    │
│  └───────────┘    └───────────┘    └───────────┘    │
│                                                       │
│  All connected via: observability-net (bridge)        │
└──────────────────────────────────────────────────────┘
```

---

## 11. Summary & Self-Check Questions

### The Big Picture

This project is a **professional NestJS backend starter kit** that provides:

1. **A structured foundation** following Clean Architecture (api → application → domain → infrastructure)
2. **User management** with secure authentication and role-based access control
3. **A blog module** as a reference for adding new features
4. **Reusable tools** like BaseRepository, QueryConstructor, and standardized response formats
5. **Full observability** with logging, tracing, and metrics
6. **Docker orchestration** for running all services locally
7. **Auto-generated API documentation** via Swagger

### How to Think Like the Developer

The developer who built this project was guided by these principles:

1. **"Don't Repeat Yourself" (DRY)** — BaseRepository, CommonEntity, and shared DTOs prevent code duplication
2. **"Separation of Concerns"** — Each layer has one job (Controllers handle HTTP, Services handle logic, Repositories handle data)
3. **"Convention over Configuration"** — Every module follows the same folder structure, so developers know where to find things
4. **"Security First"** — Passwords are always hashed, tokens are used for auth, Helmet protects responses
5. **"Safe by Default"** — Database synchronize is `false` to prevent accidental data loss
6. **"Observable"** — Structured logging, tracing, and metrics are built in from the start

### Final Self-Check Questions

Ask yourself these to verify your understanding:

1. If you wanted to add a "Products" feature, what would you create?
   - *Answer: A new folder at `src/modules/product/` with `api/`, `application/`, `domain/`, and `infrastructure/` subfolders, following the same pattern as user or blog.*

2. What would break if you deleted `common.entity.ts`?
   - *Answer: Every entity (User, Role, UserRole, Post) would break because they all extend CommonEntity to get their ID, timestamps, and audit fields.*

3. Why is the password hashed before storing?
   - *Answer: So that if someone steals the database, they can't read anyone's actual password. They only see scrambled gibberish.*

4. What's the difference between "archive" (soft-delete) and "delete" (hard-delete)?
   - *Answer: Archive sets `deleted_at` to hide the record but keeps it in the database (recoverable). Delete permanently removes it (gone forever).*

5. Why does every response go through `DataResponseFormat`?
   - *Answer: To ensure consistency. Every client that uses the API knows the response will always have `success`, `data`, `count`, `pageNumber`, and `pageSize`.*

---

> 🎉 **Congratulations!** If you've read through this entire guide, you now have a solid understanding of how a professional enterprise NestJS application is structured and why each piece exists. The next step is to experiment — try adding a new feature module by following the blog module as a template!
