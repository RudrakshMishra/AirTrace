# AirTrace MP: Implementation Plan

**Initiative:** Source-aware air quality and community resilience platform for Madhya Pradesh | **Version:** 0.1 draft

> Assumptions to confirm: sponsor is the MP Department of Environment, MPPCB is the operating owner, MPSEDC is the technical partner; pilot cities are Bhopal, Indore and Singrauli. Items marked *(verify)* must be checked against official sources. Budget figures are indicative only.

---

# IMPLEMENTATION PLAN

## D1. Phasing
| Phase | Duration | Scope | Exit criterion |
|---|---|---|---|
| 0. Buildathon prototype | 36-48 h | Single-city demo with cached data: map, fires, wind, breakdown, evidence, vulnerability, trap alert | Working demo, validation slide |
| 1. Mobilisation | Weeks 1-4 | MoU/sponsor, nodal officers, data agreements, requirements sign-off, procurement route, environments | Signed scope and data access |
| 2. Pilot build (MVP) | Months 2-4 | P0 requirements for Bhopal, Indore, Singrauli | UAT passed, VAPT cleared |
| 3. Pilot operation | Months 5-7 | Live use, tuning, P1 features (citizen portal, alerts, reports, action tracking), validation with MPPCB scientists | Pilot KPIs reviewed |
| 4. State scale-up | Months 8-14 | Remaining NCAP cities, forecast, open API, ICCC integration, optional sensor augmentation | Steering committee approval |
| 5. Steady state | Ongoing | O&M, model reviews, annual audit | SLA reports |

## D2. Work breakdown
1. **Discovery:** stakeholder interviews, existing station inventory, MPPCB data access, ward GIS inventory, current NCAP action plans.
2. **Data engineering:** connectors, QC, archive, ward/static layers per city, backfill 6-12 months.
3. **Model/engine:** implement scoring, back-trajectories, confidence, interpolation; calibrate to local seasons; hold-out and episode validation; model card.
4. **Backend/API:** endpoints, auth, audit, alerts, reports.
5. **Frontend:** operator console, citizen PWA, Hindi UX, accessibility.
6. **Platform/DevOps:** environments, CI/CD, monitoring, backups, security hardening.
7. **Quality and security:** test plan, UAT, VAPT, performance tests.
8. **Change management:** SOPs, training, helpdesk, communications.
9. **Governance:** steering committee, data-sharing agreements, DPDP documentation, model change control.

## D3. Team (pilot build)
| Role | Count |
|---|---|
| Programme / product manager | 1 |
| Data engineers | 2 |
| Data scientist / atmospheric analyst | 2 |
| Backend engineers | 2 |
| Frontend engineers | 2 |
| UX designer (Hindi/accessibility) | 1 |
| DevOps / security engineer | 1 |
| QA engineers | 1-2 |
| Domain advisor (MPPCB scientist, part-time) | 1-2 |
| Government nodal officers (per city) | 1 each |

## D4. Indicative timeline (Phases 1-3)
| Month | Milestones |
|---|---|
| 1 | Kick-off, requirement sign-off, data agreements, environments, backfill started |
| 2 | Ingestion and QC live, ward layers loaded, first engine version in notebook and API |
| 3 | Operator console beta, auth and audit, source scoring calibrated, internal demo |
| 4 | UAT in pilot cities, VAPT, accessibility audit, training material, go-live decision |
| 5 | Live pilot, daily review loop, citizen portal beta, alert templates approved |
| 6 | Alerts and community reports live, action tracking, first monthly report |
| 7 | Validation report with MPPCB scientists, pilot evaluation, scale-up proposal |

## D5. Indicative budget (planning range, to be refined)
| Item | Pilot (7 months) | Notes |
|---|---|---|
| Team (people cost) | largest share, roughly 60-70% | Depends on in-house vs vendor model |
| Cloud / data centre hosting | modest | Sized for 3 cities, scales with wards |
| Security audit, VAPT, accessibility audit | one-time | Mandatory before go-live |
| SMS / messaging | usage-based | Depends on subscriber count |
| Training and communications | modest | Workshops, SOP printing, Hindi content |
| Optional low-cost sensors (phase 4) | separate approval | Only if gap analysis justifies |
| Data licences | near zero | Open data; verify terms |
Prepare a detailed costed estimate with MPSEDC before approval; do not quote figures from this table.

