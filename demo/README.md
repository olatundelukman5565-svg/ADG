# ADGP clickable demo

A front-end prototype for reviewing ADGP workflows with the client before the production build. It uses fictional sample data and has no backend: changes are saved in the browser's localStorage.

## Run it

```bash
cd demo
npm install
npm run dev        # http://localhost:5173
npm run build      # static files in demo/dist, deployable to any static host
```

## What's in it

| Role | Screens |
|---|---|
| Coach / recruiter | Dashboard, player search with filters, athlete profiles, private notes, shortlists (table + pipeline board), full-game film review with bookmarks, clips, speed control, keyboard shortcuts and a "follow player" highlight |
| Athlete | Profile editor, film upload (simulated upload → processing → ready pipeline, with a local preview of the chosen file), documents and eligibility with versioning |
| Admin | Document verification queue (verify/reject with reason), coach verification, audit log |

Use the **Demo: view as** switcher in the sidebar to change roles. Each screen checks a permission (`src/permissions.ts`) rather than a role name, the same model planned for production.

## Deliberately simulated

- **Game film** is drawn on a canvas (`src/components/CourtFilm.tsx`). Production streams uploaded video over HLS through signed links.
- **Uploads** never leave the browser. Production uses resumable direct-to-storage uploads and a managed transcoding service.
- **Login** is a role switcher. Production has real authentication and permission checks on the server.

Bookmarks and clips are stored as time-coded "video events" (`VideoEvent` in `src/store.tsx`). Future AI-detected events will use the same shape.
