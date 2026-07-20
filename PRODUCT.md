# Lightsale AI Designer — Product Specification

**Version:** 1.0  
**Status:** Living document  
**Audience:** Product, design, engineering, and leadership  
**Last updated:** July 2026

This document is the **single source of truth** for what Lightsale AI Designer is, who it serves, what we will build, and how we measure success. It guides product decisions across multiple release cycles. Technical implementation details belong in `ARCHITECTURE.md`; this document defines *what* and *why*, not *how*.

---

## 1. Product Vision

**Lightsale AI Designer will become the leading AI-assisted platform for professional lighting design** — enabling anyone responsible for warehouse, industrial, and commercial lighting projects to go from an uploaded floor plan to a validated, code-aware lighting proposal in a fraction of the time it takes today.

We envision a world where lighting designers, contractors, and facility managers no longer manually trace floor plans, guess room dimensions, or iterate endlessly on fixture counts. Instead, they collaborate with intelligent tools that understand space, recommend appropriate luminaires, and produce defensible outputs that win business and pass inspection.

The floor plan editor is the **foundation**, not the destination. The product’s long-term value lies in combining spatial understanding, domain expertise, and AI to deliver accurate, auditable lighting designs at scale.

---

## 2. Mission

**To reduce the time, cost, and error rate of lighting design while improving the quality and consistency of outcomes for commercial and industrial spaces.**

We accomplish this by:

- Making spatial data (rooms, areas, heights, obstructions) easy to capture and trust  
- Applying AI to accelerate recognition and recommendation, with human oversight  
- Embedding lighting-domain knowledge (standards, product catalogs, calculation methods) into the workflow  
- Producing outputs that sales teams, installers, and customers can understand and approve  

---

## 3. Target Users

### Primary users

| Segment | Description |
|---------|-------------|
| **Lighting designers & engineers** | Professionals who specify luminaires, lux levels, and layouts for commercial/industrial projects |
| **Sales engineers (lighting distributors/manufacturers)** | Pre-sales staff who produce quick designs and quotes to win projects |
| **Electrical contractors** | Teams estimating retrofit and new-build lighting work from customer floor plans |

### Secondary users

| Segment | Description |
|---------|-------------|
| **Facility & warehouse managers** | Non-specialists exploring lighting upgrades before engaging a supplier |
| **Project managers (lighting OEMs/distributors)** | Oversee multiple designs, review outputs, and track project status |
| **Internal Lightsale operations** | Support, QA, and catalog administrators |

### Geographic & market focus (initial)

- **Benelux and broader EU** as the primary market, with Dutch/English UI and EU-relevant standards in mind  
- **Warehouse, logistics, and light industrial** as the initial vertical, expanding to retail, office, and parking structures over time  

---

## 4. User Personas

### Persona 1: Sophie — Lighting Sales Engineer

| Attribute | Detail |
|-----------|--------|
| **Role** | Sales engineer at a lighting distributor |
| **Goal** | Turn a customer’s floor plan into a credible proposal within 24–48 hours |
| **Pain** | Manual tracing in CAD or spreadsheets; inconsistent quality across colleagues; rework when dimensions are wrong |
| **Success** | Sends a professional PDF/light plan with fixture list and lux summary; wins the quote |
| **Tech comfort** | Moderate; prefers guided workflows over raw CAD |

### Persona 2: Mark — Independent Lighting Designer

| Attribute | Detail |
|-----------|--------|
| **Role** | Freelance lighting consultant for industrial clients |
| **Goal** | Accurate designs that meet EN 12464-1 (and related) requirements with full audit trail |
| **Pain** | Time spent on geometry instead of design decisions; difficulty keeping product catalogs current |
| **Success** | Defensible calculation report; minimal back-and-forth with client on room sizes |
| **Tech comfort** | High; wants precision and export to professional formats |

### Persona 3: Linda — Warehouse Facility Manager

| Attribute | Detail |
|-----------|--------|
| **Role** | Operations manager at a 12,000 m² distribution centre |
| **Goal** | Understand whether a proposed LED retrofit meets operational needs before signing |
| **Pain** | Cannot interpret technical drawings; relies entirely on supplier claims |
| **Success** | Clear visual of where lights go, expected brightness, and energy impact in plain language |
| **Tech comfort** | Low; needs simplicity and visual clarity |

