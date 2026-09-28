# ADGP: Technical Feasibility, Architecture and Scoping Assessment

**Project:** ADGP, a basketball recruiting platform
**Prepared for:** internal use in responding to the buyer (Alfonso)
**Status:** pre-discovery. Based only on the buyer's first message.

Labels used throughout:

- **[CONFIRMED]**: the buyer said it explicitly.
- **[ASSUMPTION]**: a reasonable inference that still has to be checked with the buyer.
- **[RECOMMENDED]**: our architectural or product recommendation. The buyer did not ask for it.
- **[QUESTION]**: must be answered before a fixed quote.

---

## 0. The headline answer

### Can this project realistically be worked on and technically scoped with the current information?

**Yes, it can be technically designed and built. No, it cannot be given a responsible fixed price yet.**

- **Technically feasible: yes.** Every capability the buyer described is proven technology: profiles, eligibility records, document management, full-game video, a coach workspace, search, shortlists and multiple user roles. Nothing here needs research-grade engineering. The one exception is future automated video analysis (computer vision), and the buyer has **not** asked for it yet.
- **Architecture: yes, at a high level.** We know enough to choose the stack, the video pipeline pattern, the data-model backbone and the permission model. We can also design Phase 1 so that AI can be added later without a rewrite.
- **Fixed quote: not yet.** The biggest cost drivers are still unknown:
  1. The exact user roles and who can see what
  2. What "eligibility" means (tracking a status, or verifying documents through an admin workflow)
  3. Video volume, who uploads, and quality and retention
  4. Whether any automated video analysis is expected in the first release
  5. Communication, notifications and payments or subscriptions

These items can move the budget by 2–5×.

**Recommended engagement model:** a paid **Discovery & Technical Specification** milestone (Milestone 0). It ends with a fixed-price quote for the build milestones. Until then, give ranges only (see §9).

---

## 1. What the buyer wants (as stated)

| # | Item | Status |
|---|------|--------|
| 1 | A basketball recruiting platform called **ADGP** | [CONFIRMED] |
| 2 | **Athlete profiles** with recruiting/player information | [CONFIRMED] |
| 3 | **Eligibility information** for athletes | [CONFIRMED] |
| 4 | **Full-game basketball film** inside the platform | [CONFIRMED] |
| 5 | A **coach/recruiter workspace** | [CONFIRMED] |
| 6 | Coaches can **search for players** | [CONFIRMED] |
| 7 | Coaches can **review game footage** | [CONFIRMED] |
| 8 | Coaches can **manage shortlists** | [CONFIRMED] |
| 9 | **Different user roles** | [CONFIRMED], but the roles are not listed |
| 10 | **Document management** | [CONFIRMED] as an area of needed experience. The document types are not listed. |
| 11 | "Complex platform workflows" | [CONFIRMED] as expected. The workflows are "mapped out" but not yet shared. |
| 12 | Wants relevant past projects, availability, and how we would scope the build | [CONFIRMED] (a sales requirement, not a product requirement) |

### Clearly defined

- The product category (recruiting platform) and the sport (basketball).
- The two primary sides: **athletes** (who are the subject of profiles and film) and **coaches/recruiters** (who search, review and shortlist).
- The core coach loop: **search → review film → shortlist**.
- Full-game video, not only highlight clips. This one word has large infrastructure implications.

### Still unclear

- Who creates and owns athlete profiles (the athlete, a parent, a club/team, or an admin).
- What eligibility means, and who verifies it.
- Which documents exist and who can see them.
- Who uploads film, how much, and at what quality.
- Whether coaches annotate or clip film, or only watch it.
- Whether coaches collaborate (staff sharing lists) or work alone.
- Whether any messaging, notifications, payments or AI are in scope.
- The buyer's "mapped workflows". **Ask for these first.** They may answer half of this document.

### Areas that must be clarified before a fixed quote

User roles, eligibility model, document types and verification, video volume and retention, video analysis expectations, search fields, recruiting workflow stages, communication, monetization, and the MVP boundary. See §11.

---

## 2. Technically difficult components (cost, timeline and architecture drivers)

