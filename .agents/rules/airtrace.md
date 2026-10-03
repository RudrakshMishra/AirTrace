# SECTION A: PROJECT RULES

## Product
AirTrace MP is a Madhya Pradesh government platform that shows **why** the air is bad: ward-level AQI, probable pollution source (fires, traffic, dust, industry, other) with confidence, evidence, vulnerability-weighted priority wards, pollution-trap alerts, and Hindi/English citizen advice. Users: officers (MPPCB, municipal), senior officials, and citizens.

## Tech stack (do not substitute)
- Next.js 15 (App Router), TypeScript strict, Tailwind CSS v4, shadcn/ui, lucide-react
- Animation: `motion` (Framer Motion) for components, **Lenis** for smooth scroll, GSAP ScrollTrigger only on the landing page
- Map: MapLibre GL JS (via `react-map-gl/maplibre`), free OSM-based dark/light styles, no paid map keys
- Charts: Recharts
- State/data: TanStack Query, Zod for validation
- i18n: `next-intl` (Hindi `hi` and English `en`), Hindi is the default for the citizen portal
- Auth: **Clerk** (`@clerk/nextjs`)
- Database: PostgreSQL (Neon or Supabase, free tier) with **Drizzle ORM** and PostGIS-ready geometry stored as GeoJSON/JSONB for MVP
- Webhooks: `svix` to verify Clerk webhooks
- PDF: `@react-pdf/renderer` (Phase 8 only)

## Rules for the agent (follow strictly)
1. **Be economical.** Make the smallest change that satisfies the task. Do not rewrite files that already work. Do not re-read the whole repo each time; read only files you need.
2. Do **not** run the browser agent, screenshots, or long test loops unless I ask. Run only `npm run build` or `npm run typecheck` at the end of a phase, and fix errors.
3. Do not install packages outside the stack above without asking.
4. No secrets in code. Use `.env.local` and provide `.env.example` with every variable name (no values).
5. Every phase ends with: a short summary (max 10 lines), the list of files changed, and the exact commands I should run.
6. TypeScript strict, no `any`. Server Components by default; add `"use client"` only where needed (map, charts, animations).
7. Keep components small (under 200 lines). Put shared types in `src/types`, constants in `src/lib/constants.ts`.
8. Accessibility is mandatory: WCAG 2.1 AA contrast, keyboard navigation, focus rings, ARIA labels, `prefers-reduced-motion` respected everywhere (disable Lenis and animations when set).
9. Government UI tone: formal, clear, no gimmicks. Add the "Indicative screening, not legal source apportionment" label wherever source percentages appear.
10. All user-facing text goes in `messages/en.json` and `messages/hi.json`. Never hardcode strings in components.
11. Performance: dynamic-import the map and charts, lazy-load below-the-fold sections, optimise images with `next/image`, keep landing page JS lean.
12. Until the real backend exists, all data comes from a typed **data access layer** (`src/lib/data/*`) that reads the database and falls back to seeded mock JSON in `src/mocks/`. Components never call mock files directly, so the backend can be swapped later without UI changes.

## Design system
- **Style:** modern civic-tech, clean, high contrast, subtle glass cards on the landing page, flat and dense on the operator console.
- **Colors (CSS variables, light and dark):** deep navy primary `#1F3A5F`, teal accent `#0E9AA7`, saffron highlight `#F28C28` (sparingly), neutral slate greys. AQI scale (CPCB bands): Good `#00B050`, Satisfactory `#92D050`, Moderate `#FFD400`, Poor `#F28C28`, Very Poor `#E03C31`, Severe `#7E0023`.
- **Source colors (colour-blind-safe):** Fires `#D55E00`, Traffic `#0072B2`, Dust `#E69F00`, Industry `#6A3D9A`, Other `#7F7F7F`. Always pair colour with an icon or pattern.
- **Type:** Inter for English, Noto Sans Devanagari for Hindi (via `next/font`), large type scale, 8px spacing grid, 12px radius cards.
- **Dark and light mode** with a toggle; the map style switches with the theme.
- **Responsive:** mobile-first for the citizen portal; operator console optimised for 1366px laptops and projectors, usable on tablets.

## Motion and smooth scroll spec
- Lenis smooth scroll wrapper in the root layout (`duration ~1.1`, `easing` ease-out), disabled for reduced-motion users and inside map/table scroll containers (`data-lenis-prevent`).
- Landing page: scroll-triggered section reveals (fade + 24px rise, stagger 80ms), animated counters for key stats, a sticky "how it works" section where steps change as you scroll (GSAP ScrollTrigger pin), parallax on hero background layers, animated wind-line/particle canvas in the hero (cap at 60 particles, pause when off-screen).
- Navbar: shrinks and gains blur after 40px scroll; scroll progress bar at the top.
- Console: only functional motion (panel slide-in 200ms, number tween on change, skeleton loaders, map fly-to on selection). No decorative animation.
- Page transitions: short fade (150ms). Buttons: subtle press scale 0.98.
- Respect `prefers-reduced-motion`: replace all motion with instant state changes.

## Roles (Clerk)
`state_admin`, `city_admin`, `officer`, `viewer`, `moderator`. Store the role and `cityId` in Clerk `publicMetadata`. Public (no login): landing page and citizen portal. Everything under `/console` requires sign-in and a role. Role checks happen in `middleware.ts` and again in server actions/route handlers.

## Database schema (Drizzle, snake_case tables)
- `cities(id, name, name_hi, bbox, center_lat, center_lon)`
- `wards(id, city_id, name, name_hi, geometry_geojson, pop_density, n_schools, n_hospitals)`
- `stations(id, city_id, name, lat, lon, source)`
- `readings(id, station_id, ts, pm25, pm10, no2, so2, co, o3)`
- `fires(id, lat, lon, frp, confidence, acq_ts)`
- `ward_state(id, ward_id, ts, pm25_est, aqi_est, src_fire, src_traffic, src_dust, src_industry, src_other, confidence, ventilation, trap_flag, risk_score, evidence_json, model_version)`
- `actions(id, ward_id, ts, rule_id, text_en, text_hi, department, status, taken_by, taken_at, note)`
- `alerts(id, ward_id, ts, type, severity, message_en, message_hi, channel, recipients_count)`
- `subscribers(id, clerk_user_id nullable, phone_hash, ward_id, language, consent_at)`
- `reports(id, lat, lon, type, note, photo_url, status, created_at, moderated_by)`
- `users(id, clerk_id unique, email, role, city_id, created_at)`
- `audit_log(id, ts, actor_clerk_id, action, entity, entity_id, meta_json)`
Add indexes on `(ward_id, ts)`, `(station_id, ts)`, `(acq_ts)`. Provide a seed script (`npm run db:seed`) with 3 cities (Bhopal, Indore, Singrauli), about 20 realistic wards each, 24 hours of synthetic hourly `ward_state`, 150 fire points, and sample actions/alerts. Mark seed data as DEMO in the UI.

## Environment variables (.env.example)
`DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`, `CLERK_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEMO_MODE=true`
