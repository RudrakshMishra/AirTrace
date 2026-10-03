# AirTrace MP: Technical Design and Compliance

**Initiative:** Source-aware air quality and community resilience platform for Madhya Pradesh | **Version:** 0.1 draft

> Assumptions to confirm: sponsor is the MP Department of Environment, MPPCB is the operating owner, MPSEDC is the technical partner; pilot cities are Bhopal, Indore and Singrauli. Items marked *(verify)* must be checked against official sources. Budget figures are indicative only.

---


# SOLUTION AND TECHNICAL DESIGN

## C1. Architecture
```
Sources: CPCB/OpenAQ | FIRMS | IMD/Open-Meteo/CAMS | OSM/Municipal GIS | (Sentinel-5P)
   -> Ingestion (scheduled, retry, raw archive)
   -> Data store: PostgreSQL + PostGIS, object storage for raw files, Redis cache
   -> Engine (Python): QC, alignment, interpolation, source scoring, confidence, ventilation, risk, actions
   -> API (FastAPI, versioned) + Auth (OIDC/SSO, MFA)
   -> Clients: Operator web app, Citizen PWA, Alert service, Report service
   -> Observability: logs, metrics, alerting; Audit store
```

## C2. Technology choices (open source, replaceable)
- Backend: Python, FastAPI, pandas, geopandas, scikit-learn; Celery or APScheduler for jobs
- DB: PostgreSQL/PostGIS; Redis; MinIO/S3-compatible storage
- Frontend: React, MapLibre GL, Recharts; PWA for citizens; i18n framework
- Infra: Docker, Kubernetes or Docker Compose for pilot; Terraform/Ansible; GitHub/GitLab CI
- LLM (optional): explanation only, with numbers injected from the engine, templated fallback, no personal data sent
- Monitoring: Prometheus/Grafana, centralised logs

## C3. Hosting and security (government specifics)
- Host on MP State Data Centre or a MeitY-empanelled cloud (confirm data-localisation requirement with MPSEDC); production and staging separated.
- Government email/SSO integration where available; role mapping to departments.
- Security audit by a CERT-In empanelled auditor before go-live; periodic VAPT; vulnerability management SLA.
- Backups daily, tested restore quarterly; documented RPO 24 h / RTO 8 h for pilot.
- Citizen alert phone numbers stored hashed/encrypted with consent and opt-out; photo reports scrubbed of metadata.
- SMS via government-approved gateway with DLT-registered templates *(verify)*; WhatsApp only through an approved Business API route.

## C4. Compliance checklist
| Area | Item |
|---|---|
| Data protection | DPDP Act 2023: notice, consent, purpose limitation, retention, grievance contact |
| Accessibility | GIGW 3.0, WCAG 2.1 AA |
| Security | CERT-In directions, STQC/empanelled audit, MeitY cloud guidelines |
| Open data | NDSAP-aligned release of aggregated outputs |
| Procurement | GFR rules, GeM or competitive bidding for any vendor; open-source preference |
| IP | State ownership of code and data in all contracts; documented hand-over |
| Records | Audit logs and model versions retained as per department policy |

---