| Component | Why it is hard or expensive | Impact |
|-----------|----------------------------|--------|
| **Full-game video** | A single game runs 1.5–2+ hours, and a raw upload is often 2–10 GB. It needs resumable uploads, transcoding into several renditions, adaptive streaming and a CDN. Storage and bandwidth are **ongoing** costs, not one-time build costs. | **High** (architecture + operating cost) |
| **Future AI/CV analysis** | Player tracking, event detection and automated stats in basketball are a hard CV problem: occlusion, similar uniforms, varied camera angles and gym lighting. It needs GPUs, labeled data and an ML team. | **Very high**, but *only if requested* |
| **Eligibility + documents** | If "eligibility" means *verified* status (an admin reviews transcripts or test scores, statuses expire), it becomes a workflow system with an audit trail and sensitive-data handling. | **Medium–High**, depending on the answer |
| **Role-based permissions** | Multiple roles (athlete, parent, coach, club, admin) plus data visibility rules (who can see documents, film, contact info) spread through every screen and API. | **Medium** (must be designed correctly on day 1) |
| **Minors' data** | Many recruited basketball athletes are high-school minors. That raises parental consent, privacy and data-protection questions. **Legal review recommended.** | **Medium** (process + compliance) |
| **Search** | Simple at first. Becomes harder with many filters, stat ranges, geography and eligibility-aware filtering at scale. | **Low → Medium** |

---

## 3. What kind of system is this?

**A combination. ADGP is a multi-role SaaS platform with three specialized subsystems:**

1. **A marketplace-style profile platform.** Athletes present themselves and coaches discover them.
2. **A video platform.** Full-game ingest, processing, streaming and review tooling.
3. **A lightweight sports CRM.** The coach workspace: shortlists, notes, recruiting statuses and possibly pipeline stages.

On top of these sits a **document and eligibility workflow** subsystem.

**Why this classification matters:** a "normal web app" estimate would badly under-price the video subsystem and the permission model. Each subsystem should be a **separate module** with clear boundaries inside a single codebase (a modular monolith; see §5). The team can then build and price each module independently.

---

## 4. Should future AI/video analysis influence the Phase 1 architecture?

**Yes, in a few cheap ways. No, in the expensive ways.**

**Do in Phase 1 (low cost, large future savings)** [RECOMMENDED]:

1. **Keep the original uploaded video file** (the "mezzanine") in our own object storage, not only the transcoded streaming versions. CV models need the highest-quality source. Some managed video providers make it awkward or costly to retrieve originals later.
2. **Model video as `Game → Video → time-coded Events`.** Store human bookmarks and notes as generic `video_events` rows with `start_ms`, `end_ms`, `type`, `source`, `confidence` and `created_by`. Later, AI-generated events (shots, rebounds, and so on) go into the **same table** with `source = 'model'` and a `model_version`. The UI for "jump to moment" and "clip" then works for both.
3. **Link athletes to games explicitly**: rosters, jersey numbers and team colors per game. This is the hardest data for CV to infer and the most valuable to have in advance.
4. **Run all video processing through an asynchronous job queue** with a job-status table. Later, an "analyze this game" job becomes a new job type sent to GPU workers, and the web app does not change.
5. **Capture basic video metadata**: resolution, frame rate, duration, and camera type if known.

**Do not do in Phase 1:**

- Buy or build GPU infrastructure.
- Build ML pipelines, labeling tools or model training.
- Promise any automated stats.

Hosted or fine-tuned models, or specialized sports-CV vendors, should be evaluated in a separate Phase 4 feasibility study once there is real footage to test on.

---

## 5. Recommended high-level architecture

```
                ┌─────────────────────────────────────────────┐
  Browser  ───► │  Web App (Next.js / React / TypeScript)      │
  (athlete,     └───────────────┬─────────────────────────────┘
   coach,                       │ HTTPS / JSON API
   admin)       ┌───────────────▼─────────────────────────────┐
                │  API: modular monolith (TypeScript/NestJS)   │
                │  modules: auth · users/roles · athletes ·    │
                │  eligibility · documents · games/video ·     │
                │  search · workspace(shortlists/notes) ·      │
                │  notifications · admin · audit               │
                └──┬──────────┬───────────┬──────────┬────────┘
                   │          │           │          │
          ┌────────▼──┐ ┌─────▼─────┐ ┌───▼──────┐ ┌─▼──────────────┐
          │PostgreSQL │ │ Redis +   │ │ Object   │ │ Video service   │
          │ (primary  │ │ job queue │ │ storage  │ │ (managed: Mux / │
          │  data)    │ │ (BullMQ)  │ │ (S3)     │ │ Cloudflare      │
          └───────────┘ └─────┬─────┘ │ docs +   │ │ Stream, or AWS  │
                              │       │ video    │ │ MediaConvert +  │
                        ┌─────▼─────┐ │ originals│ │ CloudFront)     │
                        │ Workers   │ └──────────┘ └─────────────────┘
                        │ (process- │
                        │ ing, email│        Future (Phase 4):
                        │ webhooks) │  ──►  GPU CV workers (Python)
                        └───────────┘       reading originals from S3,
                                            writing video_events
```

