# Hatocon

A leave and travel management system built for the furry community — designed around conventions, furmeets, and group travel rather than corporate workflows.

---

## Business Case

Furry conventions and community gatherings involve dozens of attendees coordinating arrival dates, leave types, shared itineraries, and group logistics. Generic HR leave tools don't understand events, group participation, or activity timelines. Hatocon bridges that gap.

**Core problems solved:**

- Members need to track their own leave balance (annual, sick, unpaid) against their work schedule without a HR department managing it
- Convention attendance requires knowing _who_ is arriving _when_, at a glance, across a whole group
- Groups planning side trips and activities need a shared itinerary with per-activity participant lists
- Organizers need visibility and control over group membership, invites, and join requests

---

## Features

### Leave Management

- Per-user job profile with configurable annual leave, sick leave, and leave cycle start date
- Leave balance tracking with used/remaining breakdown
- Work schedule configuration with custom holidays, exceptions, and lunar calendar support
- Country-aware public holiday seeding (via `date-holidays`)

### Events

- Admin-created events (public or private, one-off or yearly recurring)
- Event invitee lists and join request flow with approval/rejection
- Participation records tied to an event or created standalone

### Participations & Group Travel

- Each participation records a user's travel window (`from`/`to`), leave type, and whether they are already on-site at start
- Participations can be grouped into a named **Participation Group** with one owner
- Group features: member invite toggle, public/private visibility, member list visibility, media visibility
- Ownership transfer and member kick with notification events

### Activity Timeline

- Per-group activity itinerary with name, location, time window, and involved participants
- Arrival/departure timeline auto-generated from participant travel dates
- Same-time arrivals merged into a single card
- Upcoming activities view showing each member's next activity

### Media

- Photo gallery per group and per activity
- Images stored on **Cloudflare R2** via S3-compatible API with presigned upload URLs
- Avatar upload with in-browser crop (react-image-crop)

### Notifications

- In-app notification bell for join requests, approvals, rejections, ownership transfers, kicks, and invite responses
- Notification read state persisted per user

### Admin Panel

- User management, event approval, job profile oversight, participation management

---

## Tech Stack

| Layer            | Technology                                        |
| ---------------- | ------------------------------------------------- |
| Framework        | Next.js 16.2.1 (App Router)                       |
| Language         | TypeScript 5, strict mode                         |
| Runtime          | React 19                                          |
| Auth             | NextAuth v5 — Google OAuth + credentials (bcrypt) |
| Database         | PostgreSQL on Neon                                |
| ORM              | Prisma 7.5.0                                      |
| Cache            | Redis (ioredis) — optional, graceful fallback     |
| Object Storage   | Cloudflare R2 (S3-compatible)                     |
| State / Fetching | TanStack React Query v5                           |
| Forms            | React Hook Form + Zod v4                          |
| UI Components    | shadcn/ui (Radix UI primitives)                   |
| Styling          | Tailwind CSS v4                                   |
| Date Utilities   | date-fns v4, lunar-typescript                     |
| Holiday Data     | date-holidays                                     |

---

## Architecture

```
src/
├── app/               # Next.js App Router pages and API routes
│   ├── admin/         # Admin panel (users, events, job profiles, participations)
│   ├── events/        # Event listing and detail
│   ├── participations/# Participation detail with tabs (overview, timeline, settings)
│   ├── schedule/      # Work schedule configuration
│   ├── leave/         # Leave balance view
│   ├── profile/       # User profile
│   ├── settings/      # Account settings
│   └── share/         # Public share views
├── components/        # React components (UI, pages, common)
├── hooks/             # TanStack Query hooks per domain
├── services/          # Axios-based API service layer
├── repositories/      # Prisma data access layer
├── types/             # Shared TypeScript types
├── validations/       # Zod schemas
└── config/            # Prisma, Redis, R2, auth config
```

**Data flow:** Page → TanStack Query hook → Service (Axios) → API Route → Repository (Prisma) → PostgreSQL  
**Optimistic updates** are applied on mutations (e.g. settings toggles) with rollback on error.  
**Redis** is used for caching where available; all cache calls fall through gracefully if Redis is unavailable.

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (e.g. Neon)
- Cloudflare R2 bucket
- Google OAuth app credentials
- Redis instance (optional)

### Environment Variables

```env
DATABASE_URL=
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
REDIS_URL=          # optional
```

### Setup

```bash
npm install
npx prisma migrate deploy
npm run dev
```

### Build

```bash
npm run build
npm start
```
