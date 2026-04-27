# Kano Feature Prioritization System

A full-stack Feature Request Management System using the **Kano Model** for prioritization, built with strict **ECB (Entity-Control-Boundary)** architecture.

---

## Architecture Overview (ECB Pattern)

```
┌─────────────────────────────────────────────────────────────┐
│  BOUNDARY (Frontend) — React + Vite                          │
│  LoginPage · ProductManagerUI · StakeholderUI · DevTeamUI    │
├─────────────────────────────────────────────────────────────┤
│  CONTROL (Logic) — src/lib/supabase.js                       │
│  AuthenticationControl · FeatureControl                       │
│  FeedbackControl · BacklogControl · UserControl              │
├─────────────────────────────────────────────────────────────┤
│  ENTITY (Database) — Supabase PostgreSQL                     │
│  users · registrations · feature_requests                    │
│  feedback · backlog                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
kano-app/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx          # Auth state management
│   ├── lib/
│   │   └── supabase.js              # ECB Control layer + Supabase client
│   ├── components/
│   │   ├── layout/
│   │   │   └── Layout.jsx           # Sidebar + Navbar shell
│   │   └── ui.jsx                   # Shared UI primitives
│   ├── pages/
│   │   ├── LoginPage.jsx            # RegistrationUI / AuthenticationUI
│   │   ├── ProductManagerDashboard.jsx  # ProductManagerUI
│   │   ├── StakeholderDashboard.jsx    # StakeholderUI
│   │   └── DevTeamDashboard.jsx        # DevTeamUI
│   ├── App.jsx                      # Role-based router
│   ├── main.jsx
│   └── index.css
├── supabase_schema.sql              # Full DB schema + Kano scoring function
├── .env.example
├── package.json
├── vite.config.js
└── index.html
```

---

## Database Schema (Entity Layer)

| Table | Key Fields | ECB Entity |
|-------|-----------|------------|
| `users` | id, name, email, role | UserEntity |
| `registrations` | username, password_hash, user_id | Registration |
| `feature_requests` | id, title, description, status | FeatureRequestEntity |
| `feedback` | id, request_id, kano_category, functional_rating | FeedbackEntity |
| `backlog` | id, request_id, priority_score, kano_category | BacklogEntity |

---

## Kano Priority Scoring Algorithm

Located in `supabase_schema.sql` as `calculate_kano_score()` PostgreSQL function.

```
Priority Score = Σ(category_weight × feedback_count) / total_feedback
              × (1 + (avg_functional_rating - 3) × 0.04)

Weights:
  Must-Be          → 100
  One-Dimensional  →  75
  Attractive       →  50
  Indifferent      →  10
  Reverse          →   0
```

---

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to **SQL Editor** in the Supabase dashboard
3. Copy the entire contents of `supabase_schema.sql` and run it
4. This creates all tables, indexes, the Kano scoring function, RLS policies, and seed data

### Step 2: Get Your Credentials

In your Supabase project: **Settings → API**
- Copy **Project URL** → `VITE_SUPABASE_URL`
- Copy **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Step 3: Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your actual Supabase values
```

### Step 4: Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Product Manager | pm@demo.com | password123 |
| Developer | dev@demo.com | password123 |
| Stakeholder | stakeholder@demo.com | password123 |

---

## Features by Role

### Product Manager
- Dashboard with 4 KPI cards + status distribution chart
- Add new feature requests to the backlog
- View Kano-ranked backlog with priority scores
- View stakeholder feedback per feature
- Kano analysis with category distribution
- Assign features to developers
- Reports & analytics

### Stakeholder
- Dashboard with response rate and pending items
- Submit Kano feedback (functional + dysfunctional ratings)
- View all submitted responses
- Browse full feature list

### Developer
- Dashboard with assigned task summary
- Assigned features list view
- Kanban board (To Do / In Progress / Testing / Completed)
- Update feature status directly

---

## Production Considerations

1. **Auth**: Replace the demo password check in `AuthenticationControl.signIn()` with Supabase Auth (`supabase.auth.signInWithPassword()`)
2. **RLS**: Tighten the Row Level Security policies to use `auth.uid()` from Supabase Auth JWT
3. **Password hashing**: The current demo uses plain password comparison — use bcrypt + Supabase Auth in production
4. **Real-time**: Add `supabase.channel()` subscriptions for live backlog updates

---

## ECB Mapping Reference

| ECB Class | File | Responsibility |
|-----------|------|----------------|
| `RegistrationUI` | `LoginPage.jsx` | Login/auth form boundary |
| `StakeholderUI` | `StakeholderDashboard.jsx` | Feedback submission boundary |
| `ProductManagerUI` | `ProductManagerDashboard.jsx` | Backlog management boundary |
| `DevTeamUI` | `DevTeamDashboard.jsx` | Task tracking boundary |
| `AuthenticationControl` | `supabase.js` | Auth logic control |
| `FeatureControl` | `supabase.js` | Feature CRUD control |
| `FeedbackControl` | `supabase.js` | Feedback logic control |
| `BacklogControl` | `supabase.js` | Kano scoring control |
| `UserEntity` | `users` table | User data entity |
| `FeatureRequestEntity` | `feature_requests` table | Feature data entity |
| `FeedbackEntity` | `feedback` table | Feedback data entity |
| `BacklogEntity` | `backlog` table | Prioritized backlog entity |