## D6. Governance and RACI
| Activity | Env. Dept | MPPCB | MPSEDC | Dev team | ULBs | Health Dept |
|---|---|---|---|---|---|---|
| Policy and sponsorship | A | C | I | I | I | C |
| Data access (stations, GIS) | C | A/R | R | I | R | I |
| Model design and calibration | I | C | I | A/R | I | I |
| Hosting and security | I | I | A/R | R | I | I |
| Operations and action follow-up | I | A | I | C | R | I |
| Alert content approval | A | R | I | C | I | R |
| Training and adoption | C | A | R | R | R | R |
(A = accountable, R = responsible, C = consulted, I = informed)

**Forums:** monthly steering committee, fortnightly working group, weekly sprint reviews, incident review within 5 days of any major outage.

## D7. Testing strategy
- Unit tests for geometry (wind-direction convention), scoring, and confidence; synthetic scenarios (fire due north with north wind scores high; south wind about zero).
- Replay tests on historical episodes (spring burning, winter stagnation, a festival night, a rainy day).
- Hold-out station error; lag correlation of upwind fires vs PM2.5.
- Integration, load (peak citizen traffic during an episode), failover (upstream API down), and security tests.
- UAT scripts per persona, signed by nodal officers.

## D8. Rollout and training
- Training: 2-day operator workshop per city, 1-hour briefings for senior officials, Hindi quick-reference cards, recorded videos.
- SOP: daily 10 AM review of priority wards, action logging, escalation matrix, rules for using outputs in enforcement (screening evidence only; confirm by inspection or measurement).
- Helpdesk: email/phone, 4-hour response in business hours during pilot.
- Citizen communication: through municipal channels, schools, and health workers; Hindi first.

## D9. Operations and maintenance
- Monitoring: data freshness, job failures, API errors, alert delivery; on-call rota.
- Model governance: quarterly review of weights with MPPCB; versioning and rollback; annual external review.
- Seasonal readiness checklist before spring burning and winter stagnation.
- Support SLAs: P1 incident response in 1 hour, fix or workaround in 8 hours.

## D10. Risk register
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sparse or offline stations | High | High | Confidence score, CAMS/satellite gap-fill, station health dashboard, phase 4 sensors |
| Attribution seen as authoritative proof | Medium | High | "Indicative" labels, SOP restricting use, scientific review |
| Upstream API change or outage | Medium | Medium | Cache, fallback sources, connector tests |
| Data-sharing delays | Medium | High | Early MoU, escalation via steering committee |
| Low adoption by field officers | Medium | High | Co-design, training, simple SOP, nodal ownership |
| Privacy or security incident | Low | High | Minimal data, audit, VAPT, incident plan |
| Alert fatigue or false alarms | Medium | Medium | Thresholds, caps, feedback loop, review of precision |
| Funding or staffing gaps | Medium | Medium | Phase gates, open-source stack, documented hand-over |
| Misinformation from LLM text | Low | Medium | Numbers from engine only, templates, human-approved alert text |

## D11. KPIs and review
Track monthly: data freshness, uptime, wards covered, priority-list use, actions logged and closed, alert delivery rate, subscriber count, officer satisfaction, model error (MAE), false-alert rate. Publish a quarterly impact note for the steering committee.

## D12. Open questions for the sponsor
1. Which department owns the platform and the public-facing brand?
2. Which cities and which MPPCB/CPCB stations are in scope for the pilot?
3. Are ward boundaries and GIS layers available digitally, and from whom?
4. Hosting choice: State Data Centre or empanelled cloud?
5. Approved citizen channels (SMS, WhatsApp, Telegram, app) and DLT templates?
6. Can outputs be used in enforcement workflows, and under what SOP?
7. Funding source (NCAP funds, state budget, CSR/partners) and procurement route?

## D13. Immediate next steps (first 2 weeks)
1. Finalise buildathon prototype and validation slide; record backup demo.
2. Prepare a 2-page concept note and this document for the sponsoring department.
3. Request meetings with MPPCB (data access) and MPSEDC (hosting, security).
4. Inventory stations and GIS layers for Bhopal, Indore and Singrauli.
5. Draft data-sharing agreement and DPDP privacy notice.
6. Nominate nodal officers and form the working group.

---
*Prepared as a planning draft. Verify all marked items, legal requirements, and cost figures with the relevant authorities before submission.*
