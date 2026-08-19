# 🚀 NestJS Enterprise Starter Kit

> A production-ready, opinionated NestJS starter kit built for enterprise applications — featuring JWT authentication, role-based access control, TypeORM migrations, object storage, caching, and a fully documented REST API.

**Maintained by [Aemiro Mekete](https://www.linkedin.com/in/aemiro/) · [aemiromekete12@gmail.com](mailto:aemiromekete12@gmail.com)**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Start with Docker Compose](#3-start-with-docker-compose)
  - [4. Start in Development Mode](#4-start-in-development-mode)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [API Documentation](#api-documentation)
  - [API Versioning (NestJS)](#api-versioning-nestjs)
- [Available Scripts](#available-scripts)
- [Architecture Overview](#architecture-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Base Repository API](#base-repository-api)
- [CommonEntity & Audit Fields](#commonentity--audit-fields)
- [Custom Decorators](#custom-decorators)
- [Utility Helpers](#utility-helpers)
- [Default Admin Seed](#default-admin-seed)
- [Data Source & Entity Registration](#data-source--entity-registration)
- [Collection Query — Filtering, Sorting & Pagination](#collection-query--filtering-sorting--pagination)
- [API Response Formats](#api-response-formats)
- [Testing](#testing)
- [Docker](#docker)
- [Contributing](#contributing)

---

## Overview

This starter kit provides a solid, scalable foundation for building enterprise-grade REST APIs with NestJS. It follows **Clean Architecture** principles, separating concerns into `domain`, `application`, `infrastructure`, and `api` layers per module. It ships with battle-tested patterns for authentication, file storage, background caching, and structured error handling — so teams can focus on business logic from day one.

---

## Tech Stack

| Layer         | Technology                                         |
|---------------|----------------------------------------------------|
| Framework     | [NestJS v11](https://nestjs.com/) (Node.js 22)     |
| Language      | TypeScript 5                                       |
| Database      | PostgreSQL 17 via [TypeORM](https://typeorm.io/)   |
| Auth          | JWT (Access + Refresh Tokens) + Passport.js        |
| Object Storage| [MinIO](https://min.io/) (S3-compatible)           |
| Caching       | Redis                                              |
| API Docs      | Swagger / OpenAPI 3                                |
| Validation    | `class-validator` + `class-transformer`            |
| Security      | Helmet, CORS, Bcrypt                               |
| Containerization | Docker + Docker Compose                         |
| Testing       | Jest + Supertest                                   |
| Linting       | ESLint + Prettier                                  |

---

## Features

- ✅ **JWT Authentication** — Access & refresh token strategy with secure secret rotation
- ✅ **Role-Based Access Control (RBAC)** — Guard + decorator-driven role enforcement
- ✅ **TypeORM with Migrations** — Schema-safe migrations; `synchronize` is always `false`
- ✅ **Generic Base Repository** — Reusable CRUD abstractions with collection-query support
- ✅ **Swagger / OpenAPI** — Auto-generated, bearer-auth-enabled API docs at `/`
- ✅ **Global Exception Filter** — Structured HTTP error responses with event emission
- ✅ **Global Validation Pipe** — Request DTO validation with automatic transformation
- ✅ **MinIO Object Storage** — S3-compatible file upload & management
- ✅ **Redis Caching** — Out-of-the-box caching layer
- ✅ **Event Emitter** — Decoupled in-process events via `@nestjs/event-emitter`
- ✅ **URI API Versioning** — NestJS URI versioning with default `v1` under `/api/v1/...`
- ✅ **Helmet Security** — HTTP security headers applied globally
- ✅ **Docker Compose** — Full local dev stack (PostgreSQL, Redis, MinIO) with health checks
- ✅ **Path Aliases** — Clean imports via `@common`, `@user`, `@blog`, etc.

---

## Project Structure

```
src/
├── common/                     # Shared building blocks
│   ├── base.repository.ts      # Generic TypeORM repository with CRUD operations
│   ├── base.repository.interface.ts
│   ├── common.entity.ts        # Base entity (id, timestamps, audit *ById, soft-delete)
│   ├── collection-query/       # Pagination, filtering, sorting DTOs
│   ├── decorators/             # Custom decorators (e.g., @CurrentUser, @Public)
│   ├── dto/                    # Shared DTOs
│   ├── filters/                # Global HTTP exception filter
│   ├── guards/                 # Auth guard, Role guard
│   ├── interceptors/           # Response interceptors
│   ├── logger/                 # Custom logging utilities
│   ├── response-format/        # Standardized API response wrappers
│   └── util.ts                 # Shared utility functions
│
├── database/
│   ├── data-source.ts          # TypeORM DataSource (used for CLI migrations)
│   └── migrations/             # Database migration files
│
├── modules/
│   ├── user/                   # User management module
│   │   ├── api/                # Controllers, route handlers
│   │   ├── application/        # Use cases / services
│   │   ├── domain/             # Entities, value objects, repository interfaces
│   │   └── infrastructure/     # Repository implementations
│   │
│   └── blog/                   # Example blog module (reference implementation)
│       ├── api/
│       ├── application/
│       ├── domain/
│       └── infrastructure/
│
├── app.module.ts               # Root application module
└── main.ts                     # Bootstrap: Swagger, URI versioning, Helmet, CORS, global pipes
```

---

## Prerequisites

Ensure the following are installed on your system:

| Tool           | Minimum Version | Notes                        |
|----------------|-----------------|------------------------------|
| Node.js        | 22.x            | LTS recommended              |
| npm            | 10.x            |                              |
| Docker         | 24.x+           | Required for local services  |
| Docker Compose | 2.x+            | Bundled with Docker Desktop  |

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd starter-kit
```

### 2. Configure Environment Variables

Copy the example environment file and populate the values:

```bash
cp .env.example .env
```

> See [Environment Variables](#environment-variables) for a full description of each variable.

### 3. Start with Docker Compose

This will spin up the **NestJS server**, **PostgreSQL**, **Redis**, and **MinIO** with health checks:

```bash
docker compose up --build
```

- **API** is available at: `http://localhost:<PORT>/api/v1` (e.g. `/api/v1/users`)
- **Swagger Docs** at: `http://localhost:<PORT>/`
- **MinIO Console** at: `http://localhost:<MINIO_ACCESS_PORT>`

### 4. Start in Development Mode

If you prefer running the app locally (with services in Docker):

```bash
# Start infrastructure services only
docker compose up postgres redis minio -d

# Install dependencies
npm install

# Run the app in watch mode
npm run start:dev
```

---

## Environment Variables

All variables are defined in `.env.example`. Copy it to `.env` before starting.

### Application

| Variable              | Description                          | Default          |
|-----------------------|--------------------------------------|------------------|
| `PORT`                | HTTP server port                     | `8090`           |
| `BcryptHashRound`     | Bcrypt hashing rounds                | `11`             |
| `JWT_SECRET`          | Secret key for JWT signing           | —                |
| `REFRESH_SECRET_TOKEN`| Secret key for refresh token signing | —                |
| `RESET_PASSWORD_URL`  | Password reset endpoint path         | —                |
| `LOGIN_URL`           | Login endpoint path                  | —                |

### Database (PostgreSQL)

| Variable                  | Description                  | Default        |
|---------------------------|------------------------------|----------------|
| `POSTGRES_HOST`           | PostgreSQL host              | `localhost`    |
| `POSTGRES_PORT`           | PostgreSQL port              | `5432`         |
| `POSTGRES_USER`           | Database user                | `postgres`     |
| `POSTGRES_PASSWORD`       | Database password            | `postgres`     |
| `POSTGRES_DB`             | Database name                | `starterkit`    |
| `POSTGRES_CONTAINER_NAME` | Docker container name        | —              |
| `POSTGRES_IMAGE`          | Docker image tag             | `postgres:17`  |
| `DATABASE_SCHEMA`         | PostgreSQL schema            | `public`       |

### Object Storage (MinIO)

| Variable               | Description                         | Default              |
|------------------------|-------------------------------------|----------------------|
| `MINIO_HOST`           | MinIO host                          | `127.0.0.1`          |
| `MINIO_PORT`           | MinIO S3 API port                   | `9000`               |
| `MINIO_ACCESS_PORT`    | MinIO web console port              | `9010`               |
| `MINIO_USE_SSL`        | Enable SSL for MinIO                | `false`              |
| `MINIO_ACCESS_KEY`     | MinIO access key (root user)        | `admin`              |
| `MINIO_SECRET_KEY`     | MinIO secret key (root password)    | `password`           |
| `MINIO_BUCKET_NAME`    | Default bucket name                 | `starterkit`          |
| `MINIO_IMAGE`          | Docker image tag                    | `minio/minio:latest` |
| `MINIO_CONTAINER_NAME` | Docker container name               | —                    |

### Caching (Redis)

| Variable               | Description              | Default        |
|------------------------|--------------------------|----------------|
| `REDIS_PORT`           | Redis port               | `6380`         |
| `REDIS_IMAGE`          | Docker image tag         | `redis:latest` |
| `REDIS_CONTAINER_NAME` | Docker container name    | —              |

> ⚠️ **Security Notice:** Never commit a `.env` file containing real secrets to source control. Use a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault) in production.

---

## Database Migrations

This project uses TypeORM migrations exclusively. The `synchronize` flag is **permanently disabled** to prevent accidental data loss in production.

```bash
# Generate a migration from entity changes
npm run migration:generate --name=<MigrationName>

# Create an empty migration file
npm run migration:create --name=<MigrationName>

# Apply pending migrations
npm run migration:run

# Revert the last applied migration
npm run migration:revert

# List all migrations and their status
npm run migration:show
```

> Migration files are stored in `src/database/migrations/` and are automatically formatted with Prettier after generation.

---

## API Documentation

Interactive Swagger UI is available at the root URL once the server is running:

```
http://localhost:<PORT>/
```

All endpoints are documented with request/response schemas and support **Bearer Token** authentication directly in the UI.

REST routes use the global prefix **`/api`** plus a URI version segment (default **`v1`**). Example:

```
http://localhost:<PORT>/api/v1/users
```

### API Versioning (NestJS)

Versioning is enabled in [`src/main.ts`](src/main.ts) using NestJS built-in support:

```typescript
app.setGlobalPrefix('api');

app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```

#### How routes are built

With **`VersioningType.URI`**, NestJS inserts the version into the path **after** the global prefix:

| Piece | Example |
|-------|---------|
| Global prefix | `/api` |
| Version segment | `/v1` |
| Controller path | `/users` |
| **Full URL** | `/api/v1/users` |

The `v` prefix before the version number is NestJS default for URI versioning.

#### `defaultVersion` behavior

`defaultVersion: '1'` means controllers and handlers **without** an explicit `@Version()` decorator are registered as **version 1**. You do not need to add `@Version('1')` on every controller in this starter kit.

Existing controllers (e.g. `@Controller('users')`) resolve to `/api/v1/users`, not `/api/users`. Requests to the unversioned path will **not** match those handlers.

#### Adding or overriding a version

Use the `@Version()` decorator from `@nestjs/common` when you need a non-default version:

```typescript
import { Controller, Get, Version } from '@nestjs/common';

// Entire controller is version 2
@Controller('users')
@Version('2')
export class UserV2Controller {
  @Get()
  findAll() { /* ... */ }
}

// Or version a single route on an otherwise v1 controller
@Controller('users')
export class UserController {
  @Get('legacy')
  @Version('1')
  findLegacy() { /* ... */ }

  @Get('beta')
  @Version('2')
  findBeta() { /* ... */ }
}
```

A handler can also be marked **`VERSION_NEUTRAL`** so it is reachable without a version segment (use sparingly—for example, health checks):

```typescript
import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  @Version(VERSION_NEUTRAL)
  check() {
    return { status: 'ok' };
  }
}
```

With `setGlobalPrefix('api')`, a neutral route is typically `/api/health` (no `/v1`).

This starter kit uses the same pattern for **Prometheus metrics**: `GET /api/metrics` is version-neutral (see [`src/observability/prometheus-metrics.controller.ts`](src/observability/prometheus-metrics.controller.ts)) so [`prometheus.yml`](prometheus.yml) scrape paths stay stable across API versions.

#### Other versioning strategies (not used here)

NestJS also supports **`VersioningType.HEADER`**, **`VersioningType.MEDIA_TYPE`**, and **`VersioningType.CUSTOM`**. This project standardises on **URI versioning** so URLs are explicit, cache-friendly, and easy to document in Swagger and client SDKs.

#### Swagger vs runtime URLs

- **Swagger UI** is mounted at `/` (not under `/api/v1`).
- Operation paths in Swagger should reflect the versioned URL (e.g. `/api/v1/users`) when you test from the UI or generate clients.
- OpenAPI document version (`DocumentBuilder.setVersion('1.0')`) describes the **API spec release**, not the URI `v1` segment—they are independent concepts.

#### Checklist for new endpoints

1. Assume base path **`/api/v1/<resource>`** unless you set `@Version('2')` or `VERSION_NEUTRAL`.
2. Update integration tests and Postman collections to include `/v1`.
3. When introducing **v2**, add new controllers or `@Version('2')` handlers; keep v1 stable for existing clients.

---

## Available Scripts

| Script                    | Description                                        |
|---------------------------|----------------------------------------------------|
| `npm run start`           | Start the application                              |
| `npm run start:dev`       | Start in watch mode (hot-reload)                  |
| `npm run start:debug`     | Start with Node.js debugger attached              |
| `npm run start:prod`      | Run the compiled production build                 |
| `npm run build`           | Compile TypeScript to `dist/`                     |
| `npm run format`          | Format all source files with Prettier             |
| `npm run lint`            | Lint and auto-fix with ESLint                     |
| `npm run test`            | Run unit tests with Jest                          |
| `npm run test:watch`      | Run tests in interactive watch mode               |
| `npm run test:cov`        | Run tests with coverage report                    |
| `npm run test:e2e`        | Run end-to-end tests                              |
| `npm run migration:generate` | Generate a TypeORM migration                  |
| `npm run migration:run`   | Apply all pending migrations                      |
| `npm run migration:revert`| Revert the last migration                         |

---

## Architecture Overview

Each feature module follows a **layered Clean Architecture** pattern:

```
modules/<feature>/
├── api/            ← Controllers, route handlers, request/response DTOs
├── application/    ← Use cases, service orchestration, business logic
├── domain/         ← Entities, repository interfaces, domain models
└── infrastructure/ ← Repository implementations, external service adapters
```

### Common Layer

The `common/` directory provides cross-cutting concerns shared across all modules:

- **`BaseRepository`** — Generic TypeORM repository with `create`, `update`, `findById`, `findAll` (with pagination/filtering/sorting), `delete`, and `softDelete` operations
- **`CommonEntity`** — Base entity with `id` (UUID), `createdAt` / `updatedAt`, audit `*ById` fields, and soft-delete via `deletedAt` / `deletedById`
- **`CollectionQuery`** — Standardised pagination, filtering, and sorting DTO
- **`HttpExceptionFilter`** — Formats all exceptions into a consistent error envelope and emits events for observability
- **`AuthGuard` / `RoleGuard`** — JWT validation and role-based access guards applied globally or per-route

---

## Authentication & Authorization

### JWT Strategy

- **Access Token** — Short-lived, signed with `JWT_SECRET`. Generated with `Util.generateToken(user, expiresIn)`.
- **Refresh Token** — Long-lived, signed with `REFRESH_SECRET_TOKEN`. Generated with `Util.generateRefreshToken(user, expiresIn)`.

### AuthGuard

The `AuthGuard` validates the `Authorization: Bearer <token>` header on every request. It:

1. Checks if the handler or controller is decorated with `@AllowAnonymous()` — if so, bypasses auth entirely.
2. Extracts the Bearer token from `Authorization` header.
3. Verifies it with `JwtService.verifyAsync()` and attaches the decoded payload to `request.user` as a `CurrentUserDto`.
4. Throws `401 Unauthorized` if no token or the token is invalid.

```typescript
// Enable globally in main.ts (currently available but commented out)
app.useGlobalGuards(new AuthGuard(jwtService, reflector));

// Or per-module in providers
providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
```

### RoleGuard

The `RoleGuard` is a **mixin factory** — it returns a guard class that checks `request.user.userType` against a pipe-separated list of allowed roles. `super_admin` always bypasses role checks.

```typescript
import { RoleGuard } from '@common/guards/role.guard';

// Allow a single role
@UseGuards(RoleGuard('admin'))
@Get('admin-only')
getAdminData() { ... }

// Allow multiple roles (pipe-separated)
@UseGuards(RoleGuard('admin|manager|supervisor'))
@Get('management')
getManagementData() { ... }
// Note: users with userType === 'super_admin' always pass regardless of the allowed list
```

### CurrentUserDto

The shape of the JWT payload attached to `request.user` after authentication:

```typescript
class CurrentUserDto {
  id: string;              // User UUID
  email?: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  profilePicture?: FileDto;
  userType?: string;       // Used for role checks
  country?: string;
  state?: string;
  city?: string;
}
```

---

## Base Repository API

All module repositories extend `BaseRepository<T extends CommonEntity>`, which provides a full suite of typed CRUD operations without any boilerplate.

### Extending BaseRepository

```typescript
import { BaseRepository } from '@common/base.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../domain/user.entity';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {
    super(userRepo);
  }
  // Add custom query methods here
}
```

### Available Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAll` | `(relations?, withDeleted?) => Promise<T[]>` | Fetch all records, optionally with relations and soft-deleted rows |
| `getById` | `(id, relations?, withDeleted?) => Promise<T \| null>` | Fetch a single record by UUID |
| `getOneBy` | `(field, value, relations?, withDeleted?) => Promise<T \| null>` | Fetch first record matching a single field/value pair |
| `getAllBy` | `(field, value, relations?, withDeleted?) => Promise<T[]>` | Fetch all records matching a single field/value pair |
| `getOneByJsonField` | `(field, jsonProperty, value, relations?, withDeleted?) => Promise<T \| null>` | Query inside a PostgreSQL `jsonb` column using `->>` operator |
| `insert` | `(data: DeepPartial<T>) => Promise<T>` | Create and persist a new entity |
| `save` | `(data: DeepPartial<T>) => Promise<T>` | Persist an already-modified entity (update in-place) |
| `update` | `(id, data: Partial<any>) => Promise<T \| null>` | Partial update by ID, returns the updated entity |
| `delete` | `(id) => Promise<boolean>` | Hard-delete a record by ID |
| `archive` | `(id) => Promise<boolean>` | Soft-delete (sets `deleted_at`); row is hidden from normal queries |
| `restore` | `(id) => Promise<boolean>` | Undo a soft-delete, clearing `deleted_at` |

### Usage Examples

```typescript
// Hard fetch
const user = await this.userRepository.getById(id, ['userRoles']);

// Find by a field
const existing = await this.userRepository.getOneBy('email', 'john@example.com');

// Query a jsonb column (e.g., address->>'city' = 'Addis Ababa')
const user = await this.userRepository.getOneByJsonField('address', 'city', 'Addis Ababa');

// Soft-delete (archive)
await this.userRepository.archive(id);

// Restore soft-deleted
await this.userRepository.restore(id);

// Include soft-deleted in result
const all = await this.userRepository.getAll([], true);
```

---

## CommonEntity & Audit Fields

Every entity in this project extends `CommonEntity`, which automatically provides these columns:

| Column | DB Name | Type | Description |
|--------|---------|------|-------------|
| `id` | `id` | `uuid` (PK) | Auto-generated UUID, indexed |
| `createdAt` | `created_at` | `timestamptz` | Set on insert |
| `updatedAt` | `updated_at` | `timestamptz` | Updated on every save |
| `deletedAt` | `deleted_at` | `timestamptz` (nullable) | Set on soft-delete; `null` = active |
| `createdById` | `created_by_id` | `varchar` (nullable) | User ID who created the record |
| `updatedById` | `updated_by_id` | `varchar` (nullable) | User ID who last updated the record |
| `deletedById` | `deleted_by_id` | `varchar` (nullable) | User ID who soft-deleted the record |

> Existing databases: run `npm run migration:run` to apply `RenameAuditingRelatedColumns1779563426215`, which renames audit columns from `created_by` / `updated_by` / `deleted_by` to `*_by_id`.

### Soft-Delete Pattern

Soft-delete is handled entirely by TypeORM's `@DeleteDateColumn`. When `archive()` is called:

- `deleted_at` is populated — the row is **excluded** from all normal queries automatically.
- Use `withDeleted: true` or `query.withArchived = true` to include archived rows.
- Use `restore()` to clear `deleted_at` and make the row visible again.

```typescript
// In a service
user.deletedAt = new Date();
user.deletedById = currentUser.id;
await this.userRepository.save(user);

// Or using the shorthand
await this.userRepository.archive(userId);
```

---

## Custom Decorators

Three custom decorators are available in `@common/decorators`:

### `@AllowAnonymous()`

Marks a route or controller as **publicly accessible** — the `AuthGuard` will skip JWT validation entirely for it.

```typescript
import { AllowAnonymous } from '@common/decorators/allow-anonymous.decorator';

@Post('register')
@AllowAnonymous()
async register(@Body() dto: CreateUserCommand) { ... }
```

### `@CurrentUser()`

A parameter decorator that injects the **authenticated user** (decoded JWT payload) from `request.user` directly into the handler.

```typescript
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CurrentUserDto } from '@common/current-user.dto';

@Put()
async updateProfile(
  @CurrentUser() user: CurrentUserDto,
  @Body() dto: UpdateUserCommand,
) {
  dto.currentUser = user;
  return this.userService.updateUser(dto);
}
```

### `@Match(type, property)`

A **custom `class-validator` decorator** for cross-field validation — ensures one field matches another (e.g., password confirmation).

```typescript
import { Match } from '@common/decorators/match.decorator';

export class ResetPasswordDto {
  @IsString()
  password!: string;

  @IsString()
  @Match(ResetPasswordDto, (o) => o.password, {
    message: 'Passwords do not match',
  })
  confirmPassword!: string;
}
```

---

## Utility Helpers

The `Util` class (`@common/util`) provides stateless static helpers used throughout the application:

| Method | Signature | Description |
|--------|-----------|-------------|
| `hashPassword` | `(password: string) => string` | Bcrypt-hashes a password using `bcrypt.hashSync` |
| `comparePassword` | `(plain, hashed) => boolean` | Bcrypt-compares a plain password against a stored hash |
| `generateToken` | `(user, expiresIn?) => string` | Signs a JWT access token with `JWT_SECRET` (default: `1h`) |
| `generateRefreshToken` | `(user, expiresIn?) => string` | Signs a JWT refresh token with `REFRESH_SECRET_TOKEN` (default: `1d`) |
| `numberToWord` | `(num) => string` | Converts a number to English words (e.g., `1234` → `"One Thousand Two Hundred Thirty Four"`) using Ethiopian currency config |
| `formatNumber` | `(num) => string` | Formats a number with US locale separators (e.g., `1234567` → `"1,234,567"`) |
| `formatDateWithDayName` | `(date) => string` | Formats a `Date` to `"April 22, 2024"` (long US locale) |
| `compareDate` | `(date1, date2) => number` | Returns `date1 - date2` in milliseconds for sorting |
| `readFilesFromFolder` | `(path) => string[]` | Lists files in a folder (returns `[]` if folder does not exist) |
| `isFolderExists` | `(path) => boolean` | Checks if a path exists on the filesystem |
| `deleteFile` | `(path) => void` | Deletes a file from the filesystem asynchronously |

### Usage

```typescript
import { Util } from '@common/util';

// Hash on create
user.password = Util.hashPassword(command.password);

// Verify on login
const isValid = Util.comparePassword(plainPassword, user.password);

// Issue tokens
const accessToken  = Util.generateToken({ id: user.id, email: user.email });
const refreshToken = Util.generateRefreshToken({ id: user.id }, '7d');

// Format a number for display
const label = Util.numberToWord(4500); // 'Four Thousand Five Hundred'
```

---

## Default Admin Seed

The `UserService` implements `OnModuleInit` and **automatically seeds a default super-admin** on first startup if no user with the email `admin@gmail.com` exists:

| Field | Value |
|-------|-------|
| Email | `admin@gmail.com` |
| Password | `P@ssw0rd` |
| Name | Super Admin Admin |
| Job Title | Administrator |
| Status | Active |

> ⚠️ **Change this password immediately** in any non-local environment. The seed user is created with a hard-coded default password.

---

## Data Source & Entity Registration

The TypeORM CLI migration commands use `src/database/data-source.ts` as their data source. **Every new entity you create must be registered here** for migrations to pick it up:

```typescript
// src/database/data-source.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_CONTAINER_NAME || process.env.POSTGRES_HOST,
  // ... connection config from env
  entities: [
    PostEntity,
    UserEntity,
    RoleEntity,
    UserRoleEntity,
    // 👇 Register your new entity here
    YourNewEntity,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false, // NEVER set to true in production
});
```

The runtime module (`AppModule`) uses `autoLoadEntities: true` so entities registered with `TypeOrmModule.forFeature([...])` inside their own module are picked up automatically — but the CLI data source needs manual registration.

---

## Collection Query — Filtering, Sorting & Pagination

Every `GET` list endpoint in this kit accepts a unified `CollectionQuery` object via query-string. The `QueryConstructor` service translates it into a typed TypeORM `SelectQueryBuilder` — no raw SQL needed.

### CollectionQuery Parameters

| Parameter     | Type          | Default | Description |
|---------------|---------------|---------|-------------|
| `top`         | `number`      | `10`    | Maximum number of records to return (page size) |
| `skip`        | `number`      | `0`     | Number of records to skip (offset) |
| `search`      | `string`      | —       | Free-text search term (used with `searchFrom`) |
| `searchFrom`  | `string[]`    | —       | Fields to apply the `search` term against (supports dot-notation for relations and `jsonb` columns) |
| `filter`      | `Filter[][]`  | —       | 2D filter array. Inner array = **OR** conditions; outer array = **AND** groups |
| `orderBy`     | `Order[]`     | —       | Array of `{ field, direction, nulls }` sort rules |
| `includes`    | `string[]`    | —       | Eager-load relations (supports dot-notation for deep nesting, e.g. `userRoles.role`) |
| `select`      | `string[]`    | —       | Limit which columns are returned |
| `groupBy`     | `string[]`    | —       | Group results by these columns |
| `count`       | `boolean`     | `false` | When `true`, returns only the total count — skips fetching rows |
| `withArchived`| `boolean`     | `false` | Include soft-deleted records |
| `distinct`    | `boolean`     | `false` | Add `DISTINCT` to the query |
| `distinctOn`  | `string[]`    | —       | Columns for `DISTINCT ON (...)` |
| `cache`       | `boolean\|number` | —  | Cache query in milliseconds (TypeORM query cache) |

> **Computed helpers** (read-only, not passed as query params):
>
> - `pageNumber` → `Math.floor(skip / top) + 1`
> - `pageSize` → alias for `top`

---

### Filter Operators

The `Filter` object has the shape `{ field, operator, value }`. The supported operators are:

| Key                      | SQL Equivalent          | Notes |
|--------------------------|-------------------------|-------|
| `=`                      | `= :value`              | Also handles `jsonb` columns automatically |
| `!=`                     | `!= :value`             | |
| `<`                      | `< :value`              | |
| `<=`                     | `<= :value`             | |
| `>`                      | `> :value`              | |
| `>=`                     | `>= :value`             | |
| `IN`                     | `IN (:...values)`       | Pass comma-separated string or array |
| `NOT IN`                 | `NOT IN (:...values)`   | Pass comma-separated string or array |
| `LIKE` / `ILIKE`         | `ILIKE '%value%'`       | Case-insensitive by implementation |
| `NOT LIKE` / `NOT ILIKE` | `NOT ILIKE '%value%'`   | |
| `IS NULL`                | `IS NULL`               | No `value` needed |
| `IS NOT NULL`            | `IS NOT NULL`           | No `value` needed |
| `BETWEEN`                | `BETWEEN :v1 AND :v2`   | Pass `[from, to]` array or `"from,to"` string |
| `NOT BETWEEN`            | `NOT BETWEEN`           | |
| `ANY`                    | `= ANY(:values)`        | PostgreSQL array membership |
| `~` / `~*`               | `~ / ~*`                | RegExp / case-insensitive RegExp |
| `!~ / !~*`               | `!~ / !~*`              | Negative RegExp |
| `SIMILAR TO`             | `SIMILAR TO`            | |
| `IS DISTINCT FROM`       | `IS DISTINCT FROM`      | |
| `IS NOT DISTINCT FROM`   | `IS NOT DISTINCT FROM`  | |
| `contains`               | custom contains logic   | |

---

### Usage Scenarios

#### 1. Basic Pagination

Fetch page 2 of users, 20 per page:

```http
GET /api/v1/users?top=20&skip=20
```

#### 2. Free-Text Search Across Multiple Fields

Search for `"john"` in both `firstName` and `email`:

```http
GET /api/v1/users?search=john&searchFrom=firstName&searchFrom=email
```

#### 3. Simple Equality Filter

Filter users where `isActive = true`:

```http
GET /api/v1/users?filter[0][0][field]=isActive&filter[0][0][operator]==&filter[0][0][value]=true
```

Or using the shorthand tuple format `[field, operator, value]` (auto-parsed by the transformer):

```http
GET /api/v1/users?filter[0][0][]=isActive&filter[0][0][]==&filter[0][0][]=true
```

#### 4. OR Within a Group, AND Between Groups

Filter users where `(role = 'admin' OR role = 'manager') AND isActive = true`:

```http
// Group 0 — OR conditions
filter[0][0] = { field: 'role', operator: '=',  value: 'admin'   }
filter[0][1] = { field: 'role', operator: '=',  value: 'manager' }

// Group 1 — AND'd to group 0
filter[1][0] = { field: 'isActive', operator: '=', value: true }
```

#### 5. Range Filter (BETWEEN)

Orders with `amount` between 100 and 500:

```http
GET /api/v1/orders?filter[0][0][field]=amount&filter[0][0][operator]=BETWEEN&filter[0][0][value][]=100&filter[0][0][value][]=500
```

#### 6. IN List

Fetch users by a specific set of IDs:

```http
GET /api/v1/users?filter[0][0][field]=id&filter[0][0][operator]=IN&filter[0][0][value]=id1,id2,id3
```

#### 7. Null Checks

Fetch only archived (soft-deleted) users — `deleted_at IS NOT NULL`:

```http
GET /api/v1/users/get-archived?filter[0][0][field]=deleted_at&filter[0][0][operator]=IS NOT NULL
```

#### 8. Sorting

Sort by `createdAt` descending, then `lastName` ascending, nulls last:

```http
GET /api/v1/users?orderBy[0][field]=createdAt&orderBy[0][direction]=DESC&orderBy[0][nulls]=NULLS LAST
              &orderBy[1][field]=lastName&orderBy[1][direction]=ASC
```

#### 9. Eager Loading Relations

Load users with their `userRoles` relation (and nested `role` inside each):

```http
GET /api/v1/users?includes=userRoles&includes=userRoles.role
```

#### 10. Count Only

Get the total number of active users without fetching rows:

```http
GET /api/v1/users?filter[0][0][field]=isActive&filter[0][0][operator]==&filter[0][0][value]=true&count=true
```

#### 11. Select Specific Columns

Return only `id`, `email`, and `firstName`:

```http
GET /api/v1/users?select=id&select=email&select=firstName
```

#### 12. Include Soft-Deleted Records

```http
GET /api/v1/users?withArchived=true
```

---

### Wiring It in a Controller & Service

**Controller** — accepts `CollectionQuery` from the query string automatically:

```typescript
import { CollectionQuery } from '@common/collection-query';
import { DataResponseFormat, ApiPaginatedResponse } from '@common/response-format';
import { UserResponse } from '../responses/user.response';

@Get()
@ApiPaginatedResponse(UserResponse)          // Swagger schema
async getUsers(@Query() query: CollectionQuery) {
  return this.userService.getUsers(query);
}
```

**Service** — builds and executes the query:

```typescript
import { QueryConstructor, CollectionQuery, FilterOperators } from '@common/collection-query';
import { DataResponseFormat } from '@common/response-format';

async getUsers(query: CollectionQuery): Promise<DataResponseFormat<UserResponse>> {
  const dataQuery = QueryConstructor.constructQuery<UserEntity>(
    this.userRepository,  // TypeORM Repository<UserEntity>
    query,
  );

  const response = new DataResponseFormat<UserResponse>();
  if (query.count) {
    response.count = await dataQuery.getCount();
  } else {
    const [result, total] = await dataQuery.getManyAndCount();
    response.data    = result.map(UserResponse.toResponse);
    response.count   = total;
    response.pageNumber = query.pageNumber;
    response.pageSize   = query.pageSize;
  }
  return response;
}
```

**Programmatic filter injection** (e.g., always filter archived users):

```typescript
async getArchivedUsers(query: CollectionQuery) {
  query.filter ??= [];
  query.filter.push([{ field: 'deleted_at', operator: FilterOperators.NotNull }]);

  const dataQuery = QueryConstructor.constructQuery(this.userTypeormRepository, query);
  dataQuery.withDeleted(); // include soft-deleted rows
  // ... rest of logic
}
```

---

## API Response Formats

All endpoints return a **consistent response envelope**. There are two shapes: a paginated list and a single-item/error response.

### ✅ Paginated List Response (`DataResponseFormat<T>`)

Returned by any list endpoint (those decorated with `@ApiPaginatedResponse`).

```json
{
  "success": true,
  "count": 142,
  "pageNumber": 2,
  "pageSize": 20,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  ]
}
```

| Field        | Type      | Description |
|--------------|-----------|-------------|
| `success`    | `boolean` | Always `true` for successful responses |
| `count`      | `number`  | Total number of records matching the query (for pagination UI) |
| `pageNumber` | `number`  | Current page number (computed: `skip / top + 1`) |
| `pageSize`   | `number`  | Records per page (mirrors `top`) |
| `data`       | `T[]`     | Array of response objects |

> When `count=true` is passed in the query, only `count` is returned — `data`, `pageNumber`, and `pageSize` are omitted.

### ✅ Single-Item Response

Returned by create, update, and single-fetch endpoints. The controller returns the DTO object directly (no envelope wrapper):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "createdAt": "2024-04-22T08:00:00.000Z",
  "updatedAt": "2024-04-22T08:00:00.000Z",
  "createdById": "550e8400-e29b-41d4-a716-446655440001"
}
```

### ❌ Error Response

All exceptions — whether thrown by NestJS, the validation pipe, or your own service code — are caught by the global `HttpExceptionFilter` and normalised into this shape:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found with id 550e8400-e29b-41d4-a716-446655440000"
  }
}
```

| Field           | Type      | Description |
|-----------------|-----------|-------------|
| `success`       | `boolean` | Always `false` for error responses |
| `error.code`    | `string`  | Machine-readable error code |
| `error.message` | `string`  | Human-readable description of the error |

#### Default Error Code Mapping

| HTTP Status | `error.code`           |
|-------------|------------------------|
| `400`       | `BAD_REQUEST`          |
| `401`       | `UNAUTHORIZED`         |
| `403`       | `FORBIDDEN`            |
| `404`       | `NOT_FOUND`            |
| `409`       | `CONFLICT`             |
| `422`       | `VALIDATION_ERROR`     |
| `500+`      | `INTERNAL_SERVER_ERROR`|

#### Validation Error Example

When the global `ValidationPipe` rejects a request, all field-level errors are joined into one readable message:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "email must be an email, password must be longer than or equal to 8 characters"
  }
}
```

#### Swagger Decorator Integration

Use the built-in decorators to keep your Swagger docs in sync:

```typescript
import { ApiPaginatedResponse } from '@common/response-format';
import { ApiOkResponse, ApiResponse } from '@nestjs/swagger';

@Controller('users')
@ApiResponse({ status: 500, description: 'Internal error' })
@ApiResponse({ status: 404, description: 'Item not found' })
@ApiExtraModels(DataResponseFormat)
export class UserController {

  // Documents the full paginated envelope in Swagger
  @Get()
  @ApiPaginatedResponse(UserResponse)
  async getUsers(@Query() query: CollectionQuery) { ... }

  // Documents a single-item response
  @Get(':id')
  @ApiOkResponse({ type: UserResponse })
  async getUser(@Param('id') id: string) { ... }
}
```

---

## Testing

Unit and integration tests are co-located with source files using the `.spec.ts` convention.

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:cov

# End-to-end tests
npm run test:e2e
```

Coverage reports are output to the `coverage/` directory.

---

## Docker

### Build & Run

```bash
# Build the image
docker build -t starter-kit .

# Run with environment file
docker run --env-file .env -p 8090:8090 starter-kit
```

### Docker Compose Services

| Service    | Image                  | Port(s)              | Description             |
|------------|------------------------|----------------------|-------------------------|
| `server`   | Local build            | `PORT`               | NestJS API server       |
| `postgres` | `postgres:17`          | `5432`               | PostgreSQL database     |
| `redis`    | `redis:latest`         | `6380`               | Redis cache             |
| `minio`    | `minio/minio:latest`   | `9000`, `9010`       | MinIO object storage    |

All services include Docker health checks to ensure dependent services are ready before the API starts.

---

## Contributing

1. **Fork** the repository and create a feature branch from `main`
2. Follow the existing module structure and naming conventions — every module gets `api/`, `application/`, `domain/`, `infrastructure/` layers
3. Use `CollectionQuery` + `QueryConstructor` for all list endpoints and return `DataResponseFormat<T>`
4. Register new REST routes under **`/api/v1/...`** (default URI version); use `@Version('2')` only when introducing a breaking v2 surface
5. Write unit tests for all new service methods
6. Run `npm run lint` and `npm run test` before opening a pull request
7. Submit a pull request with a clear description of the change and its motivation

> For internal teams: reference the relevant Linear/Jira ticket in your PR title.

---

Built with ❤️ by [Aemiro Mekete](https://www.linkedin.com/in/aemiro)