### Frontend: Next.js (React + TypeScript) [RECOMMENDED]

- **Why:** a mature ecosystem for complex dashboards (coach workspace, admin), good video player integrations (hls.js / Video.js / provider SDKs), and server-side rendering for public-facing athlete profile pages, which matters for SEO and sharing. TypeScript is shared with the backend, so one team can cover both ends.
- **Mobile:** a responsive web app first. **[QUESTION]** Is a native mobile app expected? It would add significant scope. Athletes uploading film from phones is a common scenario.

### Backend: TypeScript modular monolith (NestJS or similar) [RECOMMENDED]

- **Why a monolith rather than microservices:** one deployable unit is cheaper to build, test and run for a small team. Strict **module boundaries** (separate folders, services and DB schemas per domain) keep the option of extracting services later, for example a video or AI service.
- **Why TypeScript:** the same language as the frontend and strong typing across a large domain model. Python is reserved for future CV/ML workers, where it is the industry standard.
- **Background jobs:** Redis + BullMQ, or a cloud queue (SQS). All slow work goes here: video webhooks, thumbnail generation, email, document scanning.

### Database: PostgreSQL [RECOMMENDED]

- **Why:** relational integrity for users, roles, athletes, shortlists and permissions; JSONB for flexible profile fields while the schema is still evolving; built-in full-text search, which is enough for MVP search; PostGIS if geographic search is needed; mature managed hosting (AWS RDS, Supabase, Neon, and others).

### Authentication

- Email + password registration and login, email verification, and password reset through signed, time-limited tokens.
- **Recommended:** a managed identity provider (Auth0, Clerk or AWS Cognito) *or* a proven library. Hand-rolled auth is not recommended. **Why:** it cuts security risk and gives MFA, brute-force protection and social login almost for free.
- **MFA** is recommended for admins and coaches, since they have access to minors' data and documents.
- **Sessions:** short-lived access tokens + rotating refresh tokens, or secure HTTP-only cookie sessions. Include session revocation for admins.
- **RBAC + ownership rules** are described in §6.
- **[QUESTION]** Must coaches be verified (for example, confirmed as real college staff) before seeing athlete data? This is an important trust and safety decision.

### Storage

- **Documents:** a private S3 bucket (or equivalent), server-side encryption, with **no public URLs**. Access only through short-lived pre-signed URLs issued after a permission check. Run a virus/malware scan on upload through a worker job.
- **Video originals:** a separate S3 bucket, with a lifecycle policy that moves originals to cheaper storage tiers after N days (for example, S3 Glacier Instant Retrieval). **Why:** originals are large and rarely read except for re-processing or future AI.
- **Streaming renditions:** held by the video provider or in an S3 bucket behind a CDN.

### Video infrastructure (the critical subsystem)

**Upload pipeline:**

1. The client requests an upload. The API checks permissions and creates a `video` record with status `uploading`.
2. The client uploads **directly to storage** (the API never proxies the bytes), using **resumable, chunked uploads**: S3 multipart, tus, or the provider's direct-upload URL. **Why:** multi-GB files over gym Wi-Fi *will* fail midway, so resumability is mandatory for full games.
3. A storage or provider webhook updates the status to `processing`.

**Processing / transcoding:**

- Transcode into an **adaptive bitrate (ABR) ladder**, for example 1080p / 720p / 480p / 360p, packaged as **HLS**. Also generate a poster image and thumbnails, and for scrubbing, sprite sheets.
- **Option A (recommended for MVP): a managed video platform** such as Mux or Cloudflare Stream. **Why:** transcoding, ABR, the player, signed playback and analytics come ready-made. That saves weeks of work and removes a whole class of operational problems. Costs are per minute stored and delivered, so they grow with usage.
- **Option B: AWS MediaConvert + S3 + CloudFront.** Lower unit cost at scale and full control, but more engineering and operations. It becomes worth it once volume is known and large.
- **Either way, keep a copy of the original in our own S3** (see §4).
- Status is tracked in the DB (`uploading → processing → ready | failed`) and surfaced in the UI. Failed jobs retry.

