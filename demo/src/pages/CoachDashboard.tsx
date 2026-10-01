import { Link } from 'react-router-dom'
import { athleteById, games } from '../data/mock'
import { useStore } from '../store'
import { can } from '../permissions'
import { Avatar, Badge, Card, NoAccess, PageHeader } from '../components/ui'

export default function CoachDashboard() {
  const { role, shortlists, videoEvents } = useStore()
  if (!can(role, 'shortlist.manage')) return <NoAccess what="open the coach workspace" />
  const tracked = new Set(shortlists.flatMap((l) => l.entries.map((e) => e.athleteId))).size
  const marks = Object.values(videoEvents).flat().length
  const recent = shortlists.flatMap((l) => l.entries.map((e) => ({ ...e, list: l.name }))).sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 5)

  return (
    <>
      <PageHeader title="Welcome back, Coach Whitfield" subtitle="Lakeshore State University · Recruiting workspace"
        actions={<Link to="/search" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Find players</Link>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Shortlists" value={shortlists.length} />
        <Kpi label="Players tracked" value={tracked} />
        <Kpi label="Film bookmarks & clips" value={marks} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold">Recently shortlisted</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {recent.map((e) => {
              const a = athleteById(e.athleteId)!
              return (
                <Link key={e.list + e.athleteId} to={`/athletes/${a.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50">
                  <Avatar name={`${a.firstName} ${a.lastName}`} size={34} />
                  <div className="flex-1 text-sm"><div className="font-semibold">{a.firstName} {a.lastName}</div><div className="text-slate-500">{a.position} · {e.list}</div></div>
                  <Badge tone="orange">{e.status}</Badge>
                </Link>
              )
            })}
            {!recent.length && <p className="py-3 text-sm text-slate-500">No players shortlisted yet.</p>}
          </div>
        </Card>
        <Card>
          <h2 className="font-bold">Latest game film</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {games.slice(0, 5).map((g) => (
              <Link key={g.id} to={`/games/${g.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50">
                <div className="flex h-10 w-16 items-center justify-center rounded bg-ink text-xs text-white">▶ 32:00</div>
                <div className="flex-1 text-sm"><div className="font-semibold">{g.home} vs {g.away}</div><div className="text-slate-500">{g.event} · {g.date}</div></div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

function Kpi({ label, value }: { label: string; value: number }) {
  return <Card><div className="text-3xl font-extrabold text-ink">{value}</div><div className="text-sm text-slate-500">{label}</div></Card>
}
