import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { athleteById, fmtHeight, gamesForAthlete } from '../data/mock'
import { useDocuments, useStore } from '../store'
import { can } from '../permissions'
import { Avatar, Button, Card, DocBadge, EligibilityBadge, NoAccess, inputCls } from '../components/ui'
import ShortlistMenu from '../components/ShortlistMenu'

export default function AthleteProfile() {
  const { id = '' } = useParams()
  const store = useStore()
  const [note, setNote] = useState('')
  const allDocs = useDocuments()
  const a = id === store.myAthleteId ? store.profile : athleteById(id)
  if (!can(store.role, 'athlete.view')) return <NoAccess what="view athlete profiles" />
  if (!a || (!a.published && store.role === 'coach')) return <Card>Profile not found or not published.</Card>

  const docs = allDocs.filter((d) => d.athleteId === a.id)
  const games = gamesForAthlete(a.id)
  const notes = store.notes[a.id] ?? []
  const isCoach = store.role === 'coach'

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-5">
        <Avatar name={`${a.firstName} ${a.lastName}`} size={84} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{a.firstName} {a.lastName}</h1>
            <EligibilityBadge status={a.eligibility} />
          </div>
          <div className="mt-1 text-slate-600">{a.position} · {fmtHeight(a.heightIn)} · {a.weightLb} lb · Class of {a.gradYear}</div>
          <div className="text-sm text-slate-500">{a.highSchool} · {a.club} · {a.city}, {a.state}</div>
        </div>
        <ShortlistMenu athleteId={a.id} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="font-bold">Season stats</h2>
            <div className="mt-3 grid grid-cols-4 gap-3 text-center">
              {[['PPG', a.ppg], ['RPG', a.rpg], ['APG', a.apg], ['GPA', a.gpa.toFixed(2)]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-slate-50 p-3"><div className="text-2xl font-extrabold">{v}</div><div className="text-xs uppercase text-slate-500">{l}</div></div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-600">{a.bio}</p>
          </Card>
          <Card>
            <h2 className="font-bold">Game film ({games.length})</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {games.map((g) => {
                const p = g.athleteIds.find((x) => x.athleteId === a.id)!
                return (
                  <Link key={g.id} to={`/games/${g.id}?focus=${a.id}`} className="group overflow-hidden rounded-lg ring-1 ring-slate-200 hover:ring-brand">
                    <div className="flex h-28 items-center justify-center bg-gradient-to-br from-[#1d3a5f] to-ink text-white">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-sm group-hover:bg-brand">▶ Full game · 32:00</span>
                    </div>
                    <div className="p-3 text-sm"><div className="font-semibold">{g.home} vs {g.away}</div><div className="text-slate-500">{g.event} · {g.date} · #{p.jersey}</div></div>
                  </Link>
                )
              })}
              {!games.length && <p className="text-sm text-slate-500">No film uploaded yet.</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-bold">Eligibility & documents</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <span>{d.category}</span><DocBadge status={d.status} />
                </li>
              ))}
              {!docs.length && <li className="text-slate-500">No documents submitted.</li>}
            </ul>
            {isCoach && <p className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500">🔒 Coaches see verification status. The document files stay private unless the athlete grants access.</p>}
          </Card>
          {isCoach && (
            <Card>
              <h2 className="font-bold">Private notes</h2>
              <p className="text-xs text-slate-500">Visible only to you.</p>
              <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) { store.addNote(a.id, note.trim()); setNote('') } }}>
                <textarea className={inputCls} rows={3} placeholder="Add an evaluation note…" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button type="submit" disabled={!note.trim()}>Save note</Button>
              </form>
              <ul className="mt-4 space-y-3">
                {notes.map((n) => <li key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm"><div>{n.text}</div><div className="mt-1 text-xs text-slate-400">{new Date(n.at).toLocaleString()}</div></li>)}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
