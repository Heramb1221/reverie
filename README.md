# Reverie — Emotional Memory Archive

> "A quiet space for your thoughts."

A full-stack emotional journaling platform with AI-powered reflections, mood tracking, memory capsules, and end-to-end encryption.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Web       | Next.js 14 · Tailwind CSS · GSAP · Zustand      |
| Mobile    | React Native · Expo (Phase 6)                   |
| Backend   | Node.js · Express · TypeScript                  |
| Database  | MongoDB Atlas (with Atlas Search)               |
| Storage   | Cloudinary                                      |
| AI        | Google Gemini 1.5 Flash                         |
| Auth      | Custom JWT · bcrypt · HTTP-only cookies         |

---

## Project Structure

```
reverie/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   ├── backend/      # Express API
│   └── mobile/       # React Native (Phase 6)
└── README.md
```

---

## Quick Start

### 1. Backend

```bash
cd apps/backend
cp .env.example .env
# Fill in your environment variables (MongoDB URI, Cloudinary, Gemini, JWT secrets)
npm install
npm run dev
# Runs on http://localhost:5000
```

### 2. Web

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Environment Variables

### Backend (`apps/backend/.env`)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GEMINI_API_KEY=...
CLIENT_URL=http://localhost:3000
```

### Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Features

- **Journal System** — Rich text editor, mood selection, image upload, full CRUD
- **Mood Atmosphere** — Background shifts with animated particles per mood (Calm/Reflective/Hopeful/Overwhelmed)
- **AI Reflection** — Weekly Gemini-powered reflections with warm, non-clinical tone
- **Memory Capsules** — Write sealed letters to your future self with countdown timer
- **Calendar View** — Visual mood history across months
- **Mood Analytics** — Distribution charts, streaks, word count stats
- **Search** — Filter by keyword, mood, and date range
- **End-to-End Encryption** — Journal content encrypted client-side
- **Dark/Light Mode** — Mood-aware theming with smooth transitions
- **Auth** — Signup, login, forgot/reset password, onboarding

---

## Development Phases

- [x] Phase 1 — Architecture + Landing Page
- [x] Phase 2 — Backend (Express + MongoDB + JWT + Gemini)
- [x] Phase 3 — Web Frontend (Next.js 14 + all screens)
- [ ] Phase 4 — E2E Encryption implementation
- [ ] Phase 5 — Polish + GSAP animations
- [ ] Phase 6 — Mobile (React Native + Expo)
- [ ] Phase 7 — Deployment (Vercel + Railway)

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

### Auth
```
POST /auth/signup          Create account
POST /auth/login           Sign in
POST /auth/refresh         Refresh access token (HTTP-only cookie)
POST /auth/logout          Sign out
POST /auth/forgot-password Send reset email
POST /auth/reset-password  Apply new password
GET  /auth/me              Current user
```

### Journal
```
GET    /journal                  List entries (paginated)
POST   /journal                  Create entry
GET    /journal/:id              Get single entry
PUT    /journal/:id              Update entry
DELETE /journal/:id              Delete entry
GET    /journal/stats            Mood/word stats
GET    /journal/calendar/:y/:m   Entries for calendar view
```

### Reflection
```
GET  /reflection         List reflections
GET  /reflection/latest  Latest weekly reflection
POST /reflection/generate  Trigger AI generation
```

### Capsules
```
GET    /capsules      List all capsules
POST   /capsules      Create capsule
GET    /capsules/:id  View capsule (content masked if locked)
DELETE /capsules/:id  Delete capsule
```

---

## Design System

**Fonts:** Playfair Display (display) · DM Sans (body) · DM Mono (labels/mono)

**Moods:**
| Mood        | Color     | Hex       | Atmosphere    |
|-------------|-----------|-----------|---------------|
| Calm        | Sage      | `#7B9E87` | Foggy forest  |
| Reflective  | Stone     | `#6B7C6E` | Rainy window  |
| Hopeful     | Warm gold | `#C4956A` | Sunrise light |
| Overwhelmed | Deep teal | `#3D6B7A` | Misty depths  |

---

*Built with care. Every pixel, every endpoint, every animation — crafted for emotional resonance.*
