# StudyPal

StudyPal is a family study-prep web app. It stores exam-style questions and vocabulary words in "banks," runs them through a spaced-repetition (Leitner box) quiz engine, and tracks each learner's progress over time. It also has a small storefront so banks can be sold/shared, and an admin area for managing content, users, and access.

Originally built for Sri Lankan exam prep (Grade 5 Scholarship, O/L, A/L, government admin exams, IQ tests), plus general vocabulary building. Prices are in LKR and purchase enquiries go out via WhatsApp.

## What it does today

**Content model**
- A **Bank** is a named collection of either exam questions or vocabulary words (`kind: exam | vocab`). Exam banks can be tagged with a category (IQ, Grade 5 Scholarship, O/L, A/L, Gov Admin, Other).
- Every user automatically gets their own **personal bank** (one for exam questions, one for vocab) to add their own material to, separate from official published banks.
- **Books** can be attached to vocabulary words as a source reference (e.g. "this word came from *IQ 550 Plus*").
- Exam questions support either **self-graded** answers (free text + model answer) or **real multiple choice** (A/B/C/D options with one marked correct), plus optional images per question/option.

**Studying**
- Quizzes are assembled automatically: due-for-review items first, then never-seen items, then random filler, shuffled — for both vocab and exam quizzes, and a "mixed" mode.
- Every answer feeds a **Leitner spaced-repetition** system (`src/lib/srs.ts`): correct answers move an item up a box (0–5) and push its next review further out (1, 2, 4, 9, 21 days); a wrong answer resets it to box 0. Points are awarded per correct answer, scaled by box level.
- A personal **Progress** page shows quiz history and points earned over time.

**Access control**
- Three roles: `customer`, `content_editor`, `admin`.
- Access to a bank's content requires an **Entitlement** (granted personally, manually by an admin, or via promo). The first user ever created is auto-promoted to admin by a database migration, so there's always someone who can reach `/manage`.
- Content editors can be assigned as editors of specific banks; admins can edit anything.

**Storefront**
- `/store` publicly lists published banks with pricing. There's no online payment yet — a "buy" click opens a pre-filled WhatsApp message to the site owner, who then manually grants the buyer an entitlement from the admin panel.

**Admin (`/manage`)**
- Dashboard overview, user list with role assignment and per-user entitlement management, full CRUD on banks/questions/vocab/books, and a bulk-import tool that parses a simple text format (blocks separated by `---`, fields like `Term:`, `Definition:`, `Category:`, `A:`/`B:`/`C:`/`D:`/`Correct:`) so large batches of questions can be pasted in at once instead of entered one by one.

## What's not built yet

Based on what's in the codebase — worth confirming against your own to-do list before treating this as gospel:

- **No online payments** — purchases are WhatsApp-enquiry + manual admin grant, not a checkout flow.
- **No password reset / forgot-password flow** — only login, signup, and an admin-side user editor exist.
- **No automated tests** — there's no test runner configured in `package.json`.
- **No CI checks on PRs** — the only GitHub Actions workflow (`deploy.yml`) deploys to the home server on manual dispatch; it doesn't lint or test.
- **No seed script** for demo data — the database starts empty apart from whatever you create through the UI (the one exception is the "promote first user to admin" migration).
- **File uploads are local disk, not cloud storage** — question images are saved under `./uploads` and served by a custom route; fine for a single self-hosted server, wouldn't survive multi-instance deployment as-is.
- **No email sending** — no verification emails, notifications, or transactional email of any kind.

## Tech stack (and why)

| Package | What it's for |
|---|---|
| **Next.js 15** (App Router) | The framework — pages, API routes, and middleware all live in one project. |
| **React 18** | UI rendering. |
| **TypeScript** | Type safety across the app. |
| **Prisma 5** + **PostgreSQL** | Database ORM and the database itself. The schema lives in `prisma/schema.prisma`; every change is a tracked migration in `prisma/migrations/`. |
| **NextAuth 5 (beta)** + `@auth/prisma-adapter` | Login sessions, using email/password credentials (not OAuth). |
| **bcryptjs** | Hashes passwords before they touch the database. |
| **zod** | Validates input on API routes/forms. |
| **Tailwind CSS** | Styling, utility-class based. |
| **class-variance-authority**, **clsx**, **tailwind-merge** | Small helpers for building flexible, variant-based UI components (the shadcn/ui pattern) — see `src/components/ui/`. |
| **lucide-react** | Icon set. |
| **next-themes** | Light/dark mode toggle. |

## Project layout

```
src/
  app/
    (auth)/         login, signup pages
    (app)/          the logged-in experience: dashboard, quiz, vocab, questions, progress
    manage/         admin-only area: users, banks, books, bulk import
    store/          public storefront
    api/            route handlers (REST-ish JSON endpoints under /api)
  components/       UI building blocks, grouped by feature (quiz, banks, users, nav, ui)
  lib/              core logic: auth.ts, authz.ts, srs.ts, quiz-assembly.ts, bulk-import.ts, db.ts
prisma/
  schema.prisma     data model
  migrations/       one folder per migration, applied in order
```

## Running it locally

You'll need **Node 20+** and a **PostgreSQL** database (the app itself doesn't bundle one for local dev — use Docker for the database only, or a local Postgres install).

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up your environment file**
   ```bash
   cp .env.example .env
   ```
   Fill in:
   - `DATABASE_URL` — a Postgres connection string, e.g. `postgresql://studypal:password@localhost:5432/studypal`
   - `NEXTAUTH_SECRET` — generate one with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev

   Easiest way to get a local Postgres running is via the same `docker-compose.yml` used for production — just start the `db` service:
   ```bash
   docker compose up -d db
   ```

3. **Apply the database schema**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

5. **Create your first account** via the signup page — it will automatically become the admin (the very first user created is auto-promoted by a migration), giving you access to `/manage`.

### Other scripts

| Command | What it does |
|---|---|
| `npm run build` | Runs `prisma generate` then builds the production bundle. |
| `npm run start` | Starts the production server (after `build`). |
| `npm run lint` | Runs Next.js's ESLint config. |
| `npm run prisma:generate` | Regenerates the Prisma client after a schema change. |
| `npm run prisma:migrate` | Applies pending migrations (`prisma migrate deploy`) — use this on servers; use `npx prisma migrate dev` locally when you're authoring a *new* migration. |

## Deployment

The app ships as a multi-stage **Docker** image (`Dockerfile`) and runs alongside Postgres via `docker-compose.yml`. On the home server, a GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on a self-hosted runner: it pulls the requested branch/tag, rebuilds the `app` image, and restarts it with `docker compose up -d app`. Migrations run automatically on container start (`docker-entrypoint.sh` calls `prisma migrate deploy` before starting Next.js)..