**Streaming and CDN:** HLS delivered through a CDN, with the player choosing quality automatically based on bandwidth. **Why:** coaches watch full games on varied connections, and smooth seeking is essential for film review.

**Access control:** **signed, expiring playback tokens** issued by our API after a permission check. Raw video URLs are never public. **[QUESTION]** Is film public, coach-only, or restricted per athlete? Should downloads be blocked? Is watermarking needed?

**Film review features** (a [QUESTION] for scope): timestamped notes, bookmarks, clip creation (start/end markers on the source, with no re-encode in the MVP), playback speed, frame stepping, and keyboard shortcuts for coaches.

### Search

- **MVP: PostgreSQL** with indexed filters (position, graduation year, height, location, and so on) plus full-text search on names, schools and teams. **Why:** it is enough for tens of thousands of profiles, and it avoids running a second system.
- **Later: a dedicated engine** (OpenSearch, Typesense or Meilisearch) if the platform needs typo tolerance, faceted counts, relevance ranking, geo-radius queries at scale, or sub-100 ms search across very large datasets. A search **abstraction layer** in the API lets us swap engines without changing the UI.

### Notifications (not confirmed, [QUESTION])

Possible triggers:

- Document verified or rejected
- Eligibility expiring
- Video finished processing
- A coach viewed a profile (sensitive, product decision)
- Shortlist shared with a colleague

Build a **notification service interface** early (event → channel: email / in-app). The first delivery can be transactional email only (Postmark, SES). In-app and push notifications can be added without changing the code that raises events.

### Admin

An administrator will almost certainly need:

- User management: approve or suspend, verify coaches, and reset access.
- Athlete profile moderation.
- A document and eligibility verification queue.
- Video moderation: remove inappropriate content, and reprocess failed videos.
- Reference data: positions, schools, leagues and seasons.
- An audit log viewer.
- Basic metrics: users, uploads, storage used.
- **Impersonation** ("view as user") for support, logged in the audit trail.

---

## 6. User roles and permission design

**[CONFIRMED]** There are multiple roles. **[QUESTION]** Which ones exactly?

| Candidate role | Likely purpose | Status |
|---|---|---|
| Athlete | Owns their profile, uploads film/docs | [ASSUMPTION], very likely |
| Coach / Recruiter | Searches, reviews film, shortlists | [CONFIRMED] |
| Parent / Guardian | Manages a minor athlete's account | [QUESTION]. Important for minors. |
| Club / Team / High-school program | Manages many athletes, uploads team games | [QUESTION]. Changes the upload model significantly. |
| Organization (college program) | Groups coaches, shares lists | [QUESTION] |
| Administrator | Operates the platform | [ASSUMPTION], near-certain |

**Recommended design** [RECOMMENDED]:

- **Permission-based RBAC, not hard-coded role checks.** Code checks `can(user, 'video.view', resource)`, never `if role == 'coach'`. Roles map to permission sets stored in the DB, so a new role such as "Assistant Coach (read-only)" is a configuration change, not a code change.
- **Two layers:**
  1. *Role permissions*: what kinds of action the user may perform.
  2. *Resource rules*: ownership, organization membership, and athlete privacy settings. For example, a coach can view a profile only if it is published, and can see eligibility documents only if the athlete has granted access.
- **Organization scoping** from day 1 (users belong to 0..n organizations with a role *within* each). **Why:** retrofitting multi-tenancy later is one of the most expensive rewrites in SaaS.
- A centralized policy module, with **automated tests for every permission rule** and **audit logging** for sensitive reads (documents) and all writes.

---

## 7. Document management and eligibility

### Eligibility: what it could mean (all [QUESTION])

| Interpretation | Technical implication |
|---|---|
| **Informational fields** (for example GPA, test scores, NCAA Eligibility Center registration status, entered by the athlete) | Simple profile fields. Low cost. |
| **Tracked status with documents** (the athlete uploads a transcript or ID and the status shows on the profile) | Document store + status field. Medium cost. |
| **Verified eligibility** (an admin or third party reviews documents and marks items verified, with expiry dates and re-verification) | Workflow engine, verification queue, audit trail, notifications. High cost. |
| **Integration with an external eligibility authority** | Depends entirely on API availability. Possibly not feasible, since many such bodies have no public API. Needs research. |