### Persona 4: Tom — Engineering Lead (Platform Stakeholder)

| Attribute | Detail |
|-----------|--------|
| **Role** | Head of product/engineering at Lightsale |
| **Goal** | Scalable platform that integrates catalog, pricing, and CRM downstream |
| **Pain** | One-off tools that don’t compose; AI features that erode trust when wrong |
| **Success** | Repeatable pipeline from upload → design → quote with measurable conversion lift |
| **Tech comfort** | N/A (internal); cares about reliability, extensibility, and data quality |

---

## 5. Core Problems We Solve

| Problem | Today’s reality | Our approach |
|---------|-----------------|--------------|
| **Slow floor plan intake** | Manual tracing from PDFs/images takes hours | Upload + scale + room definition with AI-assisted recognition (future) |
| **Unreliable dimensions** | Wrong scale → wrong fixture counts and lux | Calibration workflow and server-side validation |
| **Inconsistent design quality** | Junior staff produce variable outputs | Guided workflows, templates, and AI recommendations against rules |
| **Catalog complexity** | Thousands of SKUs; wrong product selection | Curated catalog integration with fit-for-purpose suggestions |
| **Calculation burden** | Desktop tools are siloed and expensive | In-platform lux/grid calculations tied to room geometry |
| **Weak sales artefacts** | Designs live in email threads | Exportable proposals, BOMs, and visual light plans |
| **No single source of truth** | Versions scattered across files | Persistent projects with history and audit trail |

---

## 6. Value Proposition

**For lighting professionals and their customers, Lightsale AI Designer is the AI-assisted design platform that transforms floor plans into accurate, actionable lighting proposals — faster, more consistently, and with greater confidence than manual methods.**

### Key differentiators

1. **Spatial-first workflow** — Design starts from real floor plan geometry, not abstract grids  
2. **AI with accountability** — Suggestions are explainable, editable, and never silently applied  
3. **Domain-aware** — Built for lighting (lux targets, mounting heights, product families), not generic CAD  
4. **End-to-end path** — From upload to exportable proposal within one product  
5. **Lightsale ecosystem fit** — Native integration with catalog, pricing, and sales workflows (roadmap)  

### Elevator pitch

*Upload your floor plan. Define your spaces. Let AI recommend the right lights. Export a proposal your customer will trust.*

---

## 7. Product Principles

These principles govern **what we build** and **what we reject**.

1. **Accuracy before speed** — A fast wrong design is worse than a slow correct one. We never sacrifice dimensional or calculation integrity for UX shortcuts.

2. **Human in the loop** — AI proposes; humans approve. Every AI-generated element must be visible, editable, and reversible.

3. **Progressive disclosure** — Simple defaults for Sophie and Linda; advanced controls for Mark when needed.

4. **One project, one truth** — A project is the canonical record of geometry, design decisions, and outputs. No orphaned files.

5. **Trust through transparency** — Show how areas, lux levels, and product choices were derived. No black boxes in customer-facing outputs.

6. **Design for the sales moment** — Outputs must be presentable to non-technical buyers, not only to engineers.

7. **Composable platform** — Features (recognition, calculation, export) must stand alone and combine cleanly for future modules.

8. **Standards-aware, not standards-complete on day one** — We reference applicable norms (e.g. EN 12464-1) incrementally; we document what is and isn’t certified in each release.

---

## 8. Design Principles

These principles govern **how the product feels and behaves**.

1. **Clarity over density** — Industrial users work under time pressure. Every screen has one primary action.

2. **Visual feedback is immediate** — Room areas, scale status, and calculation results update as the user works.

3. **Forgiveness** — Undo/redo, non-destructive edits, and clear save/discard patterns are mandatory in the editor.

4. **Consistent spatial metaphor** — Pan, zoom, and draw behave predictably across the entire canvas experience.

5. **Accessible contrast and legibility** — Floor plans vary in quality; overlays and labels must remain readable on light and dark backgrounds.

