# 🏢 Mini CRM Backend

> A production-grade RESTful API for managing Users, Customers, and Tasks — built with **NestJS**, **PostgreSQL**, and **Prisma ORM**.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation (Swagger)](#-api-documentation-swagger)
- [API Endpoints](#-api-endpoints)
- [Authentication & Authorization](#-authentication--authorization)
- [Error Handling](#-error-handling)
- [Bonus Features](#-bonus-features)
- [Testing](#-testing)
- [Seed Data (Default Credentials)](#-seed-data-default-credentials)

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **NestJS** (TypeScript) | Backend framework |
| **PostgreSQL** | Relational database |
| **Prisma ORM** | Database access & migrations |
| **JWT** (`@nestjs/jwt`, `passport-jwt`) | Authentication |
| **bcrypt** | Password hashing |
| **class-validator** / **class-transformer** | DTO validation |
| **@nestjs/swagger** | API documentation |
| **@nestjs/config** | Environment variable management |
| **helmet** | HTTP security headers |
| **Docker Compose** | Containerized PostgreSQL |

---

## 🏗 Project Architecture

The project follows **clean NestJS modular architecture** with clear separation of concerns:

```
src/
├── auth/                          # Authentication Module
│   ├── dto/                       #   ├── RegisterDto, LoginDto
│   ├── auth.controller.ts         #   ├── POST /auth/register, /auth/login
│   ├── auth.module.ts             #   └── JWT + Passport configuration
│   └── auth.service.ts
├── users/                         # Users Module (Admin Only)
│   ├── dto/                       #   ├── UpdateRoleDto
│   ├── users.controller.ts        #   ├── GET /users, GET /users/:id, PATCH /users/:id
│   └── users.service.ts
├── customers/                     # Customers Module
│   ├── dto/                       #   ├── CreateCustomerDto, UpdateCustomerDto
│   ├── customers.controller.ts    #   ├── Full CRUD + Pagination + Search
│   └── customers.service.ts
├── tasks/                         # Tasks Module
│   ├── dto/                       #   ├── CreateTaskDto, UpdateTaskStatusDto
│   ├── tasks.controller.ts        #   ├── POST /tasks, GET /tasks, PATCH /tasks/:id/status
│   └── tasks.service.ts
├── prisma/                        # Database Access Layer
│   ├── prisma.module.ts           #   └── Global PrismaService
│   └── prisma.service.ts
├── common/                        # Shared Utilities
│   ├── decorators/                #   ├── @Roles(), @GetUser()
│   ├── guards/                    #   ├── JwtAuthGuard, RolesGuard
│   ├── filters/                   #   ├── PrismaClientExceptionFilter, AllExceptionsFilter
│   ├── strategies/                #   ├── JwtStrategy
│   └── dto/                       #   └── PaginationQueryDto
├── app.module.ts                  # Root Module
└── main.ts                        # Bootstrap + Global Pipes/Filters/Swagger
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v8+
- **Docker** & **Docker Compose** (for PostgreSQL)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mini-crm-backend
```

### 2. Install Dependencies

```bash
npm install
```

---

## 🔐 Environment Variables

Copy the example file and configure your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://prysm:DB_PASSWORD@localhost:5432/crm_db?schema=public` |
| `JWT_SECRET` | Secret key for signing JWT tokens | *(required)* |
| `JWT_EXPIRES_IN` | Token expiration duration | `1d` |
| `PORT` | Application port | `3000` |

---

## 🗄 Database Setup

### Start PostgreSQL (Docker)

```bash
docker-compose up -d
```

This starts a PostgreSQL 15 instance on `localhost:5432` with database `crm_db`.

### Run Migrations

Apply the Prisma schema to the database:

```bash
npx prisma migrate dev --name init
```

### Seed the Database

Populate the database with initial test data (admin user, employees, sample customer & task):

```bash
npx prisma db seed
```

---

## ▶️ Running the Application

**Development** (with hot-reload):
```bash
npm run start:dev
```

**Production**:
```bash
npm run build
npm run start:prod
```

The server starts at **`http://localhost:3000`**

---

## 📖 API Documentation (Swagger)

Once the server is running, access the interactive Swagger UI at:

### **👉 [http://localhost:3000/api](http://localhost:3000/api)**

Swagger supports JWT authentication — click the **"Authorize" 🔒** button and paste your Bearer token to test protected routes directly from the browser.

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Login and receive JWT token |

### Users (Admin Only)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/users` | ADMIN | List all users |
| `GET` | `/users/:id` | ADMIN | Get user by ID |
| `PATCH` | `/users/:id` | ADMIN | Update user role |

### Customers

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/customers` | ADMIN | Create a customer |
| `GET` | `/customers` | ADMIN, EMPLOYEE | List customers (paginated) |
| `GET` | `/customers/:id` | ADMIN, EMPLOYEE | Get customer by ID |
| `PATCH` | `/customers/:id` | ADMIN | Update customer details |
| `DELETE` | `/customers/:id` | ADMIN | Delete a customer |

**Query Parameters for `GET /customers`:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page (max 100) |
| `search` | string | — | Filter by name, email, or company |

### Tasks

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/tasks` | ADMIN | Create and assign a task |
| `GET` | `/tasks` | ADMIN, EMPLOYEE | List tasks (role-filtered) |
| `PATCH` | `/tasks/:id/status` | ADMIN, EMPLOYEE | Update task status |

> **Note:** `GET /tasks` returns **all tasks** for ADMIN, but **only assigned tasks** for EMPLOYEE. An EMPLOYEE can only update the status on tasks assigned to them (returns `403` otherwise).

---

## 🔒 Authentication & Authorization

### JWT Flow

1. Register via `POST /auth/register` → returns user metadata (password never exposed)
2. Login via `POST /auth/login` → returns `{ accessToken, user }`
3. Use the token in subsequent requests:
   ```
   Authorization: Bearer <accessToken>
   ```

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access to all modules. Can create/manage users, customers, and tasks. |
| **EMPLOYEE** | Read-only access to customers. Can view and update status of **own** assigned tasks only. |

RBAC is enforced via:
- **`@Roles()` decorator** — declares required roles on each endpoint
- **`RolesGuard`** — validates the JWT role claim against the required roles
- **`JwtAuthGuard`** — validates the Bearer token before any authorization check

---

## ⚠️ Error Handling

All errors return consistent JSON responses with appropriate HTTP status codes:

| Status Code | Scenario | Example |
|-------------|----------|---------|
| `400` | Validation failure | Missing required fields, invalid email format |
| `401` | Authentication failure | Missing/invalid JWT, wrong password |
| `403` | Authorization failure | EMPLOYEE accessing ADMIN routes |
| `404` | Resource not found | Invalid user/customer/task ID |
| `409` | Conflict (duplicate) | Duplicate email on register, duplicate customer phone |

**Global filters** ensure no raw database errors or stack traces leak to the client:
- `PrismaClientExceptionFilter` — maps Prisma error codes (`P2002` → 409, `P2025` → 404)
- `AllExceptionsFilter` — catches any unhandled errors with a unified response format

---

## ⭐ Bonus Features

- ✅ **Customer Search Filter**: `GET /customers?search=acme` — searches across name, email, and company (case-insensitive)
- ✅ **Docker Support**: `docker-compose.yml` provides a single-command PostgreSQL setup
- ✅ **Database Seeding**: Automatic creation of admin user, employees, and sample data

---

## 🧪 Testing

### Postman Collection

A ready-to-import Postman collection is included:

```
crm-api.postman_collection.json
```

Import it into Postman to test all endpoints with pre-configured request bodies.

### Example curl Commands

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@prysm.com", "password": "Admin@123"}'
```

**Get Customers (authenticated):**
```bash
curl http://localhost:3000/customers?page=1&limit=10 \
  -H "Authorization: Bearer <your-token>"
```

---

## 🌱 Seed Data (Default Credentials)

After running `npx prisma db seed`, the following accounts are available:

| Role | Email | Password |
|------|-------|----------|
| **ADMIN** | `admin@prysm.com` | `Admin@123` |
| **EMPLOYEE** | `john@prysm.com` | `Employee@123` |
| **EMPLOYEE** | `jane@prysm.com` | `Employee@123` |

A sample **Customer** (Acme Corp) and a sample **Task** (assigned to John) are also created.

---

## 📄 License

This project was built as part of the **Prysm Labs — Backend Developer Intern Assignment**.