**Important:** "eligibility" can mean academic eligibility, athletic/amateur status, recruiting-calendar eligibility (who may contact whom, and when), or age/grade eligibility. **The buyer must define which.** We should not implement compliance *rules* (for example, NCAA contact periods) unless the buyer explicitly asks and provides the rule source. Those rules change, and encoding them creates liability.

### Document architecture [RECOMMENDED]

- `documents` table: owner (athlete), category, current version, visibility, verification status, expiry date.
- `document_versions`: an immutable history of uploads. **Why:** eligibility disputes require showing what was submitted and when.
- `document_access_grants`: explicit sharing (for example, an athlete grants a coach or organization access to their transcript).
- Private encrypted storage, pre-signed downloads, malware scanning, file-type and size limits.
- A verification workflow: `pending → verified | rejected (reason)`, with `verified_by` and `verified_at`, and expiry reminders via scheduled jobs.
- All access logged to `audit_logs`.

**[QUESTION]** Which document types? Who can view each type? Who verifies? Do documents expire? Is e-signature needed?

---

## 8. Proposed data model (core entities)

Legend: **C** = supports a confirmed requirement · **R** = recommended architecture · **Q** = only if the buyer confirms the feature.

| Entity | Purpose | Tag |
|---|---|---|
| `users` | Login identity, email, status | C |
| `roles`, `permissions`, `role_permissions` | Configurable RBAC | C (roles) / R (design) |
| `organizations` | College programs, clubs, schools | R / Q |
| `memberships` | user ↔ organization with a role in the org | R |
| `athletes` | Athlete entity (may exist before the athlete has a login, if a club creates it) | C |
| `athlete_profiles` | Recruiting fields; structured columns + JSONB for evolving fields; visibility settings | C |
| `athlete_stats` | Per-season or per-game stats, if manually entered | Q |
| `coaches` | Coach profile, title, verification status | C |
| `teams` | Club/HS/AAU teams | R |
| `team_rosters` | athlete ↔ team ↔ season (+ jersey #) | R (critical for future CV) |
| `games` | Date, teams, event/tournament, venue | C (full-game film implies games) |
| `game_participants` | athlete ↔ game (+ jersey #, team side) | R (critical for future CV) |
| `videos` | Game footage file: provider asset id, original S3 key, status, duration, resolution, fps | C |
| `video_events` | Time-coded events: bookmarks, notes, clips, and later AI events (`source`, `model_version`, `confidence`) | R |
| `processing_jobs` | Status of transcode/scan/analysis jobs | R |
| `eligibility_records` | Eligibility item, status, expiry, verified_by | C (exact shape Q) |
| `documents`, `document_versions`, `document_access_grants` | Document management | C (types Q) |
| `shortlists` | A coach's lists (owner, org, private/shared) | C |
| `shortlist_entries` | athlete ↔ shortlist (+ status, rank, added_by) | C |
| `notes` | Coach notes on an athlete (private or org-shared) | R / Q |
| `tags`, `taggings` | Flexible labels on athletes/entries | Q |
| `recruiting_statuses` | Configurable pipeline stages per org | Q |
| `notifications` | In-app notification records | Q |
| `audit_logs` | Who did what, when, to which resource | R (strongly) |
| `subscriptions`, `payments` | If monetized | Q |

**Key relationships:**

- `users 1—0..1 athletes`, `users 1—0..1 coaches`, and `users n—n organizations` (via `memberships`).
- `athletes 1—1 athlete_profiles`; `athletes 1—n documents`; `athletes 1—n eligibility_records`.
- `games 1—n videos`; `games n—n athletes` (via `game_participants`); `videos 1—n video_events`.
- `coaches 1—n shortlists`; `shortlists n—n athletes` (via `shortlist_entries`); `notes n—1 athletes`, authored by users and scoped to an org.
- Every write to a sensitive table produces an `audit_logs` row.

---

## 9. Development phases

Phases are **proposed**. Their content and order must be confirmed with the buyer.

### Phase 0: Discovery & technical specification (required before any fixed quote)

- Review the buyer's mapped workflows.
- Final role and permission matrix.
- User stories + acceptance criteria.
- Low-fidelity wireframes of key screens.
- Final data model, architecture and video-provider decision (with a cost model).
- Security and privacy model, including minors' data.
- API outline.
- MVP boundary and a fixed-price milestone quote.

### Phase 1: Core platform

Auth, roles/permissions, athlete profiles, eligibility (per the defined model), document management, basic coach workspace (search + shortlists), admin basics.

### Phase 2: Video platform

Full-game upload, processing, streaming, game organization, linking athletes to games, access control. Film review features (timestamps, bookmarks, notes, clips) per the buyer's scope.

> **Note:** because film review is a *confirmed* core coach activity, a basic version of Phase 2 (upload + playback + linking athletes to games) almost certainly belongs in the MVP. Phases 1 and 2 will likely overlap in the MVP.

### Phase 3: Advanced recruiting tools (all Q)

Recruiting pipeline stages, tags, shared/collaborative lists, advanced filtering, notifications, messaging, profile-view analytics, exports.

### Phase 4: AI / computer vision (all Q; separate feasibility study first)

Player detection/tracking, event detection, automated stats and highlights. **Recommendation:** start with a 3–6 week technical spike on the buyer's real footage before committing to any feature list.

---

## 10. Milestone structure (Fiverr/client-friendly)

**Estimation basis (adjust to your own rate):**

- Days = focused developer-days for one senior full-stack developer (or the equivalent across a small team). They include testing and code review.
- Budget uses a **blended $400–$650 per developer-day**, typical for a senior freelance or small-studio rate. US/EU agency rates would run 1.5–2.5× higher.
- Infrastructure and third-party service costs are **excluded** and paid by the client.

| # | Milestone | Objective & key features | Technical work | Deliverables | Acceptance criteria | Dev-days | Depends on | Key risks | Budget (USD) |
|---|---|---|---|---|---|---|---|---|---|
| **M0** | **Discovery & Spec** | Turn the buyer's workflows into a buildable spec | Workshops, role/permission matrix, data model, video provider evaluation + cost model, wireframes | Spec doc, wireframes, ERD, architecture doc, fixed quote for M1+ | Buyer signs off on the spec and MVP scope | 8–12 | Buyer availability + workflow docs | Scope creep; slow feedback | $3.5k–7.5k |
| **M1** | **Foundation** | A secure, deployable skeleton | Repo, CI/CD, staging + prod environments, DB, auth (register/login/reset/verify), RBAC engine, audit log, base UI/design system | Live staging URL; users can register and log in per role | Each role logs in and sees only its allowed areas; permission tests pass; password reset works | 15–20 | M0 | Auth-provider choice; environment access | $6k–13k |
| **M2** | **Athlete Profiles** | Athletes create and manage recruiting profiles | Profile schema (per spec), editing, photo upload, visibility settings, public/coach views, (Q: parent/club management) | Profile creation, editing and viewing | Athlete completes a profile; a coach sees it only if it is published; validation per spec | 12–18 | M1 | Field list changes | $5k–12k |
| **M3** | **Documents & Eligibility** | Secure documents + eligibility tracking | Private storage, pre-signed URLs, virus scan, versioning, access grants, eligibility records, admin verification queue, expiry jobs | Document upload/view; eligibility status on profile; admin verification | Unauthorized users cannot fetch documents (tested); verify/reject flow works; expiry reminders fire | 15–22 | M1, M2 | Undefined eligibility model; privacy rules | $6k–14k |
| **M4** | **Video Ingest & Processing** | Reliable full-game uploads | Resumable direct-to-storage upload, provider integration, original retained in S3, webhooks, job queue, status UI, retries, size limits | Upload a full game → see it processing → ready | A 2-hour, multi-GB file uploads successfully over an interrupted connection; failed jobs are visible and retryable | 15–22 | M1 | Large-file edge cases; provider limits; cost | $6k–14k |
| **M5** | **Games & Film Review** | Coaches watch and review film | Game entity, linking athletes to games (roster/jersey), HLS player, signed playback, (Q: timestamps, bookmarks, notes, clips) | Game pages, film player, review tools per scope | Only authorized users can play; seeking is smooth on typical broadband; bookmarks persist | 12–20 | M4, M2 | Scope of review tools | $5k–13k |
| **M6** | **Search & Discovery** | Coaches find players | Indexed filters per spec, full-text search, sort, pagination, saved searches (Q) | Search page with filters | Search results respect visibility rules; results return in under 1 s on seeded data (for example 50k profiles) | 10–15 | M2 | Undefined filter list; geo search | $4k–10k |
| **M7** | **Coach Workspace & Shortlists** | Coaches organize prospects | Shortlists CRUD, add/remove athletes, statuses, notes, (Q: sharing within org, tags, pipeline) | Workspace dashboard | Coaches manage multiple lists; private lists are never visible to others (tested) | 10–16 | M1, M2, M6 | Collaboration scope | $4k–10k |
| **M8** | **Admin Console** | The operator can run the platform | User/coach verification, moderation, document queue, video management, reference data, audit viewer, basic metrics | Admin panel | Admins perform every listed action; every action is audit-logged | 10–15 | M1–M7 | Scope growth | $4k–10k |
| **M9** | **Notifications** *(if confirmed)* | Key events reach users | Notification service, transactional email templates, (Q: in-app) | Emails for agreed events | Each agreed event sends the correct email; users can opt out where allowed | 5–10 | M3–M7 | Email deliverability | $2k–6.5k |
| **M10** | **Hardening & Launch** | Production readiness | Security review, pen-test fixes, load testing (video + search), backups, monitoring/alerts, legal pages, production cutover | Production launch, runbook, handover docs | No open high-severity security issues; load test targets met; restore-from-backup rehearsed | 12–18 | All | Late surprises | $5k–12k |
| | **Total (MVP-to-launch scope)** | | | | | **124–188** | | | **~$50k–122k** |

**Why milestones are split this way:** each milestone produces something the buyer can **click and test** on staging. Each has objective acceptance criteria, which suits milestone-based payment platforms. Each is small enough (2–4 weeks) that a problem shows up early.

**Contingency:** add **15–20%** for unknowns until M0 is complete. Post-launch maintenance is typically quoted separately (monthly retainer).

---

## 11. Estimation: three scope levels

| | **MVP** | **Production V1** | **Advanced Platform** |
|---|---|---|---|
| **Scope** | Auth + roles; athlete profiles; basic eligibility (status + docs); document upload with private access; full-game upload, processing and playback; linking athletes to games; basic search/filters; shortlists + notes; basic admin; email for critical events | MVP + verified eligibility workflow, document versioning/expiry, film review tools (bookmarks, notes, clips), advanced search (dedicated engine if needed), org/team accounts and shared lists, recruiting pipeline, notifications, analytics, hardening, possibly subscriptions/payments | V1 + AI/CV: player detection/tracking, event detection, automated stats, auto-highlights, GPU pipeline, model evaluation and review UI |
| **Duration** | ~4–6 months | ~7–10 months (cumulative) | ~12–18+ months (cumulative) |
| **Team** | 2–3 (senior full-stack ×1–2, part-time UI/UX, part-time QA/DevOps) | 3–5 (2–3 full-stack, designer, QA, part-time DevOps) | 5–8+ (above + 2–3 ML/CV engineers, data labeling, MLOps) |
| **Technical complexity** | Medium–High | High | Very High |
| **Major infrastructure** | Managed Postgres, S3, managed video (Mux/Cloudflare Stream), email service, app hosting | + search engine, CDN tuning, monitoring/APM, possibly self-managed transcoding for cost | + GPU compute (cloud GPU instances/batch), ML model registry, labeled datasets, heavy storage for originals |
| **Estimated dev budget** | **$50k–120k** | **$120k–250k** | **$300k–700k+** (the AI part is highly uncertain until a feasibility spike) |
| **Monthly infra (indicative)** | $300–$2k+ depending on video minutes | $1k–$8k+ | $5k–$30k+ (GPU- and storage-driven) |

**What drives cost:**

1. Video volume and viewing hours (storage + delivery bills grow with usage).
2. How strict eligibility verification is.
3. Number of roles and the complexity of the visibility rules.
4. Collaboration features (shared lists, org accounts).
5. Native mobile apps.
6. AI/CV ambitions.

**The MVP range is honest, not low:** a platform that handles minors' data, private documents and multi-GB video cannot safely be built for less.

---

## 12. Technical risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Large video uploads** | Multi-GB uploads fail on weak connections | Resumable chunked direct-to-storage uploads; client-side size/format checks; clear progress + resume UI; test with real 2-hour files early (M4) |
| **Video transcoding** | Slow, can fail on odd formats (phone/camcorder codecs, variable frame rate) | Managed provider for the MVP; job queue with retries; status visibility; a supported-format list |
| **Cloud storage costs** | Full games accumulate fast | Retention policy per plan; lifecycle rules to cold storage for originals; cap uploads per athlete/team; per-account usage dashboard |
| **Streaming costs** | Egress/delivery is billed per GB or minute watched | CDN; ABR (serve lower renditions when appropriate); a cost model in M0 based on expected viewing hours; consider self-managed pipeline at scale |
| **Concurrent users** | Spikes around tournaments/signing periods | Stateless API behind a load balancer + autoscaling; CDN absorbs video load; load test in M10 |
| **Data privacy (minors)** | Legal and reputational exposure | Legal review of consent/privacy; guardian accounts if needed; data minimization; privacy controls per field; encryption at rest/in transit; data export/deletion flow |
| **Role permissions** | A single bug can expose private data | Centralized policy module; deny-by-default; automated permission test suite; audit logs; security review before launch |
| **Document security** | Transcripts/IDs are highly sensitive | Private bucket, pre-signed short-lived URLs, malware scanning, access grants, audit trail on every read |
| **Search scalability** | Complex filters slow down at scale | Proper indexes; a search abstraction; migrate to a dedicated engine when metrics justify it |
| **AI processing costs** | GPU time per full game is significant | Process on demand or per paid tier; batch/spot GPUs; analyze only relevant segments; measure cost per game in the feasibility spike |
| **GPU infrastructure** | Operationally complex | Use managed GPU batch services or a specialized sports-CV vendor first; build in-house only when unit economics are proven |
| **Video processing queues** | Backlogs during upload surges | Queue-based workers that autoscale; priority queues; dead-letter queue + alerts |
| **Database scalability** | Growth of events, audit logs, notes | Postgres scales well for this domain; partition large append-only tables (audit_logs, video_events); read replicas if needed |
| **Future AI integration** | Risk of a rewrite | Originals kept, generic time-coded `video_events`, explicit athlete↔game↔jersey links, job-based processing (see §4) |
| **Undefined requirements** | The biggest real risk to budget and timeline | Paid discovery milestone; written change-request process; fixed price only per milestone after spec |

---

## 13. The 10 most important questions for Alfonso (before a fixed quote)

1. **User roles:** exactly which account types exist (athlete, parent/guardian, coach, recruiter, club/high-school team, college program/organization, admin)? Who can see what, and do coaches need to be verified before accessing athlete data?
2. **Athlete profiles:** who creates and maintains profiles (the athlete, a parent, a club, or your team)? Can you share the list of required profile fields, and which are public and which are coach-only?
3. **Eligibility:** what does "eligibility" mean for ADGP (academic, amateur status, recruiting eligibility, or something else)? Is it self-reported, verified by your admins, or pulled from an external source? Do statuses expire?
4. **Documents:** which document types will be stored (transcripts, test scores, IDs, medical, consent forms)? Who uploads them, who may view each type, and does anything need versioning, verification or e-signature?
5. **Video volume & upload:** who uploads game film (athletes, clubs, your staff)? Roughly how many full games per month at launch and in year one, from what sources (phone, camcorder, Hudl/other exports), at what quality, and how long must film be kept?
6. **Video review & analysis:** in the first release, do coaches only *watch* film, or also bookmark, annotate and clip it? Is any *automated* analysis (player tracking, stats, auto-highlights) expected, and if so, when?
7. **Search & filters:** which fields must coaches filter and sort by (position, height, grad year, location/radius, stats, GPA/eligibility, team, availability)? Where do stats come from, if anywhere?
8. **Recruiting workflow:** can you share the workflows you've mapped? Do coaches work alone or as staffs sharing lists and notes? Are there pipeline stages (for example Identified → Evaluating → Contacted → Offered → Committed)?
9. **Communication & notifications:** should coaches and athletes message each other in-platform? Which events should trigger emails or in-app alerts? Are there any contact-rule/compliance constraints you expect the platform to enforce?
10. **MVP vs. later & business model:** which features must be in the first launch and which can wait? Is the platform free, subscription-based (for coaches, athletes or both), or paid per upload, and do payments need to be in the MVP? Is there a target launch date or budget range, and are native mobile apps required?

---

## 14. Suggested reply structure to the buyer

1. A short restatement of what they want (§1), which shows we understood them.
2. A confident "yes, this is buildable", plus the one-paragraph architecture (modular platform + managed video pipeline + AI-ready event model).
3. Relevant past projects: video, document management, RBAC, complex workflows. **Use real projects only.**
4. The phased approach and a **paid Discovery milestone** that ends with a fixed quote.
5. Indicative ranges only (the MVP band), explicitly conditional on discovery.
6. Availability.
7. The top 4–5 questions from §13, with the rest saved for the discovery call. Ask for the mapped workflows first.