6. **Mobile-aware, desktop-first** — V1 is optimised for desktop/laptop. Mobile is view-only or light edits where feasible later.

7. **Professional aesthetic** — The product should feel like a serious B2B tool, not a consumer toy.

8. **Error messages that help** — Failures (upload, scale, save) explain what happened and what to do next.

---

## 9. AI Principles

AI is central to the long-term product but must earn trust incrementally.

1. **Suggest, don’t silently commit** — AI recognition of walls, rooms, or fixtures produces drafts requiring explicit user acceptance.

2. **Confidence and fallback** — When confidence is low, say so and guide manual completion rather than guessing.

3. **Explainability** — Users can see *why* a room was detected or a product was recommended (e.g. area, mounting height, target lux).

4. **Training data hygiene** — Customer floor plans are sensitive; data use, retention, and opt-out must be documented and enforced.

5. **No hallucinated specifications** — AI must not invent product specs, lux values, or compliance claims. Recommendations come from the catalog and rule engine.

6. **Evaluation before promotion** — New AI features ship behind internal QA thresholds and, where appropriate, beta flags.

7. **Human override always wins** — Manual edits supersede AI output; the system never re-applies AI changes without user action.

8. **Augment experts, empower novices** — Sophie gets speed; Mark keeps control. Same engine, different default depth.

---

## 10. User Journey

### Journey A: New project from customer floor plan (primary)

| Stage | User action | Product response | Outcome |
|-------|-------------|------------------|---------|
| **Discover** | Learns about Lightsale AI Designer via sales team or web | Landing/value prop | User creates account (future) or opens app |
| **Create** | Creates a new lighting project, names it | Empty project with editor | Project ID assigned |
| **Upload** | Uploads PDF/PNG/JPG floor plan | Plan displayed on canvas | Visual baseline established |
| **Calibrate** | Sets scale via two known points + distance | Scale stored; areas become meaningful | Trust in dimensions |
| **Define spaces** | Draws or confirms room polygons | Areas in m² shown per room | Spatial model complete |
| **Design** *(future)* | Sets lux targets, mounting height, obstructions | Calculation engine runs | Fixture placement proposed |
| **Review** *(future)* | Adjusts AI/calc suggestions | Live lux grid / summary updates | Design validated |
| **Export** *(future)* | Generates proposal PDF, BOM, DXF | Branded deliverables | Customer-ready package |
| **Share** *(future)* | Sends link or export to CRM | Stakeholder access | Deal progresses |

### Journey B: Return to existing project

Open project list → select project → geometry and design state restored → continue editing → save.

### Journey C: AI-assisted room detection *(future — V2)*

Upload plan → run recognition → review detected rooms → accept/reject/edit → proceed to design.

### Emotional arc

**Anxiety** (will the plan work?) → **Confidence** (scale and rooms look right) → **Relief** (AI saves tracing time) → **Pride** (professional export wins the deal).

---

## 11. MVP Scope

**MVP (V1)** delivers the **spatial foundation** required for all future lighting features. It is intentionally editor-centric.

### In MVP

| Capability | Description |
|------------|-------------|
| **Project management** | Create, list, open, and persist lighting projects |
| **Floor plan upload** | Accept PDF, PNG, JPG; display on canvas |
| **Canvas navigation** | Zoom and pan with viewport independent of geometry |
| **Scale calibration** | Two-point calibration with real-world distance (metres) |
| **Room definition** | Draw polygonal rooms; edit vertices; name rooms |
| **Area calculation** | Per-room area in m² when scale is set |
| **Persistence** | Save and reload full project state |
| **Undo / redo** | Reversible edits to spatial data |
| **API + web UI** | Usable end-to-end by internal users and pilot customers |

### MVP success criteria (see §15)

Pilot users can complete Journey A through **Define spaces** without engineering support, and trust room areas for quoting rough fixture counts manually.

---

## 12. Explicitly Out Of Scope For V1

The following are **not** part of V1. They must not block MVP delivery and must not be partially shipped in ways that imply completeness.

