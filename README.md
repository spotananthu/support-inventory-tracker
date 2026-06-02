<img width="1405" height="936" alt="Screenshot 2026-06-02 at 11 50 10 PM" src="https://github.com/user-attachments/assets/8bb1dc3a-3091-478a-9366-ea4426c184c3" />

<img width="1500" height="528" alt="Screenshot 2026-06-02 at 11 50 38 PM" src="https://github.com/user-attachments/assets/1146e6ec-1113-4bee-ab1a-0d2e26f38e89" />

<img width="1140" height="875" alt="Screenshot 2026-06-02 at 11 50 27 PM" src="https://github.com/user-attachments/assets/496c682b-22d3-4944-9746-52f84fe76d3f" />


# Support Ticket & Inventory Issue Tracker

An internal support ticket management system for a software company that handles ERP, healthcare, e-commerce, and integration projects. Team members can log client issues, assign priorities, track statuses, link affected modules, add comments, and view summaries across the team.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Single repo for both frontend and API routes. One command to run the whole app. |
| Database | PostgreSQL | Relational database with foreign keys, constraints, and indexes. |
| ORM | Prisma | Type-safe queries, auto-generated migrations, clear schema definition. |
| Auth | NextAuth.js v5 | Credentials-based auth with JWT sessions. |
| Validation | Zod | Shared schemas between API layer and frontend forms — no duplication. |
| Styling | Tailwind CSS + shadcn/ui | Accessible pre-built components with a consistent dark theme. |
| Tests | Jest + ts-jest | Unit tests for business logic and validation schemas. |
| DB Infra | Docker Compose | Single command to spin up PostgreSQL for local development. |

---

## Setup from a Clean Machine

### Prerequisites
- Node.js 18+
- Docker Desktop

### Steps

```bash
git clone https://github.com/spotananthu/support-inventory-tracker.git
cd support-inventory-tracker

cp .env.example .env
# Fill in NEXTAUTH_SECRET (see Environment Variables below)

docker-compose up -d

npm install

npm run db:migrate

npm run db:seed

npm run dev
```

App runs at **http://localhost:3000**

---

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/support_tracker?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Database Setup

```bash
docker-compose up -d          # Start PostgreSQL
npm run db:migrate            # Run migrations
npm run db:seed               # Seed demo data
npm run db:reset              # Reset and reseed from scratch
npm run db:studio             # Open Prisma Studio (visual DB browser)
```

---

## Running the App

```bash
npm run dev        # Development server
npm test           # Run unit tests
npm run build      # Production build
npm run start      # Start production server
```

---

## Demo Accounts

All accounts use the password: **password123**

| Name | Email | Role |
|---|---|---|
| Suresh Kumar | suresh.kumar@support.com | Admin |
| Divya Nair | divya.nair@support.com | Admin |
| Arjun Menon | arjun.menon@support.com | Engineer |
| Kavya Reddy | kavya.reddy@support.com | Engineer |
| Venkat Raman | venkat.raman@support.com | Engineer |

---

## API Reference

Interactive API documentation is available via Swagger UI at:

```
http://localhost:3000/api-docs
```

All endpoints require authentication via session cookie. Log in at `/login` first — the cookie is set automatically by the browser.

> **Note:** Swagger's "Try it out" will not work because browser cookie security prevents it from sending the session cookie. Use the app UI directly.

### Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/tickets` | List tickets — supports search, filters, pagination, sorting | Any |
| GET | `/api/tickets/:id` | Ticket detail with client, engineer, comments, audit log | Any |
| POST | `/api/tickets` | Create ticket | Admin |
| PATCH | `/api/tickets/:id` | Update ticket fields | Any* |
| DELETE | `/api/tickets/:id` | Soft-delete ticket | Admin |
| POST | `/api/tickets/:id/comments` | Add comment | Any |
| GET | `/api/tickets/export` | Download filtered tickets as CSV | Any |
| GET | `/api/clients` | List active clients | Any |
| GET | `/api/engineers` | List all engineers | Any |
| GET | `/api/dashboard` | Summary stats | Any |

*Priority changes and assignment are Admin only at the API level.

### Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation error or business rule violation |
| 401 | Not authenticated |
| 403 | Forbidden — wrong role |
| 404 | Not found |
| 500 | Internal server error |

---

## Features Implemented

### Core
- Full ticket CRUD — create, read, update, soft-delete
- Comment thread on each ticket
- Dashboard with stat cards, donut chart, engineer workload, priority breakdown
- Ticket list with search, filters (status, priority, client, engineer, overdue), pagination, sorting
- Ticket detail with inline status, priority, and engineer editing
- Role-based access — Admin vs Engineer enforced at API and UI level

### Business Rules
- Ticket cannot be marked Resolved without at least one comment
- Critical priority creation returns a warning message in the API response
- Title minimum 5 characters, description minimum 20 characters
- Overdue: `dueDate < now AND status NOT IN (RESOLVED, CLOSED)`
- Soft delete — `deletedAt` timestamp, data preserved

### Bonus Features
- Audit log — status, priority, and assignment changes logged atomically in a DB transaction
- CSV export with active filters applied
- Swagger/OpenAPI documentation at `/api-docs`
- DB-level indexes on common filter columns
- 24 unit tests

---

## Database Design Decisions

**Soft delete on Ticket** — `deletedAt` instead of hard delete. Preserves audit trail, prevents orphaned comments, recoverable if needed.

**`assignedTo` is optional** — tickets can exist unassigned and be assigned later.

**`clientId` is required** — every ticket must belong to a client.

**Audit log as a separate table** — field-level `oldValue`/`newValue` entries rather than snapshots. More queryable and storage-efficient.

**`module` enum** — PDF described ERP, healthcare, e-commerce, and integration as the company's domains. Used as enum: `ERP | HEALTHCARE | ECOMMERCE | INTEGRATION | OTHER`.

**`onDelete` rules:**
- `Ticket.clientId` → `Restrict` — cannot delete a client with active tickets
- `Ticket.assignedTo` → `SetNull` — deleting a user unassigns their tickets
- `Comment.authorId` → `Restrict` — cannot delete a user with comments
- `AuditLog.userId` → `Restrict` — audit history must remain intact

**DB indexes** on `tickets(clientId)`, `tickets(assignedTo)`, `tickets(status, deletedAt)`, `tickets(priority, deletedAt)`.

---

## Known Limitations & What I'd Improve

- **No real-time updates** — UI refreshes after mutations. WebSockets would make it live.
- **No file attachments** — comments are text only.
- **No email notifications** — critical tickets don't trigger alerts.
- **No API integration tests** — only unit tests for pure logic.
- **Users are seeded only** — no registration flow. Production would need user management.

---

## Approximate Time Spent

~12–14 hours across planning, backend, frontend, testing, and polish.

---

## AI Usage Declaration

AI tooling was used to assist with documentation writing and generating boilerplate code (initial project scaffold, shadcn/ui component setup).


