<div align="center">

# 🧬 Bio-Tech Quiz Quest

### *An Immersive Pixel-Art Biotechnology Learning RPG*

[![Live Demo](https://img.shields.io/badge/🎮%20Play%20Now-Live%20Demo-00e5ff?style=for-the-badge&labelColor=1a120c)](https://biotech-quiz-quest.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-3178c6?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20Prisma-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Tests-127%20Passing-4caf50?style=for-the-badge&logo=vitest&logoColor=white)](#testing)
[![License](https://img.shields.io/badge/License-MIT-ffb300?style=for-the-badge)](LICENSE)

<br/>

> **Transform your knowledge of OMICS, Functional Genomics, and Epigenomics into gameplay.**  
> Explore a cozy pixel-art laboratory campus, read real academic research notes, attempt quizzes with server-scored results, earn XP, unlock badges, and compete on the global leaderboard — all connected to a production-grade REST API.

<br/>

**[🎮 Play the Game →](https://biotech-quiz-quest.vercel.app/)**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Backend API](#-backend-api)
- [Game Screens](#-game-screens)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## 🌟 Overview

**Bio-Tech Quiz Quest** is a full-stack educational RPG game built on top of a robust production backend. Students explore a top-down pixel-art biotechnology campus, engage with real academic content from the **Functional Genomics & Epigenomics** curriculum, and complete server-scored assessments with negative marking, server-side timers, and XP-based progression.

This is not a mock quiz app — every score, badge, leaderboard rank, and XP point is computed and persisted by a **real REST API** with JWT authentication, Prisma ORM, and PostgreSQL.

---

## 🎮 Live Demo

| Environment | URL |
|-------------|-----|
| 🌐 **Production (Frontend)** | [https://biotech-quiz-quest.vercel.app/](https://biotech-quiz-quest.vercel.app/) |
| 🔌 **Backend API** | `http://localhost:5000/api` (self-hosted) |

### Quick Login
> Use the registration form to create your own student account, or use:

| Field | Value |
|-------|-------|
| Email | `student@biotech.quest` |
| Password | `Student123!` |

---

## ✨ Features

### 🎮 Gameplay
- **Top-Down Pixel-Art World** — Explore a cozy biotechnology campus with WASD/arrow-key movement, 8-directional collision physics, and a floating AI companion (Axi Bio-Bot)
- **Interactive Zones** — Walk up to laboratory doors, terminals, and trophy rooms; press `[E]` to interact
- **Pause Menu** — Press `[ESC]` to pause, fast-travel, or exit to menu

### 📚 Academic Content
- **Real OMICS Curriculum** — 6 research topics under Unit 1 (Functional Genomics & Epigenomics) with full academic content, summaries, and key takeaways
- **Research Terminal** — In-game parchment document viewer with paginated content sections
- **Locked Future Units** — Units 2–4 are dynamically displayed as locked placeholders

### 📝 Quiz System
- **Server-Side Timer** — Countdown synchronized with `expiresAt` from the backend (tamper-proof)
- **Server-Side Scoring** — All marks computed server-side; no client-side scoring
- **Negative Marking** — Configurable per quiz
- **Multiple Attempts** — Attempt pip indicators, configurable max attempts
- **Auto-Submit** — Quiz submits automatically when timer expires
- **Question Review** — Post-submission review showing correct answers and explanations

### 🏆 Gamification
- **XP System** — Earn XP on every quiz pass; visualized with animated crystal icons
- **Levels** — Progress tracked with XP bars and level star badges
- **Badges** — Unlock achievements for first quiz, perfect score, streaks, and more
- **Global Leaderboard** — Live rankings sorted by XP with crown icons for top 3
- **Achievement Hall** — Browse all unlocked/locked badges with filter tabs

### 🔐 Authentication
- **JWT-based Auth** — Secure `Bearer` token sessions stored in `localStorage`
- **Student Registration** — Self-service enrollment directly from the game UI
- **Admin Role** — Backend supports `ADMIN` role for content management
- **Session Restore** — Auto-login on page refresh via `/api/auth/me`

### 🎵 Audio
- **Background Music** — Looping BGM with browser gesture unlock
- **Sound Effects** — Per-action SFX: footsteps, correct/wrong answers, level-up, door unlock, padlock
- **Volume Controls** — Independent BGM and SFX sliders in the Settings panel

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18 + TypeScript** | UI framework with strict type safety |
| **Vite 8** | Build tool and dev server |
| **Phaser 3** | Top-down game engine (physics, sprites, scenes) |
| **Tailwind CSS v4** | Utility-first styling with custom pixel-art design tokens |
| **Lucide React** | Icon system |
| **canvas-confetti** | Celebration effects on quiz pass |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express** | REST API server |
| **TypeScript** | Type-safe backend code |
| **Prisma ORM** | Database access layer |
| **PostgreSQL** | Relational database |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **bcrypt** | Password hashing |
| **Zod** | Request validation schemas |
| **Helmet + CORS** | Security headers and cross-origin policies |

### Dev & Testing
| Technology | Purpose |
|-----------|---------|
| **Vitest** | Unit and integration tests |
| **Supertest** | API endpoint testing |
| **tsx** | TypeScript execution for scripts |
| **Prisma Seed** | Automated database seeding |

---

## 🏗️ Architecture

```
Bio-Tech-Quiz-Quest/
├── backend/                        # Production REST API
│   ├── src/
│   │   ├── routes/                 # Express route handlers
│   │   │   ├── auth.ts             # POST /auth/login, /register, /logout
│   │   │   ├── subjects.ts         # GET /subjects, /subjects/:id/units
│   │   │   ├── units.ts            # GET /units/:id/topics
│   │   │   ├── topics.ts           # GET /topics/:id, /topics/:id/content
│   │   │   ├── quizzes.ts          # GET /quizzes, POST /quizzes/:id/start
│   │   │   ├── attempts.ts         # POST /attempts/:id/submit, GET /attempts/:id
│   │   │   ├── gamification.ts     # GET /gamification/xp, /gamification/badges
│   │   │   ├── progress.ts         # GET /progress
│   │   │   └── leaderboard.ts      # GET /leaderboard
│   │   ├── middleware/             # Auth guard, error handler, rate limiter
│   │   ├── services/               # Business logic layer
│   │   └── server.ts               # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema (16 models)
│   │   └── seed.ts                 # Full OMICS curriculum seeder
│   └── tests/                      # 127 Vitest test cases
│
└── frontend/                       # React + Phaser Game
    ├── public/
    │   └── assets/
    │       ├── images/             # Pixel-art icons and sprites
    │       └── audio/              # BGM and SFX files
    └── src/
        ├── api/                    # Typed API client (fetch + JWT injection)
        ├── context/
        │   ├── AuthContext.tsx     # Session state and auth methods
        │   ├── AudioContext.tsx    # Sound engine (BGM + SFX)
        │   ├── GameContext.tsx     # Screen router, academic data, XP cache
        │   └── ToastContext.tsx    # In-game achievement notifications
        ├── game/
        │   ├── scenes/
        │   │   ├── BootScene.ts    # Asset preloader + procedural pixel sprites
        │   │   └── CampusScene.ts  # Top-down world with movement & zones
        │   └── PhaserGame.tsx      # React ↔ Phaser event bridge
        ├── components/
        │   ├── auth/               # AuthModal (login + register)
        │   ├── hud/                # In-game HUD overlay (XP, level, prompts)
        │   ├── lab/                # LabTerminal, TopicReader
        │   ├── quiz/               # QuizScreen, ResultScreen
        │   ├── gamification/       # AchievementsHall, LeaderboardModal
        │   ├── map/                # WorldMapModal (fast travel)
        │   ├── menu/               # MainMenu, PauseMenu
        │   ├── settings/           # SettingsModal (audio + controls)
        │   └── ui/                 # PixelButton, PixelPanel, ProgressBar
        └── types/                  # Shared TypeScript interfaces
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **PostgreSQL** running locally (or a cloud instance)
- **npm** v9+

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Bio-Tech-Quiz-Quest.git
cd Bio-Tech-Quiz-Quest
```

---

### 2. Backend Setup

```bash
cd Bio-Tech-Quiz-Quest/backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL="postgresql://postgres@localhost:5432/biotech_quiz_quest?schema=public"
JWT_SECRET="your-secure-jwt-secret-here"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

Run database migrations and seed the full OMICS curriculum:
```bash
npx prisma migrate dev --name init
npm run seed
```

Start the backend server:
```bash
npm run dev
# ✅ Backend running at http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
# ✅ Frontend running at http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

### 4. Quick Start (Both Servers)

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd Bio-Tech-Quiz-Quest/backend && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd Bio-Tech-Quiz-Quest/frontend && npm run dev
```

---

## 🔌 Backend API

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ | Register new student |
| `POST` | `/auth/login` | ❌ | Login and receive JWT |
| `GET` | `/auth/me` | ✅ | Get current user profile |
| `POST` | `/auth/logout` | ✅ | Invalidate session |
| `GET` | `/subjects` | ✅ | List all subjects |
| `GET` | `/subjects/:id/units` | ✅ | Get units for a subject |
| `GET` | `/units/:id/topics` | ✅ | Get topics for a unit |
| `GET` | `/topics/:id/content` | ✅ | Get learning content |
| `GET` | `/quizzes` | ✅ | List quizzes (filter by topic/unit) |
| `POST` | `/quizzes/:id/start` | ✅ | Start a quiz attempt (returns timer + questions) |
| `POST` | `/attempts/:id/submit` | ✅ | Submit answers (server scores + awards XP) |
| `GET` | `/attempts/:id` | ✅ | Get attempt result with review |
| `GET` | `/gamification/xp` | ✅ | Get XP and level data |
| `GET` | `/gamification/badges` | ✅ | Get all badges (locked + unlocked) |
| `GET` | `/progress` | ✅ | Get subject/unit completion progress |
| `GET` | `/leaderboard` | ✅ | Get global ranked leaderboard |

---

## 🕹️ Game Screens

| Screen | Key | Description |
|--------|-----|-------------|
| **Main Menu** | — | Title screen with login/register access |
| **Overworld** | `WASD` / `↑↓←→` | Top-down campus exploration |
| **Lab Terminal** | `[E]` near lab door | Unit/topic selector with quiz launcher |
| **Topic Reader** | Click "Read Notes" | Academic content dossier |
| **Quiz Screen** | Click "Quiz" | Live timed assessment |
| **Result Screen** | Auto after submit | Score, XP, review, retry |
| **Achievement Hall** | HUD / Pause Menu | Badge collection viewer |
| **Leaderboard** | HUD / Pause Menu | Global XP rankings |
| **World Map** | HUD Map button | Fast-travel between zones |
| **Settings** | Pause Menu | Audio controls + keybind reference |
| **Pause Menu** | `[ESC]` | In-game pause overlay |

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

```
✓ 127 / 127 tests passing
✓ 0 TypeScript build errors
✓ Coverage: Auth, Subjects, Units, Topics, Quizzes, Attempts, Gamification, Leaderboard
```

### E2E Smoke Tests
```bash
npm run e2e:smoke
# Runs 24 live API smoke flows against a running backend instance
```

### Frontend Build Verification
```bash
cd frontend
npm run build
# ✓ 1823 modules transformed, 0 errors
```

---

## 🎨 Design System

The game uses a custom pixel-art design language:

| Token | Value | Usage |
|-------|-------|-------|
| `--wood-dark` | `#24140e` | Primary panel background |
| `--parchment` | `#fcf6e8` | Content document background |
| `--cyan-glow` | `#00e5ff` | Holographic highlights, XP, DNA |
| `--amber-gold` | `#ffb830` | Buttons, accents, warnings |
| `--biotech-emerald` | `#00b074` | Pass state, unlocked badges |

Fonts loaded via Google Fonts:
- **Press Start 2P** — Pixel UI labels
- **Silkscreen** — Subtitles, section headers
- **VT323** — Terminal / monospace displays
- **Outfit** — Body text, descriptions

---

## 📁 Project Structure

```
Bio-Tech-Quiz-Quest/
├── Bio-Tech-Quiz-Quest/
│   ├── backend/                # Express REST API + Prisma + PostgreSQL
│   └── frontend/               # Vite + React + Phaser 3 game
├── quiz_assets/                # Source pixel-art images and audio
└── README.md                   # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and ensure tests pass: `npm test`
4. Commit with a clear message: `git commit -m 'feat: add your feature'`
5. Push and open a Pull Request

Please do **not** modify the backend schema or API contracts without opening a discussion first — 127 tests depend on it.

---

## 📝 License

This project is licensed under the **Apache 2.0 License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with 🧬 by the Bio-Tech Quiz Quest Team**

[![Play Now](https://img.shields.io/badge/🎮%20Play%20Now-biotech--quiz--quest.vercel.app-00e5ff?style=for-the-badge&labelColor=1a120c)](https://biotech-quiz-quest.vercel.app/)

</div>