import { Link } from 'react-router-dom'
import { fmtHeight, type Athlete } from '../data/mock'
import { Avatar, EligibilityBadge } from './ui'
import ShortlistMenu from './ShortlistMenu'

export default function AthleteRow({ a }: { a: Athlete }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 flex-1 basis-64 items-center gap-4">
      <Avatar name={`${a.firstName} ${a.lastName}`} size={48} />
      <div className="min-w-0 flex-1">
        <Link to={`/athletes/${a.id}`} className="font-bold text-ink hover:text-brand">{a.firstName} {a.lastName}</Link>
        <div className="text-sm text-slate-500">{a.position} · {fmtHeight(a.heightIn)} · Class of {a.gradYear} · {a.city}, {a.state}</div>
        <div className="mt-1 text-xs text-slate-500">{a.highSchool} · {a.club}</div>
      </div>
      </div>
      <div className="hidden gap-4 text-center text-sm sm:flex">
        <Stat label="PPG" v={a.ppg} /><Stat label="RPG" v={a.rpg} /><Stat label="APG" v={a.apg} /><Stat label="GPA" v={a.gpa.toFixed(2)} />
      </div>
      <div className="flex items-center gap-2">
        <EligibilityBadge status={a.eligibility} />
        <ShortlistMenu athleteId={a.id} />
      </div>
    </div>
  )
}

function Stat({ label, v }: { label: string; v: number | string }) {
  return <div><div className="font-bold text-ink">{v}</div><div className="text-[11px] uppercase text-slate-400">{label}</div></div>
}