| Item | Rationale |
|------|-----------|
| AI wall/room recognition | Requires ML pipeline, QA, and UX not yet built |
| Lux / illuminance calculations | Depends on stable geometry and product model |
| Fixture placement and catalog browsing | Requires product data integration |
| 3D visualisation and renderings | Out of scope for spatial MVP |
| Multi-user collaboration / real-time co-editing | Complexity; defer until auth and sync exist |
| User authentication and RBAC | V1 may run pilot without full auth; must be V2 priority |
| CRM / ERP integrations | Downstream of core design flow |
| Mobile-native editor | Desktop-first |
| Compliance certification claims | No stamped engineering sign-off in V1 |
| Billing and subscriptions | Product-market fit first |
| DXF/DWG import | PDF/image only in V1 |
| Obstruction columns, racking, and height modelling | Lighting design prerequisites for V2+ |
| Automatic light plan PDF export | Export in V2 |
| Multi-floor / multi-level buildings | Single plan per project in V1 |
| Offline mode | Online-only V1 |

---

## 13. Functional Requirements

Requirements are tagged **V1** (MVP), **V2**, **V3**, or **V4** for planning. IDs are stable for traceability.

### 13.1 Projects

| ID | Requirement | Release |
|----|-------------|---------|
| FR-P01 | User can create a named lighting project | V1 |
| FR-P02 | User can view a list of projects sorted by recent activity | V1 |
| FR-P03 | User can open a project and restore prior editor state | V1 |
| FR-P04 | User can save project changes explicitly | V1 |
| FR-P05 | System indicates unsaved changes | V1 |
| FR-P06 | User can delete a project | V2 |
| FR-P07 | User can rename a project | V2 |
| FR-P08 | User can duplicate a project | V3 |
| FR-P09 | Projects are associated with an authenticated user/organisation | V2 |

### 13.2 Floor plans

| ID | Requirement | Release |
|----|-------------|---------|
| FR-F01 | User can upload PDF, PNG, or JPG floor plans | V1 |
| FR-F02 | System displays uploaded plan aligned to canvas origin | V1 |
| FR-F03 | User can replace an existing floor plan | V1 |
| FR-F04 | System stores original file for reprocessing | V1 |
| FR-F05 | User can upload DXF/DWG | V3 |
| FR-F06 | AI proposes room boundaries from plan | V2 |

### 13.3 Scale & geometry

| ID | Requirement | Release |
|----|-------------|---------|
| FR-G01 | User can calibrate scale using two points and a known distance (m) | V1 |
| FR-G02 | System calculates polygon areas in m² when scale is set | V1 |
| FR-G03 | Canvas coordinates are independent of zoom/pan | V1 |
| FR-G04 | User can draw rooms as closed polygons (≥3 vertices) | V1 |
| FR-G05 | User can edit room vertices after creation | V1 |
| FR-G06 | User can name each room | V1 |
| FR-G07 | User can delete a room | V1 |
| FR-G08 | System validates scale and geometry on save (server-side) | V2 |
| FR-G09 | User can assign room type (office, warehouse aisle, etc.) | V2 |
| FR-G10 | User can specify ceiling height per room | V2 |

### 13.4 Editor UX

| ID | Requirement | Release |
|----|-------------|---------|
| FR-E01 | User can pan and zoom the canvas | V1 |
| FR-E02 | User can undo and redo spatial edits | V1 |
| FR-E03 | User can select tools: pan, select, scale, draw room | V1 |
| FR-E04 | System warns before navigating away with unsaved changes | V2 |
| FR-E05 | Keyboard shortcuts for save, undo, redo | V1 |

### 13.5 Lighting design *(future core)*

| ID | Requirement | Release |
|----|-------------|---------|
| FR-L01 | User can set target lux per room or zone | V2 |
| FR-L02 | System calculates average and min/max lux on a grid | V2 |
| FR-L03 | User can browse organisation’s luminaire catalog | V2 |
| FR-L04 | System recommends fixture count and placement | V2 |
| FR-L05 | User can manually add, move, and remove fixtures | V2 |
| FR-L06 | System accounts for mounting height and maintenance factor | V2 |
| FR-L07 | User can compare alternative designs (A/B) | V3 |
| FR-L08 | Energy consumption and ROI estimate per design | V3 |
| FR-L09 | Compliance check against selected standard (informational) | V3 |
| FR-L10 | AI optimises layout for uniformity and cost | V4 |

