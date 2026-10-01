import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { athletes as seedAthletes, documents as seedDocs, coaches as seedCoaches, type Athlete, type DocStatus, type DocumentRecord, DEMO_TODAY } from './data/mock'

// Local preview URLs for files picked in this browser session. Not persisted.
export const localVideoUrls = new Map<string, string>()

export type Role = 'coach' | 'athlete' | 'admin'
export const RECRUIT_STATUSES = ['Identified', 'Evaluating', 'Contacted', 'Visit', 'Offered', 'Committed'] as const
export type RecruitStatus = (typeof RECRUIT_STATUSES)[number]

export interface ShortlistEntry { athleteId: string; status: RecruitStatus; addedAt: string }
export interface Shortlist { id: string; name: string; entries: ShortlistEntry[] }
export interface Note { id: string; text: string; at: string }
// A time-coded event on a game video. Coach bookmarks and clips today; AI-detected events later use the same shape.
export interface VideoEvent { id: string; startSec: number; endSec?: number; label: string; kind: 'bookmark' | 'clip'; source: 'coach' | 'model' }
export interface Upload { id: string; fileName: string; sizeMb: number; status: 'uploading' | 'processing' | 'ready'; progress: number; gameLabel: string }

interface State {
  role: Role
  myAthleteId: string
  profile: Athlete
  shortlists: Shortlist[]
  notes: Record<string, Note[]>
  videoEvents: Record<string, VideoEvent[]>
  docStatus: Record<string, { status: DocStatus; reason?: string }>
  coachVerified: Record<string, boolean>
  uploads: Upload[]
  extraDocs: DocumentRecord[]
  audit: { at: string; who: string; action: string }[]
}

const KEY = 'adgp-demo-v1'
const now = () => new Date().toISOString()
const uid = () => Math.random().toString(36).slice(2, 9)

function initial(): State {
  return {
    role: 'coach',
    myAthleteId: 'a1',
    profile: { ...seedAthletes[0] },
    shortlists: [
      { id: 'sl1', name: '2027 Guards', entries: [
        { athleteId: 'a1', status: 'Evaluating', addedAt: '2026-09-12' },
        { athleteId: 'a6', status: 'Contacted', addedAt: '2026-09-14' },
        { athleteId: 'a11', status: 'Identified', addedAt: '2026-09-20' },
      ] },
      { id: 'sl2', name: 'Bigs to watch', entries: [
        { athleteId: 'a5', status: 'Identified', addedAt: '2026-09-18' },
        { athleteId: 'a10', status: 'Visit', addedAt: '2026-09-02' },
      ] },
    ],
    notes: { a1: [{ id: 'n1', text: 'Great pace in transition. Check left-hand finishing.', at: '2026-09-12T15:00:00Z' }] },
    videoEvents: { g1: [
      { id: 'v1', startSec: 95, label: 'Pull-up three off the screen', kind: 'bookmark', source: 'coach' },
      { id: 'v2', startSec: 410, endSec: 436, label: 'Full-court press break', kind: 'clip', source: 'coach' },
    ] },
    docStatus: Object.fromEntries(seedDocs.map((d) => [d.id, { status: d.status }])),
    coachVerified: Object.fromEntries(seedCoaches.map((c) => [c.id, c.verified])),
    uploads: [],
    extraDocs: [],
    audit: [],
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial(), ...JSON.parse(raw) }
  } catch { /* storage unavailable: fall back to seed data */ }
  return initial()
}

