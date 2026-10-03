# AirTrace MP: Product Requirements Document (PRD)

**Initiative:** Source-aware air quality and community resilience platform for Madhya Pradesh | **Version:** 0.1 draft

> Assumptions to confirm: sponsor is the MP Department of Environment, MPPCB is the operating owner, MPSEDC is the technical partner; pilot cities are Bhopal, Indore and Singrauli. Items marked *(verify)* must be checked against official sources. Budget figures are indicative only.

---

# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## B1. Vision and goals
**Vision:** Every officer and citizen in MP can see why the air is bad, who is most at risk, and what to do today.
**Goals:** (1) ward-level AQI estimates, (2) probable source attribution with confidence, (3) vulnerability-weighted priority and alerts, (4) actionable, auditable recommendations, (5) bilingual, accessible access.
**Non-goals (v1):** legally admissible source apportionment, automated penalties/challans, health diagnosis, indoor air quality, hardware sensor management.

## B2. Personas
1. **Officer (MPPCB regional):** wants to know which wards need inspection today and why.
2. **Municipal engineer:** wants the dust/traffic action list for his wards.
3. **Senior official:** wants a one-page city summary and trend.
4. **Parent / asthma patient:** wants "is it safe for my child to play outside" in simple Hindi.
5. **District officer (agri/collector):** wants active fire clusters likely affecting downwind towns.

## B3. Key user stories
- As an officer, I see a ward map coloured by AQI or by dominant source, and click any ward for breakdown, confidence, and evidence.
- As an officer, I get a ranked priority list (exposure x vulnerability) refreshed hourly.
- As a senior official, I download a ward or city PDF report with methodology note.
- As a district officer, I see fires upwind of a city and the estimated smoke arrival time.
- As a citizen, I enter my area and get today's advice in Hindi, and subscribe to alerts (Telegram/SMS/WhatsApp as approved).
- As an admin, I manage users, thresholds, ward data, and see audit logs.
- As a resident, I report burning or dust with a location and photo.

## B4. Functional requirements
Priority: P0 = pilot launch, P1 = pilot+60 days, P2 = state rollout.

| ID | Requirement | Priority |
|---|---|---|
| F-01 | Ingest station data (CPCB/OpenAQ), hourly, with retry and raw cache | P0 |
| F-02 | Ingest FIRMS fire detections (last 72 h, filtered by confidence) | P0 |
| F-03 | Ingest weather (wind, boundary layer, rain, humidity) and CAMS modeled AQ | P0 |
| F-04 | Ward boundaries and static layers (roads, industry, construction, schools, hospitals, population) per city | P0 |
| F-05 | Ward-level PM2.5/AQI estimate via interpolation blended with CAMS | P0 |
| F-06 | Source scoring: fires, traffic, dust, industry, other, with shares | P0 |
| F-07 | Confidence score (High/Medium/Low) with reasons | P0 |
| F-08 | Evidence panel listing signals behind each attribution | P0 |
| F-09 | Rule-based action recommendations linked to evidence and responsible department | P0 |
| F-10 | Vulnerability index and priority ranking | P0 |
| F-11 | Pollution-trap (ventilation) alert | P0 |
| F-12 | Map UI: AQI/source/fire/wind/vulnerability layers, timeline slider (24-72 h) | P0 |
| F-13 | Bilingual UI (Hindi/English) | P0 |
| F-14 | Role-based login, audit log | P0 |
| F-15 | PDF ward/city report | P1 |
| F-16 | Citizen portal with advice, mobile-first | P1 |
| F-17 | Alert engine and channels (Telegram first; SMS/WhatsApp via approved gateway) | P1 |
| F-18 | Community reporting with moderation queue | P1 |
| F-19 | LLM plain-language explanation (numbers supplied by engine only, templated fallback) | P1 |
| F-20 | Action tracking: officer marks action taken, outcome notes | P1 |
| F-21 | 24 h forecast of source impact and stagnation | P2 |
| F-22 | Open data API and public dataset export | P2 |
| F-23 | Integration with ICCC/Smart City dashboards, NCAP/PRANA reporting formats *(verify format)* | P2 |
| F-24 | Low-cost sensor ingestion and calibration | P2 |

