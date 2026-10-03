# AirTrace MP: Market Requirements Document (MRD)

**Initiative:** Source-aware air quality and community resilience platform for Madhya Pradesh | **Version:** 0.1 draft

> Assumptions to confirm: sponsor is the MP Department of Environment, MPPCB is the operating owner, MPSEDC is the technical partner; pilot cities are Bhopal, Indore and Singrauli. Items marked *(verify)* must be checked against official sources. Budget figures are indicative only.

---

# MARKET REQUIREMENTS DOCUMENT (MRD)

## A1. Problem and context
- Madhya Pradesh has several cities under India's National Clean Air Programme (NCAP) *(verify current city list: Bhopal, Indore, Gwalior, Jabalpur, Ujjain, Dewas, Sagar, Satna, Singrauli, Katni are commonly cited)*, plus industrial and coal clusters (Singrauli, Satna cement, Pithampur, Mandideep).
- Existing dashboards (CPCB, SAMEER, SAFAR where available) show **what** the AQI is, not **why**, and not at ward resolution. Station density in MP is sparse, so large areas have no local reading.
- City action plans under NCAP are often generic (road sweeping, blanket bans) because source evidence is weak and slow (source apportionment studies take months and are infrequent).
- Seasonal crop residue burning (notably wheat residue in spring, and burning in the Narmadapuram/Hoshangabad belt) and winter stagnation episodes affect air quality; the state has little real-time attribution of fire smoke to affected districts.
- Vulnerable groups (children in schools, patients at hospitals, dense low-income settlements) get no targeted early warning.

## A2. Opportunity
A low-cost, open-data screening layer that estimates **probable pollution sources per ward in near real time**, ranks wards by exposure x vulnerability, and generates evidence-backed actions and citizen alerts in Hindi and English.

## A3. Stakeholders and users
| Segment | Who | Primary need | Priority |
|---|---|---|---|
| Decision makers | Principal Secretary Environment, MPPCB Chair/Member Secretary, Municipal Commissioners | City-level view, accountability, NCAP reporting | P0 |
| Operators | MPPCB regional officers, Smart City / ICCC operators, Nagar Nigam engineers | Source evidence, action list, inspection targets | P0 |
| Field responders | District collector offices, Agriculture Dept, Fire/Forest dept | Fire plume alerts, where to deploy | P1 |
| Health | Health Dept, hospitals, school administrators | Early warning for vulnerable groups | P1 |
| Citizens | Residents, parents, asthma patients, farmers | Simple local advice in Hindi | P1 |
| Researchers / civil society | Universities, NGOs | Open data, methodology | P2 |

## A4. Policy and strategic alignment
- NCAP and city clean air action plans (ward-level evidence for plan actions)
- State climate action planning and disaster-management early-warning goals
- Digital India / MP digital governance priorities; open-data principles (NDSAP)
- Theme alignment: air quality, environmental monitoring, climate risk (stagnation and emissions co-benefit), community resilience (vulnerability-weighted alerts)

## A5. Competitive and alternative landscape
| Alternative | Strength | Gap AirTrace fills |
|---|---|---|
| CPCB / SAMEER dashboards | Official data | City-level only, no source or action layer |
| SAFAR (select cities) | Forecast and modeling | Limited cities, heavy infrastructure |
| Commercial AQ platforms (IQAir, etc.) | Polished UX | Not government-controlled, no source attribution tied to NCAP actions, ongoing licence cost |
| Vendor low-cost sensor networks | Dense data | Hardware cost, calibration, no attribution logic |
| Source apportionment studies | Chemically rigorous | Slow, episodic, expensive |

**Positioning:** a complement, not a replacement. AirTrace is a fast screening layer that tells officials where to investigate and which source to act on first; chemical apportionment remains the rigorous follow-up.

## A6. Value proposition and outcomes
- Faster, targeted enforcement instead of blanket measures
- Ward-level priority list for scarce resources
- Hours of lead time for smoke and stagnation warnings
- Better NCAP reporting and fund utilisation evidence
- Near-zero data licence cost (open data), state-owned IP and data

## A7. Success metrics (targets to agree with department)
| Metric | Pilot target (6 months) |
|---|---|
| Cities live with ward-level view | 3 |
| Share of wards with estimated AQI (vs stations only) | 100% of covered city wards |
| Median data freshness | under 90 min |
| Attribution review: officer-rated "useful/plausible" on sampled alerts | at least 70% |
| Alert-to-action cases logged (inspections, sprinkling, diversions) | tracked monthly, baseline set in month 1 |
| Citizen alert subscribers | 10,000 (stretch) |
| Uptime of operator dashboard | 99% in business hours |

## A8. Constraints and risks (market-level)
- Sparse stations reduce accuracy; mitigation: confidence scores, CAMS and satellite gap-filling, optional sensor augmentation in phase 3.
- Perception risk of "unofficial source numbers"; mitigation: labelled as indicative screening, never used alone for penalties.
- Data dependence on third-party APIs; mitigation: caching, fallback sources, documented data agreements.
- Institutional adoption; mitigation: training, SOPs, named nodal officers.

