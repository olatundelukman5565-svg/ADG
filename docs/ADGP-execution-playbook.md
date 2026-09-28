# ADGP: Execution Playbook (how we build it, step by step)

**Who does what:**

- **Claude:** writes the specs, code, tests and docs, and runs the checks.
- **You (project owner):** the client relationship, product decisions, accounts and billing, code review approval, real-device testing, production release approval.
- **Alfonso (client):** answers questions, approves each milestone, pays per milestone.

---

## How every piece of work runs (the standard loop)

We use this same loop for every feature in every phase:

1. **You open a session and give the task.** For example: "Start M2: athlete profiles."
2. **I read the spec and the existing code, then post a short plan.** You say "go" or correct it.
3. **I build it on a feature branch**, one milestone per branch: code, database migrations, tests.
4. **I run the checks myself:** lint, type-check, automated tests and a build. I only push when all of them pass.
5. **I open a pull request (PR)** with a summary, screenshots or test results, and "how to test" steps.
6. **You review the PR.** Check the staging URL and click through the "how to test" steps. Leave comments; I fix them.
7. **You merge.** The code auto-deploys to **staging**.
8. **You demo it to Alfonso on staging.** He checks it against the milestone's acceptance criteria.
9. **He approves → milestone paid → next milestone.** Any change he asks for that is outside the milestone becomes a **change request** with its own price.

**Rule:** nothing reaches production without your approval.

---

## Before anything starts: setup (one-time)

| Step | Who | What |
|---|---|---|
| 1 | You | Accept Alfonso's order for **Milestone 0 (Discovery)** only, as a paid, fixed price. |
| 2 | You | Get his **mapped workflows** (documents, diagrams, screenshots, anything). |
| 3 | You | Create accounts, or ask him to create them and add you. See the list below. |
| 4 | You | Put secrets (API keys) into the environment settings. Never paste them into chat or code. |
| 5 | Claude | Set up the repository structure, coding standards, CI pipeline and `CLAUDE.md` project guide. |

**Accounts needed.** Ideally they are in the *client's* name, so he owns them and pays the bills:

- GitHub repository (this one, or his).
- Hosting: Vercel (frontend) + Render, Railway or AWS (backend + database). Keep it simple at first.
- AWS S3, or Cloudflare R2, for documents and original video files.
- Mux or Cloudflare Stream for video (decided in M0).
- Postmark or AWS SES for email.
- Domain name.
- Later: Sentry (error tracking).

---

## Phase 0: Discovery & Specification (Milestone M0, ~2 weeks)

**Goal:** turn "an idea" into a document precise enough to give a fixed price.

| Step | Claude | You |
|---|---|---|
| 0.1 | Read his workflows. Produce a list of gaps and questions. | Send the questions to Alfonso; paste his answers back to me. |
| 0.2 | Write the **Product Spec**: roles, a permission matrix (who can see and do what), user stories with acceptance criteria. | Review it; confirm with Alfonso. |
| 0.3 | Write the **Screen list + wireframes** (simple clickable HTML mockups). | Show them to Alfonso; collect feedback. |
| 0.4 | Write the **Data model** (all tables and relationships) and the **Architecture doc**. | Skim it; ask questions. |
| 0.5 | Produce a **Video cost model**: expected games per month × storage × viewing hours, comparing Mux, Cloudflare and AWS. | Confirm the volume numbers with Alfonso; he picks the provider. |
| 0.6 | Write the **MVP boundary + milestone plan with fixed prices** (M1–M10). | Send it to Alfonso; negotiate; he signs. |

**M0 deliverables:** spec, wireframes, data model, architecture doc, cost model, fixed quote.

---

## Phase 1: Core Platform (M1, M2, M3, M6, M7, M8)

### M1: Foundation (~3–4 weeks)

1. I create the project: a Next.js frontend and a NestJS backend, both in TypeScript, plus the PostgreSQL database.
2. I set up CI: every PR automatically runs lint, tests and build.
3. I build authentication: register, login, email verification, password reset, and MFA for admins.
4. I build the **permission engine**: roles → permissions, deny by default, plus a test for each rule.
5. I build the audit log and the base UI layout and design components.
6. **You:** connect hosting, and I give you the exact settings to paste. Then check that staging is live.
7. **Demo:** each role logs in and sees only its own area.

### M2: Athlete Profiles (~2–3 weeks)

1. Database tables for athletes and profiles, following the M0 spec.
2. Profile creation and editing screens, photo upload, visibility settings (public or coach-only).
3. The coach's view of a profile.
4. Tests: an unpublished profile is invisible to coaches.
5. **Demo:** an athlete builds a profile and a coach views it.

### M3: Documents & Eligibility (~3–4 weeks)

