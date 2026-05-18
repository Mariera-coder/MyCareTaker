# INKAHOME

INKAHOME is a full-stack property management platform built for administrators, estate owners, caretakers, and tenants. It brings estate operations into one workflow: user onboarding, tenancy management, payment tracking, complaint handling, and role-aware reporting.

## Why this project

Managing estates across multiple roles is usually fragmented across spreadsheets, calls, and manual follow-up. INKAHOME centralizes those workflows so each user sees the actions, context, and permissions relevant to their role.

## Core features

- Role-based access for `ADMIN`, `OWNER`, `CARETAKER`, and `TENANT`
- Pending registration workflow with admin approval
- Estate and house management
- Tenant assignment and vacancy handling
- Payment submission, confirmation, and monthly summaries
- Complaint submission, caretaker review, and owner approval
- Audit-friendly backend structure with session-aware APIs

## Tech stack

- Backend: NestJS, Prisma, PostgreSQL, Passport JWT
- Frontend: React, Vite, Redux Toolkit, Tailwind CSS
- Language: TypeScript across frontend and backend

## Security highlights

- Authentication uses `httpOnly` cookie-based access and refresh tokens
- CSRF protection is enforced with a double-submit token pattern
- CORS is origin-based and credential-aware
- `.env` files, logs, and build artifacts are excluded from Git tracking
- Refresh tokens are hashed before storage

## Project structure

```text
src/         Backend API modules and business logic
prisma/      Database schema, migrations, and seed data
frontend/    React frontend application
docs/        Supporting reference material
test/        End-to-end tests
```

## Getting started

### 1. Install dependencies

```bash
npm install
cd frontend
npm install
```

### 2. Configure environment variables

Root `.env`:

```env
DATABASE_URL=postgresql://mycaretaker:mycaretaker@localhost:5432/mycaretaker_dev
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=3028
CORS_ORIGIN=http://localhost:5173
```

Frontend `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3028/api
```

### 3. Start the backend

```bash
npm run start:dev
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
```

## Database workflow

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

The seed script is for development only and should not be used as production credential setup.

## Build commands

Backend:

```bash
npm run build
```

Frontend:

```bash
cd frontend
npm run build
```

## Publishing checklist

Before pushing to GitHub:

1. Confirm `.env` is not staged.
2. Confirm no local log files are staged.
3. Replace placeholder secrets in deployment environments.
4. Keep demo seed credentials restricted to development only.

## About

The project summary and publishing notes are in [ABOUT.md](/c:/Users/User/MyCareTaker/ABOUT.md).