function useStoreValue() {
  const [s, setS] = useState<State>(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
  }, [s])

  // Simulates the real pipeline: resumable upload, then provider transcoding, then ready.
  const uploading = s.uploads.some((u) => u.status !== 'ready')
  useEffect(() => {
    if (!uploading) return
    const t = setInterval(() => setS((p) => ({
      ...p,
      uploads: p.uploads.map((u) => {
        if (u.status === 'uploading') {
          const progress = Math.min(100, u.progress + Math.max(2, 400 / Math.max(u.sizeMb, 50)))
          return progress >= 100 ? { ...u, progress: 0, status: 'processing' as const } : { ...u, progress }
        }
        if (u.status === 'processing') {
          const progress = Math.min(100, u.progress + 5)
          return progress >= 100 ? { ...u, progress: 100, status: 'ready' as const } : { ...u, progress }
        }
        return u
      }),
    })), 300)
    return () => clearInterval(t)
  }, [uploading])

  const who = () => (s.role === 'coach' ? 'Coach Dana Whitfield' : s.role === 'admin' ? 'Admin' : `${s.profile.firstName} ${s.profile.lastName}`)
  const update = (fn: (prev: State) => State, action?: string) =>
    setS((prev) => {
      const next = fn(prev)
      return action ? { ...next, audit: [{ at: now(), who: who(), action }, ...next.audit].slice(0, 200) } : next
    })

  return {
    ...s,
    setRole: (role: Role) => update((p) => ({ ...p, role })),
    reset: () => setS(initial()),
    saveProfile: (profile: Athlete) => update((p) => ({ ...p, profile }), 'Updated athlete profile'),

    createShortlist: (name: string) => update((p) => ({ ...p, shortlists: [...p.shortlists, { id: uid(), name, entries: [] }] }), `Created shortlist "${name}"`),
    deleteShortlist: (id: string) => update((p) => ({ ...p, shortlists: p.shortlists.filter((l) => l.id !== id) }), 'Deleted a shortlist'),
    toggleOnList: (listId: string, athleteId: string) => update((p) => ({
      ...p,
      shortlists: p.shortlists.map((l) => l.id !== listId ? l : l.entries.some((e) => e.athleteId === athleteId)
        ? { ...l, entries: l.entries.filter((e) => e.athleteId !== athleteId) }
        : { ...l, entries: [...l.entries, { athleteId, status: 'Identified', addedAt: now().slice(0, 10) }] }),
    }), 'Changed shortlist membership'),
    setStatus: (listId: string, athleteId: string, status: RecruitStatus) => update((p) => ({
      ...p,
      shortlists: p.shortlists.map((l) => l.id !== listId ? l : { ...l, entries: l.entries.map((e) => e.athleteId === athleteId ? { ...e, status } : e) }),
    })),

    addNote: (athleteId: string, text: string) => update((p) => ({ ...p, notes: { ...p.notes, [athleteId]: [{ id: uid(), text, at: now() }, ...(p.notes[athleteId] ?? [])] } })),

    addVideoEvent: (gameId: string, ev: Omit<VideoEvent, 'id' | 'source'>) =>
      update((p) => ({ ...p, videoEvents: { ...p.videoEvents, [gameId]: [...(p.videoEvents[gameId] ?? []), { ...ev, id: uid(), source: 'coach' as const }].sort((a, b) => a.startSec - b.startSec) } })),
    removeVideoEvent: (gameId: string, id: string) =>
      update((p) => ({ ...p, videoEvents: { ...p.videoEvents, [gameId]: (p.videoEvents[gameId] ?? []).filter((e) => e.id !== id) } })),

    setDocStatus: (docId: string, status: DocStatus, reason?: string) =>
      update((p) => ({ ...p, docStatus: { ...p.docStatus, [docId]: { status, reason } } }), `Document ${docId} marked ${status}`),
    addDocument: (doc: Omit<DocumentRecord, 'id' | 'status' | 'version' | 'uploadedAt'>) => {
      const id = `x${uid()}`
      update((p) => {
        const version = 1 + [...seedDocs, ...p.extraDocs].filter((d) => d.athleteId === doc.athleteId && d.category === doc.category).length
        return {
          ...p,
          extraDocs: [...p.extraDocs, { ...doc, id, status: 'pending', version, uploadedAt: now().slice(0, 10) }],
          docStatus: { ...p.docStatus, [id]: { status: 'pending' } },
        }
      }, `Uploaded ${doc.category}: ${doc.fileName}`)
    },
    setCoachVerified: (coachId: string, v: boolean) =>
      update((p) => ({ ...p, coachVerified: { ...p.coachVerified, [coachId]: v } }), `Coach ${coachId} ${v ? 'verified' : 'unverified'}`),

    startUpload: (fileName: string, sizeMb: number, gameLabel: string) => {
      const id = uid()
      update((p) => ({ ...p, uploads: [{ id, fileName, sizeMb, gameLabel, status: 'uploading', progress: 0 }, ...p.uploads] }), `Started upload ${fileName}`)
      return id
    },
  }
}

/** Athletes, with the signed-in demo athlete's edits applied. */
export function useAthletes() {
  const { profile, myAthleteId } = useStore()
  return seedAthletes.map((a) => (a.id === myAthleteId ? profile : a))
}

/** All documents (seed + uploaded in this demo) with their current review status. */
export function useDocuments() {
  const { extraDocs, docStatus } = useStore()
  return [...seedDocs, ...extraDocs].map((d) => {
    const status = docStatus[d.id]?.status ?? d.status
    const expired = status === 'verified' && d.expiresAt != null && d.expiresAt < DEMO_TODAY
    return { ...d, status: expired ? ('expired' as const) : status, reason: docStatus[d.id]?.reason }
  })
}

type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside provider')
  return v
}
