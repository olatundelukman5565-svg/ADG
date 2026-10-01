import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { athleteById, fmtTime, gameById } from '../data/mock'
import { useStore } from '../store'
import { can } from '../permissions'
import { Badge, Button, Card, NoAccess, inputCls } from '../components/ui'
import CourtFilm, { type FilmPlayer } from '../components/CourtFilm'

const RATES = [0.5, 1, 2, 4]

export default function GameFilm() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const store = useStore()
  const game = gameById(id)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [stopAt, setStopAt] = useState<number | null>(null)
  const [focus, setFocus] = useState(params.get('focus') ?? '')
  const [label, setLabel] = useState('')
  const [clipStart, setClipStart] = useState<number | null>(null)
  const last = useRef<number | null>(null)
  const duration = game?.durationSec ?? 0

  // Playback clock
  const tRef = useRef(0)
  tRef.current = t
  useEffect(() => {
    if (!playing) { last.current = null; return }
    let raf = 0
    const step = (now: number) => {
      const dt = last.current == null ? 0 : (now - last.current) / 1000
      last.current = now
      const next = Math.min(duration, tRef.current + dt * rate)
      const end = stopAt ?? duration
      if (next >= end) {
        tRef.current = end
        setT(end); setPlaying(false); setStopAt(null)
        return
      }
      tRef.current = next
      setT(next)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playing, rate, stopAt, duration])

  const seek = (v: number) => setT(Math.max(0, Math.min(duration, v)))

  // Keyboard shortcuts coaches expect from film tools
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) }
      if (e.key === 'ArrowLeft') seek(t - 5)
      if (e.key === 'ArrowRight') seek(t + 5)
      if (e.key.toLowerCase() === 'b') addBookmark()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const players: FilmPlayer[] = useMemo(() => {
    if (!game) return []
    return (['home', 'away'] as const).flatMap((side) => {
      const real = game.athleteIds.filter((p) => p.side === side).slice(0, 5).map((p) => {
        const a = athleteById(p.athleteId)!
        return { jersey: p.jersey, side, name: `${a.firstName} ${a.lastName}`, focus: p.athleteId === focus }
      })
      const fill = Array.from({ length: 5 - real.length }, (_, i) => ({ jersey: 40 + i + (side === 'away' ? 5 : 0), side }))
      return [...real, ...fill]
    })
  }, [game, focus])

  if (!can(store.role, 'film.review') && !can(store.role, 'film.upload')) return <NoAccess what="watch game film" />
  if (!game) return <Card>Game not found.</Card>

  const events = store.videoEvents[game.id] ?? []
  function addBookmark() {
    store.addVideoEvent(game!.id, { startSec: Math.floor(t), label: label.trim() || `Bookmark at ${fmtTime(t)}`, kind: 'bookmark' })
    setLabel('')
  }
  function saveClip() {
    if (clipStart == null) return
    const [a, b] = [clipStart, t].sort((x, y) => x - y)
    if (b - a < 1) return
    store.addVideoEvent(game!.id, { startSec: Math.floor(a), endSec: Math.ceil(b), label: label.trim() || `Clip ${fmtTime(a)}–${fmtTime(b)}`, kind: 'clip' })
    setClipStart(null); setLabel('')
  }
  const canAnnotate = store.role === 'coach'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-sm text-slate-500">{game.event} · {game.date}</div>
          <h1 className="text-2xl font-bold">{game.home} <span className="text-slate-400">vs</span> {game.away}</h1>
        </div>
        <Badge tone="blue">Full game · {fmtTime(duration)}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl bg-ink p-2">
            <CourtFilm t={t} players={players} homeName={game.home} awayName={game.away} />
            <div className="px-1 pt-2 text-[11px] text-slate-400">Simulated footage for the demo. The real platform streams the uploaded game video here (adaptive HLS through a secure, signed link).</div>
          </div>
          <Card className="space-y-3 p-4">
            {/* Timeline with event markers */}
            <div className="relative h-8">
              <input type="range" min={0} max={duration} step={0.1} value={t} onChange={(e) => seek(+e.target.value)} className="absolute inset-x-0 top-3 w-full accent-[#f26b1d]" aria-label="Seek" />
              {events.map((ev) => (
                <button key={ev.id} title={ev.label} onClick={() => seek(ev.startSec)}
                  className={`absolute top-0 h-2.5 -translate-x-1/2 rounded-sm ${ev.kind === 'clip' ? 'bg-sky-500' : 'bg-brand'}`}
                  style={{ left: `${(ev.startSec / duration) * 100}%`, width: ev.endSec ? `${Math.max(0.6, ((ev.endSec - ev.startSec) / duration) * 100)}%` : 6 }} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => seek(t - 10)}>⟲ 10s</Button>
              <Button onClick={() => setPlaying((p) => !p)} className="w-24">{playing ? '❚❚ Pause' : '▶ Play'}</Button>
              <Button variant="secondary" onClick={() => seek(t + 10)}>10s ⟳</Button>
              <span className="ml-1 font-mono text-sm tabular-nums">{fmtTime(t)} / {fmtTime(duration)}</span>
              <div className="ml-auto flex rounded-lg bg-slate-100 p-0.5">
                {RATES.map((r) => (
                  <button key={r} onClick={() => setRate(r)} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${rate === r ? 'bg-white shadow' : 'text-slate-500'}`}>{r}×</button>
                ))}
              </div>
            </div>
            <div className="text-xs text-slate-400">Shortcuts: Space play/pause · ← → jump 5s · B bookmark</div>
          </Card>

          {canAnnotate && (
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <input className={`${inputCls} min-w-[180px] flex-1`} placeholder="Label (e.g. Help-side block)" value={label} onChange={(e) => setLabel(e.target.value)} />
                <Button onClick={addBookmark}>🔖 Bookmark {fmtTime(t)}</Button>
                {clipStart == null
                  ? <Button variant="secondary" onClick={() => setClipStart(t)}>✂ Start clip</Button>
                  : <Button variant="secondary" onClick={saveClip}>✂ End clip ({fmtTime(clipStart)} → {fmtTime(t)})</Button>}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-bold">Bookmarks & clips</h2>
            <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto">
              {events.map((ev) => (
                <li key={ev.id} className="group flex items-start gap-2 rounded-md p-1.5 text-sm hover:bg-slate-50">
                  <button className="flex-1 text-left" onClick={() => { seek(ev.startSec); if (ev.endSec) { setStopAt(ev.endSec); setPlaying(true) } }}>
                    <span className={`mr-1.5 font-mono text-xs ${ev.kind === 'clip' ? 'text-sky-600' : 'text-brand'}`}>{fmtTime(ev.startSec)}{ev.endSec ? `–${fmtTime(ev.endSec)}` : ''}</span>
                    {ev.label}
                  </button>
                  {canAnnotate && <button onClick={() => store.removeVideoEvent(game.id, ev.id)} className="text-slate-300 opacity-0 hover:text-rose-600 group-hover:opacity-100">✕</button>}
                </li>
              ))}
              {!events.length && <li className="text-sm text-slate-500">No bookmarks yet.</li>}
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="font-bold">Players in this game</h2>
            <p className="text-xs text-slate-500">Click Follow to highlight a player on the court.</p>
            <ul className="mt-2 space-y-1">
              {game.athleteIds.map((p) => {
                const a = athleteById(p.athleteId)!
                return (
                  <li key={p.athleteId} className="flex items-center gap-2 text-sm">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${p.side === 'home' ? 'bg-brand' : 'bg-[#2f7de1]'}`}>{p.jersey}</span>
                    <Link to={`/athletes/${a.id}`} className="flex-1 hover:text-brand">{a.firstName} {a.lastName}</Link>
                    <button onClick={() => setFocus(focus === a.id ? '' : a.id)} className={`text-xs font-semibold ${focus === a.id ? 'text-brand' : 'text-slate-400 hover:text-ink'}`}>{focus === a.id ? 'Following' : 'Follow'}</button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