### 13.6 AI *(future)*

| ID | Requirement | Release |
|----|-------------|---------|
| FR-A01 | AI detects candidate room polygons | V2 |
| FR-A02 | User accepts/rejects each detection individually | V2 |
| FR-A03 | AI suggests luminaire family based on room type and lux target | V2 |
| FR-A04 | AI explains each suggestion with readable rationale | V2 |
| FR-A05 | AI learns from corrections within tenant (opt-in) | V4 |

### 13.7 Export & sharing

| ID | Requirement | Release |
|----|-------------|---------|
| FR-X01 | Export annotated floor plan with rooms (PDF/PNG) | V2 |
| FR-X02 | Export Bill of Materials (CSV/PDF) | V2 |
| FR-X03 | Export light plan proposal (branded PDF) | V2 |
| FR-X04 | Share read-only project link | V3 |
| FR-X05 | Push quote to CRM | V4 |

---

## 14. Non-Functional Requirements

### 14.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-P01 | Floor plan upload + display | < 10 s for 20 MB PDF on broadband |
| NFR-P02 | Canvas interaction latency | < 50 ms for pan/zoom on typical laptop |
| NFR-P03 | Project save | < 2 s under normal load |
| NFR-P04 | Lux recalculation (V2) | < 5 s for 50 rooms |

### 14.2 Reliability & availability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-R01 | Service uptime (production) | 99.5% monthly (excl. planned maintenance) |
| NFR-R02 | Zero data loss on save | ACID persistence; confirmed write to DB |
| NFR-R03 | Autosave (V2) | Recover from browser crash without manual save |

### 14.3 Security & privacy

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-S01 | Authentication required for production | V2 |
| NFR-S02 | Tenant isolation for project data | V2 |
| NFR-S03 | Encryption in transit (TLS) | Always |
| NFR-S04 | Encryption at rest for files and DB | V2 production |
| NFR-S05 | Upload size limit enforced | Configurable; default 50 MB |
| NFR-S06 | GDPR-aligned data retention and deletion | V2 |

### 14.4 Usability & accessibility

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-U01 | Primary flows completable without documentation | V1 pilot |
| NFR-U02 | WCAG 2.1 AA for core UI (excl. canvas) | V3 |
| NFR-U03 | Localisation (EN, NL) | V3 |

### 14.5 Maintainability & quality

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-M01 | Strict TypeScript; no `any` in frontend/shared | Always |
| NFR-M02 | Unit tests for geometry and calculation logic | Always |
| NFR-M03 | API integration tests for critical paths | V2 |
| NFR-M04 | CI pipeline on every PR | V2 |

### 14.6 Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SC01 | Support 1,000+ projects per organisation | V3 |
| NFR-SC02 | Object storage for floor plans (not local disk) | V2 production |
| NFR-SC03 | Async job queue for AI and heavy calculations | V2 |

---

## 15. Success Metrics

### 15.1 North Star Metric

**Qualified designs completed per month** — A *qualified design* is a project with calibrated scale, ≥1 defined room, and (from V2) ≥1 exported proposal or saved calculation.

### 15.2 MVP (V1) metrics

| Metric | Definition | Target (pilot) |
|--------|------------|----------------|
| **Activation rate** | % of created projects with uploaded floor plan | ≥ 70% |
| **Calibration rate** | % of uploaded plans with scale set | ≥ 60% |
| **Room completion rate** | % of calibrated projects with ≥1 room | ≥ 80% |
| **Time to first room** | Median minutes from upload to first saved room | < 15 min |
| **Save reliability** | Save failures / total saves | < 1% |
| **Pilot NPS** | Survey after 2 weeks of use | ≥ 30 |

### 15.3 V2+ metrics

| Metric | Definition |
|--------|------------|
| **AI acceptance rate** | % of AI-detected rooms accepted without major edits |
| **Design cycle time** | Upload → export proposal (median) |
| **Quote conversion lift** | Win rate vs. pre-platform baseline (A/B with sales) |
| **Calculation trust** | % of designs exported without manual override of lux |
| **Revenue influence** | € pipeline attributed to platform-generated proposals |