1. Private file storage, secure short-lived download links, virus scanning, file-type and size limits.
2. Document categories and versioning; the athlete grants a coach access.
3. Eligibility records with statuses, expiry dates, and an admin verify/reject queue with reasons.
4. Scheduled job for expiry reminders.
5. Security tests: a user without access cannot download a document, even with a guessed link.
6. **Demo:** upload a transcript → admin verifies it → status shows on the profile.

### M6: Search & Discovery (~2–3 weeks)

1. Database indexes and filters from the spec (position, graduation year, height, location, and so on).
2. Search page with filters, sorting and pagination.
3. Seed about 50,000 fake athletes and measure speed (target under 1 second).
4. **Demo:** a coach filters and finds players.

### M7: Coach Workspace & Shortlists (~2–3 weeks)

1. Create and rename multiple shortlists; add and remove athletes.
2. Statuses and private notes per athlete (plus sharing, tags and pipeline if confirmed in M0).
3. A dashboard showing recent lists and recently viewed players.
4. **Demo:** a coach runs a full "search → shortlist → note" flow.

### M8: Admin Console (~2–3 weeks)

User management and coach verification, moderation, the document queue, reference data (positions, schools), an audit log viewer and basic metrics.

---

## Phase 2: Video Platform (M4, M5)

This is done in parallel with or right after M2, because film review is a core feature.

### M4: Video Upload & Processing (~3–4 weeks)

1. **Resumable direct upload:** the browser sends the file straight to storage in chunks, and it resumes if the connection drops.
2. The original file is kept in our S3 (important for future AI).
3. Send the file to Mux or Cloudflare to create streaming versions (1080p/720p/480p).
4. A webhook updates the status: uploading → processing → ready or failed, with retry.
5. Upload screen with a progress bar and status list.
6. **You test with a real 2-hour game file**, including closing the laptop midway to check that it resumes. I can't do this physical test myself.
7. **Demo:** upload a full game; it becomes playable.

### M5: Games & Film Review (~3–4 weeks)

1. Game pages: date, teams, event.
2. Link athletes to games with jersey numbers.
3. A video player with adaptive quality, signed links (no public URLs), speed control and keyboard shortcuts.
4. Time-stamped bookmarks, notes and clips. These are stored as "video events", which AI will reuse later.
5. **Demo:** a coach opens a player → watches their game → bookmarks moments → adds them to a shortlist.

---

## Launch: Hardening (M9 notifications if confirmed, M10 launch; ~3–4 weeks)

1. Email notifications for the agreed events.
2. A full security review of the code (I run it), then fixes.
3. Load tests on search and video; backups plus a restore rehearsal; error monitoring and alerts.
4. Privacy policy and terms pages. **The text must come from a lawyer.**
5. **You:** have 3–5 real users test on real phones and laptops for a week.
6. **You approve → I run the production deployment steps with you → launch.**
7. Handover: a runbook (how to deploy, restore, add an admin) and documentation.

**End of Phase 1 + 2 = a launchable MVP.**

---

## Phase 3: Advanced Recruiting Tools (after launch, each item priced separately)

The loop is the same: a mini-spec for the item, then build, PR, staging demo, approval.

Candidate items:

- Recruiting pipeline board
- Shared staff lists
- Tags
- In-app messaging
- In-app notifications
- Dedicated search engine (Typesense or OpenSearch)
- Subscriptions and payments (Stripe)
- Analytics

---

## Phase 4: AI / Video Analysis (only after a feasibility test)

1. **Spike (3–6 weeks, fixed price):** using 10–20 of Alfonso's real games, I write prototype code that runs existing open-source detection and tracking models (player and ball detection). We measure accuracy, cost per game and speed.
2. **Decision point:** go or no-go with real numbers. If go, **bring in an ML/computer-vision specialist.** I can write the pipeline and platform integration, but training production-quality models needs GPUs, labeled data and specialist tuning.
3. **Integration:** AI results appear as "video events" in the same player UI built in M5. No rewrite is needed.

---

## What I need from you each time

- **Clear go/no-go on plans** before I build.
- **PR review within 1–2 days** so work doesn't stall.
- **Alfonso's answers** relayed promptly.
- **Real-world testing** (devices, big files, real users).
- **Credentials** placed in environment settings, never in chat.

## Timeline summary (MVP)

| Weeks | Work |
|---|---|
| 1–2 | M0 Discovery |
| 3–6 | M1 Foundation |
| 7–9 | M2 Profiles |
| 8–11 | M4 Video upload (overlaps) |
| 10–13 | M3 Documents & eligibility |
| 12–15 | M5 Film review |
| 14–16 | M6 Search |
| 16–18 | M7 Shortlists |
| 18–20 | M8 Admin |
| 20–23 | M9 + M10 Hardening & launch |

**About 5–6 months to MVP launch**, depending mostly on how fast reviews and client answers come back.
