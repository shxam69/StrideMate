# StrideMate 🏃💨
> **Next-Gen GPS Activity Tracking, Gamification, Environmental Intelligence & Athlete Safety Ecosystem.**

[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-102%2F102%20Passed-brightgreen)](https://github.com)
[![Frontend Build](https://img.shields.io/badge/Frontend%20Build-Clean%20(Vite)-blue)](https://github.com)
[![Java](https://img.shields.io/badge/Java-21%20LTS-orange)](https://openjdk.org)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.0-green)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18%2B%20TypeScript-61dafb)](https://reactjs.org)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Supabase-336791)](https://supabase.com)

---

## 🌟 Key Features

### 1. 📍 Live GPS Activity Tracking & Route Replay
- **Real-Time Outdoor Telemetry:** Tracks distance, speed, pace, cadence, and velocity-based activity segmentation (Walking, Jogging, Running, Cycling).
- **Interactive Route HUD & Scrubber:** Interactive Leaflet map with Start (Green) & Finish (Red) pins, timeline scrubber, and speed multipliers ($1\times, 2\times, 5\times$).
- **Privacy Route Obfuscation:** Automatic start/end coordinate trimming to protect home and workplace privacy during social sharing.
- **Simulator Mode:** Built-in outdoor route simulator for desktop development and rapid testing.

### 2. 🎮 Gamification & Level Progression
- **Deterministic Quadratic Level Curve:** Level progression curve requiring $50 + (N \times 50)$ XP delta per level.
- **7-Day Consistency Calendar & Daily Streaks:** Automatically tracks activity frequency and unbroken daily streaks in UTC.
- **Daily Quests & Achievements:** 3 dynamic quests per day with reward XP, plus 12 non-repeatable milestone achievement badges.
- **Dynamic Leaderboards:** Real-time athlete ranking by All-Time, Weekly, and Monthly XP.

### 3. 🌤️ Environmental Intelligence & Smart Running Map
- **Live Environmental HUD:** Real-time AQI, PM2.5, PM10, UV Index, Temperature, Humidity, and Wind speed with Running Suitability Scoring ($0\text{--}100$).
- **Smart Running Spots Discovery:** Queries OpenStreetMap Overpass API for nearby parks, running tracks, and green spaces within 5 km.
- **Traffic Congestion Intelligence:** Real-time road congestion integration powered by TomTom Traffic API.

### 4. 🚨 Safety & Emergency SOS System
- **1.5-Second Hold-to-Confirm:** Prevents accidental triggers with radial visual progress fill.
- **High-Accuracy GPS Broadcast:** Validates and locks GPS coordinates before dispatching.
- **Provider-Agnostic Safety Protocol:** Dispatches emergency alerts to designated primary contacts with live Google Maps coordinates and timestamp (runs in safe **MOCK / SIMULATION** mode by default).
- **Truthful Delivery Status:** Strictly distinguishes `REQUESTED`, `ACCEPTED`, `MOCK_SENT`, `DELIVERED`, `FAILED`, and `UNAVAILABLE` states.

### 5. 🎨 Design & UI Architecture
- **Unified StrideLoader:** Smooth SVG polyline pulse loader adapted across all pages.
- **Dark & Light Themes:** Instant token swapping with persistent localStorage state.
- **Profile System:** Cartoon animal avatar selector and custom avatar file upload with path traversal guards.

---

## 🏗️ System Architecture

```
StrideMate/
├── backend/                  # Spring Boot 3.5.0 REST API (Java 21)
│   ├── src/main/java/com/stridemate/api/
│   │   ├── activity/         # Activities, GPS route breadcrumbs & scoring
│   │   ├── auth/             # JWT Authentication, OTP verification & security
│   │   ├── config/           # CORS, SecurityFilterChain & beans
│   │   ├── environment/      # OpenWeather & Overpass Smart Map services
│   │   ├── gamification/     # XP, Levels, Streaks, Quests & Achievements
│   │   ├── leaderboard/      # Aggregated time-frame leaderboards
│   │   ├── safety/           # SOS alerts, SpringEdge SMS & DLR callbacks
│   │   └── user/             # User profile, animal avatars & emergency contacts
│   ├── src/main/resources/   # application.properties & SQL schemas
│   ├── src/test/java/        # 102 comprehensive unit and integration tests
│   └── pom.xml
│
├── frontend/                 # React 18 SPA (TypeScript + Vite + Tailwind)
│   ├── src/
│   │   ├── components/       # RouteViewer, ShareCard, SmartMap, StrideLoader, etc.
│   │   ├── hooks/            # useGeoTracker, useAuth
│   │   ├── pages/            # Dashboard, AddActivity, ActivityHistory, Safety, etc.
│   │   ├── services/         # Axios API client & interceptors
│   │   └── types/            # TypeScript domain interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── database/                 # PostgreSQL & Supabase DDL
│   ├── migrations/           # Idempotent incremental migration scripts
│   └── supabase_schema.sql   # Master relational database schema
│
├── DESIGN.md                 # Full Software Design & Architecture Specification
├── README.md                 # Project Overview & Setup Guide
└── .env.example              # Environment variables template
```

---

## 🚀 Getting Started

### Prerequisites
- **Java:** JDK 21 LTS installed and on `PATH`
- **Maven:** Apache Maven 3.9+ (or use wrapper)
- **Node.js:** v18+ LTS and `npm`

---

### Local Development Setup

#### 1. Clone & Configure Environment
```bash
git clone https://github.com/your-username/StrideMate.git
cd StrideMate
cp .env.example .env
```

#### 2. Start the Backend API
```bash
cd backend
mvn spring-boot:run
```
*The Spring Boot backend will start on `http://localhost:8080` with in-memory H2 database enabled by default.*

#### 3. Start the Frontend Application
```bash
cd ../frontend
npm install
npm run dev
```
*The Vite development server will start on `http://localhost:5173`.*

---

## 🧪 Testing & Quality Assurance

### Run Backend Test Suite
```bash
cd backend
mvn clean test
```
*Executes all 102 automated tests (Authentication, GPS Route Persistence, Scoring, SpringEdge SMS mock dispatch, Idempotency, DLR Webhooks, User Isolation).*

### Run Frontend Production Build
```bash
cd frontend
npm run build
```
*Executes TypeScript compiler (`tsc -b`) and Vite production bundle optimization.*

---

## 🛡️ Security & Privacy Features

- **Stateless Bearer JWT Authentication** with 15-minute access token lifespan.
- **BCrypt Password Hashing** (10 salt rounds).
- **Start/Finish GPS Privacy Trimming** during social card sharing to prevent revealing home/office coordinates.
- **Strict Server-Side Coordinates Validation** preventing NaN/Infinity coordinate injections.
- **5-Minute Idempotency Guard** on emergency SOS dispatch preventing accidental duplicate alerts.

---

## 📄 License & Documentation
Detailed architectural and engineering documentation is available in [DESIGN.md](file:///C:/StrideMate/DESIGN.md).