## B5. Algorithm specification (summary)
- **Fire:** back-trajectory or upwind cone (about 30 degrees) from ward toward fires, weighted by FRP, distance decay, wind speed, and plume age under 36 h. Supporting: high PM2.5/PM10 ratio, elevated CO.
- **Traffic:** NO2, CO, rush-hour factor, road density within 1 km, stagnation multiplier.
- **Dust:** high PM10, low PM2.5/PM10 ratio, dry spell, daytime, construction proximity.
- **Industry:** SO2, upwind industrial polygons within about 5 km, steady-profile factor. In Singrauli, add known power-plant and mining locations as industrial points.
- **Other:** floor of 10-15% so the model never claims certainty.
- **Shares:** normalised scores, displayed as "likely contributing sources", not chemical percentages.
- **Confidence:** starts at 100, penalised for distant stations, missing/stale data, close top-two sources, conflicting signals.
- **Ventilation:** boundary layer height x wind speed; alert when low for 6+ hours with rising PM2.5 (threshold calibrated on local history *(verify)*).
- **Risk:** normalised PM2.5 x vulnerability (population density, schools, hospitals, optional deprivation proxy from official data only).
- **Governance of the model:** all weights in versioned config; every output stores model version; changes need a change-approval record.

## B6. Non-functional requirements
| Area | Requirement |
|---|---|
| Performance | Map load under 3 s on 4G; API p95 under 500 ms (precomputed hourly state) |
| Availability | 99% operator dashboard in business hours; graceful degradation to cached data with a visible "stale data" banner |
| Scalability | 55 districts / 400+ ULB wards supported by configuration, not code changes |
| Security | RBAC, MFA for officers, TLS, encryption at rest, secrets vault, VAPT before go-live, CERT-In guideline compliance |
| Privacy | Minimise personal data (phone numbers for alerts, report photos); consent, retention limits, DPDP Act 2023 compliance |
| Accessibility | GIGW 3.0 and WCAG 2.1 AA targets, low-bandwidth mode, large-text projector mode |
| Localisation | Hindi and English at launch; Unicode fonts; regional dialect review of advice text |
| Auditability | Immutable log of data versions, model versions, alerts sent, user actions |
| Maintainability | Open-source stack, documented, IaC, CI/CD, test coverage targets (engine 80%+) |
| Data ownership | All data, code and models owned by the state; no vendor lock-in |

## B7. Data requirements and governance
- Source registry listing each dataset, licence, owner, refresh rate, and fallback.
- Prefer official sources (CPCB, IMD, MPPCB stations); use OpenAQ, FIRMS, Open-Meteo/CAMS as supplements and verify their terms for government operational use.
- Ward boundaries from municipal bodies or MP open data; fall back to 1 km grid cells where wards unavailable.
- Quality rules: range checks, flat-line detection, outlier flags, missing-data tags. Never display imputed values as measured.

## B8. UX requirements
- Operator console: map (centre), priority list (left), ward detail (right), timeline (bottom), city switcher.
- Citizen portal: single-screen answer ("Today in your area: Poor. Main cause: dust. Advice: ..."), icons plus Hindi text, share button.
- Every number has an info tooltip and a visible methodology link and "indicative" label.
- Colour-blind-safe palettes; works on low-end Android devices.

## B9. Roles and permissions
| Role | Access |
|---|---|
| State Admin | All cities, config, users, audit |
| City Admin | One city: thresholds, wards, user management |
| Officer | View, actions, reports, mark action taken |
| Viewer (senior/dept) | Dashboards and reports |
| Moderator | Community report review |
| Public | Citizen portal only |

## B10. Alert policy
- Severity levels tied to AQI band, trap flag, and fire-plume ETA.
- Citizen alerts only above agreed thresholds, at most 2 per day, with quiet hours.
- Officer alerts include evidence and recommended action.
- Alert templates approved by Environment and Health departments; Hindi text reviewed.
- Every alert is logged with recipient count, channel, and content version.

## B11. Acceptance criteria (pilot go-live)
1. All P0 requirements pass UAT with nodal officers in each pilot city.
2. Replay test on at least 2 historical episodes: model runs, outputs plausible, reviewed by MPPCB scientists.
3. Hold-out station test reports MAE; documented limits.
4. VAPT critical/high findings closed.
5. Failover test: system shows cached data and stale banner when upstream APIs are down.
6. Training completed for at least 10 officers per city; SOP signed off.