### 15.4 Counter-metrics (guardrails)

- **AI override rate** — High overrides signal poor model quality  
- **Support tickets per active user** — Quality and UX regressions  
- **Dimensional dispute rate** — Customer challenges to stated areas  

---

## 16. Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Poor floor plan quality** | Wrong geometry → wrong designs | High | Scale workflow, validation, manual override, upload guidance |
| **AI recognition errors** | Lost trust, bad quotes | Medium (V2+) | Human-in-the-loop, confidence scores, phased rollout |
| **PDF/coordinate mismatch** | Silent area errors | Medium | Unified render pipeline; cross-check server vs client |
| **Over-scoping V1** | Delayed launch | Medium | Strict MVP boundary (§12); PM sign-off on scope |
| **Catalog data stale** | Wrong product recommendations | Medium | Integration ownership; refresh SLAs with suppliers |
| **Regulatory misrepresentation** | Legal exposure on compliance claims | Low–Med | Informational-only labels until validated; legal review |
| **Data breach (floor plans)** | Customer trust, GDPR fines | Low | Auth, encryption, access controls (V2 prod) |
| **Low adoption by senior designers** | Product seen as “toy” | Medium | Precision tools, exports, audit trail for Mark persona |
| **Competitor incumbents** | DIALux, Relux, vendor tools | High | Focus on speed + AI + Lightsale catalog integration |
| **Key person / bus factor** | Delivery slowdown | Medium | Documentation (`PRODUCT.md`, `ARCHITECTURE.md`), code review culture |

---

## 17. Future Roadmap (V2, V3, V4)

### V1 — Spatial foundation *(current MVP)*

- Projects, upload, scale, rooms, areas, save/reload, undo/redo  
- Internal pilot and early customer trials  
- **Theme:** *Get the geometry right*

### V2 — Lighting design core

- User authentication and organisations  
- Room metadata (type, ceiling height)  
- AI room detection (beta) with accept/reject UX  
- Luminaire catalog integration (Lightsale products)  
- Target lux per room; grid-based calculation engine  
- Manual and assisted fixture placement  
- Export: annotated plan, BOM, basic proposal PDF  
- Production deployment (cloud storage, migrations, CI)  
- **Theme:** *From spaces to designs*

### V3 — Sales acceleration & collaboration

- Shareable read-only project links  
- Design variants and comparison (cost, energy, lux)  
- ROI and energy savings estimates  
- Informational compliance checks (EN 12464-1 zones)  
- CRM handoff (initial integration)  
- Localisation (EN/NL); WCAG improvements  
- Multi-floor projects  
- **Theme:** *Win more deals, faster*

### V4 — Intelligent platform

- AI layout optimisation (uniformity, cost, constraints)  
- Tenant-specific ML from opt-in correction data  
- Full CRM/ERP bi-directional sync  
- Advanced imports (DXF/DWG, BIM IFC exploratory)  
- Marketplace / third-party luminaire libraries  
- API for partners and enterprise automation  
- **Theme:** *The default lighting design OS for industrial commerce*

---

## 18. Development Rules

These rules apply to all engineering work on Lightsale AI Designer. They align product intent with sustainable delivery.

1. **`PRODUCT.md` wins on scope** — If a feature is not listed or is explicitly out of scope, it requires PM approval before implementation.

2. **`ARCHITECTURE.md` wins on structure** — Major structural changes require architecture review and doc update.

3. **No silent AI** — Any AI-generated data must be labelled and require explicit user acceptance before affecting calculations or exports.

4. **Geometry is sacred** — Changes to scale, area, or coordinate logic require unit tests and PM notification (customer-facing numbers).

5. **Strict typing** — TypeScript strict mode; no `any`. Shared contracts live in `@lightsale/shared` (or successor packages).

6. **Domain logic is not UI logic** — Calculations, validation, and transforms live in shared/domain modules, not React components.

7. **Small, reviewable increments** — Prefer vertical slices that are demoable over large batch PRs.

8. **Feature flags for AI and calculations** — New intelligence features ship behind flags until metrics thresholds are met.

