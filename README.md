<div align="center">

# 🌬️ AirTrace MP
### Madhya Pradesh Air Quality & Probable Pollution Source Screening Platform
**मध्य प्रदेश वायु गुणवत्ता एवं स्रोत स्क्रीनिंग पोर्टल**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Clerk Auth](https://img.shields.io/badge/Clerk-RBAC-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre-GL_5.0-396B94?style=for-the-badge)](https://maplibre.org/)
[![Bilingual](https://img.shields.io/badge/Locale-EN_%7C_हिन्दी-F28C28?style=for-the-badge)](https://next-intl-docs.vercel.app/)

<br />

<img src="./docs/images/hero_banner.jpg" alt="AirTrace MP Command Center" width="100%" style="border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);" />

<br />
<br />

**A state-of-the-art environmental intelligence and micro-targeted pollution mitigation system built for Madhya Pradesh under the National Clean Air Programme (NCAP).**

[Explore Live Demo](http://localhost:3000) • [Citizen Portal](http://localhost:3000/citizen) • [Municipal Console](http://localhost:3000/console) • [Design System](http://localhost:3000/design)

</div>

---

## 🌟 Executive Overview

**AirTrace MP** transforms complex atmospheric telemetry, satellite observations, and sensor fusion into actionable municipal enforcement tasks and public health advisories across **Bhopal**, **Indore**, and **Singrauli**.

Unlike traditional city-average monitoring, AirTrace delivers **hyperlocal, ward-level attribution**, tracking probable contributors (vehicular traffic, industrial smoke, road/construction dust, biomass fires, and secondary particulates), detecting meteorological **inversion traps**, and dispatching automated enforcement actions with an immutable audit trail.

---

## 📸 Visual Showcase

### 📱 1. Mobile-First Citizen Advisory Portal (`/citizen`)
Designed Hindi-first as a Progressive Web App (PWA) with offline shell caching, low-bandwidth mode, GPS-assisted ward detection, vulnerable demographic health advisories, and instant community incident reporting.

<div align="center">
  <img src="./docs/images/citizen_portal.jpg" alt="Citizen Advisory PWA" width="85%" style="border-radius: 12px; margin: 12px 0;" />
</div>

### 🛡️ 2. Municipal Command Console & Workflow Engine (`/console`)
A role-governed command center for MPPCB officers and municipal authorities featuring live action workflows (`open` ➔ `in_progress` ➔ `done`), inversion-trap alerts, report moderation, versioned threshold calibrations, and state-wide audit logs with CSV export.

<div align="center">
  <img src="./docs/images/console_workflow.jpg" alt="Municipal Command Console" width="85%" style="border-radius: 12px; margin: 12px 0;" />
</div>

---

## 🛠️ Complete Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15 (App Router)** + **React 19** | Server Components by default, SSR/SSG hybrid streaming, edge-ready architecture |
| **Styling & Design Tokens** | **Tailwind CSS v4** + **shadcn/ui** | Zero-runtime CSS variables, CPCB standard AQI palettes, dark/light modes |
| **Motion & Interaction** | **Motion (`motion/react`)** + **Lenis Smooth Scroll** | Micro-animations, particle wind canvas, smooth momentum scrolling |
| **GIS & Geodata** | **MapLibre GL 5** + **GeoJSON Polygons** | Ward boundary choropleths, thermal fire anomaly clusters, dispersion cones |
| **Data Visualization** | **Recharts** + **Lucide Icons** | 24h hourly AQI trends, stacked source breakdown bar charts, responsive graphs |
| **Authentication & RBAC** | **Clerk (`@clerk/nextjs`)** | JWT role verification via `publicMetadata`, Svix webhooks, seamless demo mode |
| **Database & ORM** | **PostgreSQL (Neon Serverless)** + **Drizzle ORM** | Type-safe migrations, 12 relational tables, spatial indexes, Zod validation |
| **Document Engine** | **`@react-pdf/renderer`** | Server-side automated generation of official bilingual ward and city reports |
| **Internationalization** | **`next-intl`** | Full bilingual support across English and Hindi (`hi`), locale routing (`as-needed`) |
| **Security & Auditing** | **CSP, HSTS, Rate Limiter, Sanitizer** | Strict Content Security Policy, sliding-window rate limiting, immutable audit logs |

---

## 📐 System Architecture

```mermaid
flowchart TB
    subgraph DataSources["Data Telemetry Ingestion"]
        CPCB["CPCB / MPPCB Stations"]
        MODIS["Satellite MODIS / VIIRS (Fires)"]
        IMD["IMD Weather & Inversion Telemetry"]
        CitizenFeed["Citizen Mobile Incident Reports"]
    end

    subgraph CoreEngine["AirTrace Intelligence Core"]
        DAL["Typed Data Access Layer (DAL)"]
        Heuristics["Sensor Fusion & Dispersion Model"]
        TrapDetector["Atmospheric Inversion Trap Engine"]
        AuditEngine["Audit Log Ledger (Immutable)"]
    end

    subgraph Delivery["User Applications"]
        CitizenPortal["Mobile Citizen Advisory PWA (/citizen)"]
        Console["Municipal Command Console (/console)"]
        PdfGenerator["React-PDF Report Generation (/api/pdf)"]
        Landing["Public Landing & Motion Showcase (/)"]
    end

    DataSources --> DAL
    DAL --> Heuristics
    DAL --> TrapDetector
    Heuristics --> AuditEngine
    TrapDetector --> Delivery
    AuditEngine --> Console
    CoreEngine --> Delivery
```

---

## 🔑 Key Features Matrix

- 🎯 **Hyperlocal Ward Attribution:** 60 wards with authentic GeoJSON boundaries in Bhopal, Indore, and Singrauli.
- ⚡ **Pollution Inversion Trap Alerts:** Real-time monitoring of boundary layer height and ventilation index ($m^2/s$) to detect hazardous stagnation.
- 🚦 **Priority Action Workflows:** Rule-based mitigation triggers (anti-smog gun deployment, traffic rerouting, mechanised sweeping, brick kiln curfews).
- 📜 **Official PDF Briefs:** Automated PDF shift handovers and public reports generated via `@react-pdf/renderer` in English and Hindi.
- 🔒 **Zero-Trust Role-Based Access:** 5 distinct officer tiers (`viewer`, `officer`, `moderator`, `city_admin`, `state_admin`).
- 📝 **Audit Trail Governance:** Every mitigation state change, user role modification, and report approval writes an immutable row into `audit_logs`.
- 🌐 **Offline Citizen PWA:** Web app manifest, service worker caching shell, GPS location detection, and low-bandwidth text mode.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** `v20.x` or later
- **npm:** `v10.x` or later
- **Git**

### 2. Clone and Install
```bash
git clone https://github.com/RudrakshMishra/AirTrace.git
cd AirTrace
npm install
```

### 3. Environment Configuration
Copy the example environment template:
```bash
cp .env.example .env.local
```

Configure your `.env.local` file:
```env
# Application Host
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEMO_MODE="true"

# Clerk Authentication (Optional for local demo mode)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
CLERK_WEBHOOK_SECRET=""
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/console"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/citizen"

# PostgreSQL Database (Neon / Supabase)
DATABASE_URL="postgres://user:password@ep-sample-pool.neon.tech/airtrace_mp?sslmode=require"
```

> 💡 **Zero-Config Demo Mode:** AirTrace runs out of the box with zero external dependencies! If `DATABASE_URL` and Clerk keys are omitted, the application automatically uses comprehensive in-memory seed data with full State Admin access.

### 4. Database Setup & Seeding (When using Postgres)
```bash
# Generate SQL migrations
npm run db:generate

# Push schema migrations to Postgres
npm run db:migrate

# Seed synthetic MP cities, wards, telemetry, and actions
npm run db:seed
```

### 5. Launch the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛡️ Role-Based Access Control (RBAC)

AirTrace enforces server-side role validation using Clerk `publicMetadata`:

| Role | Permissions | Accessible Routes |
| :--- | :--- | :--- |
| `viewer` | Read-only telemetry, station data, and public maps | `/console`, `/console/alerts` |
| `officer` | Update mitigation actions status and execution notes | `/console/actions`, `/console/alerts` |
| `moderator` | Moderate community incident reports (approve/reject) | `/console/reports` |
| `city_admin` | Manage officer assignments and threshold rules for their city | `/console/settings`, `/console/admin/users` |
| `state_admin` | Global superuser: access all cities, audit logs, and parameters | All `/console/*` routes including `/console/audit` |

---

## 📑 Automated PDF Report Service

AirTrace includes a headless PDF compilation pipeline via `@react-pdf/renderer`:

- **Endpoint:** `GET /api/pdf`
- **Query Parameters:**
  - `wardId`: Ward identifier (e.g., `bhopal-ward-1`)
  - `cityId`: City identifier (`bhopal`, `indore`, `singrauli`)
  - `lang`: Language preference (`en` or `hi`)
- **Direct Link Example:**
  ```text
  http://localhost:3000/api/pdf?wardId=bhopal-ward-1&lang=hi
  ```

---

## ⚖️ Statutory Disclaimer & NCAP Policy Notice

> **IMPORTANT STATUTORY NOTICE:**
> Indicative screening, not legal source apportionment. Modelled estimates and probable source shares derived from sensor fusion, dispersion heuristics, and satellite observations for rapid municipal response under NCAP guidelines. Regulatory enforcement and legal proceedings require certified reference-grade laboratory chemical mass balance analysis.

---

## 👨‍💻 Author & Repository

- **Repository:** [https://github.com/RudrakshMishra/AirTrace](https://github.com/RudrakshMishra/AirTrace)
- **Author:** [Rudraksh Mishra](https://github.com/RudrakshMishra)
- **License:** Open Environmental Public License under NCAP Madhya Pradesh Initiative.