9. **Document user-visible changes** — Release notes for anything Sophie or Mark would notice.

10. **Security is not optional from V2** — Auth, tenant isolation, and secrets management are release blockers for public production.

11. **Don’t fork the product spec** — Avoid duplicate requirements in wikis or tickets; link to `PRODUCT.md` FR/NFR IDs.

12. **Customer data minimisation** — Collect only what the feature requires; define retention per data class.

---

## 19. Definition of Done

A backlog item is **Done** when all applicable criteria are met:

### All features

- [ ] Acceptance criteria from the linked FR/NFR IDs are verified  
- [ ] Code reviewed and merged to the main branch  
- [ ] No known P1/P2 bugs introduced  
- [ ] User-visible behaviour documented in release notes (if applicable)  
- [ ] PM accepts demo on staging or local equivalent  

### V1 spatial / editor features

- [ ] Works on latest Chrome and Edge (desktop)  
- [ ] Strict TypeScript; no new `any`  
- [ ] Unit tests for new domain/calculation logic  
- [ ] Persists and reloads correctly via API  
- [ ] Undo/redo behaves correctly for the change (where applicable)  
- [ ] Error states show actionable messages  

### V2+ lighting / AI features

- [ ] Feature flag in place for initial rollout  
- [ ] AI outputs labelled; user confirmation required  
- [ ] Integration tests for API path  
- [ ] Performance within NFR targets  
- [ ] Security review for auth/data handling (if touching PII or files)  
- [ ] Success metric instrumentation added (analytics event)  

### Production release (any version)

- [ ] Migrations applied; rollback plan documented  
- [ ] Monitoring/alerting for errors and latency  
- [ ] `PRODUCT.md` and `ARCHITECTURE.md` updated if scope or structure changed  

---

## 20. Glossary

| Term | Definition |
|------|------------|
| **Lighting project** | A persisted workspace containing a floor plan, spatial definition, design decisions, and outputs |
| **Floor plan** | Uploaded PDF or raster image representing a building layout |
| **Scale calibration** | Process of defining real-world metres per canvas pixel using two known points |
| **Room / zone** | A closed polygon on the floor plan representing a distinct area for lighting purposes |
| **Canvas coordinates** | World-space 2D points on the floor plan; invariant to zoom and pan |
| **Viewport** | Current zoom and pan state of the editor view |
| **Target lux** | Desired illuminance level for a room, typically in lux (lm/m²) |
| **Lux grid** | Computed illuminance values across a room floor surface |
| **Luminaire / fixture** | A lighting product placed in a design |
| **Light plan** | Visual deliverable showing floor plan, fixtures, and optionally lux contours |
| **BOM** | Bill of Materials — list of products, quantities, and references for quoting |
| **Mounting height** | Distance from floor to luminaire plane (e.g. ceiling or rack height) |
| **Maintenance factor (MF)** | Derating applied for lamp lumen depreciation and dirt |
| **Uniformity** | Ratio of minimum to average lux on the work plane |
| **AI recognition** | Automated detection of walls, rooms, or features from a floor plan image |
| **Human in the loop** | Design pattern requiring user approval before AI output affects the project |
| **Proposal export** | Customer-facing PDF combining visuals, product list, and key metrics |
| **Tenant** | An organisation (e.g. distributor) whose users and catalog are isolated from others |
| **Vertical slice** | End-to-end shippable increment through all layers (UI → API → DB) |
| **Qualified design** | Project meeting minimum completeness for business use (see §15) |
| **EN 12464-1** | European standard for lighting of indoor work places (reference for V3+ checks) |

---

## Document governance

| Action | Owner | Frequency |
|--------|-------|-----------|
| Approve scope changes | Product Manager | Per decision |
| Update roadmap | Product Manager | Quarterly |
| Sync FR/NFR with backlog | Product + Engineering | Each sprint |
| Archive superseded sections | Product Manager | Major version bumps |

**Change log**

| Version | Date | Summary |
|---------|------|---------|
| 1.0 | July 2026 | Initial product specification |

---

*This document defines the product. When in doubt, ask: “Does this help users go from floor plan to trusted lighting proposal faster and more reliably?” If not, it waits.*
