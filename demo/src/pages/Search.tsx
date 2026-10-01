import { useMemo, useState } from 'react'
import { athletes, fmtHeight, type EligibilityStatus, type Position } from '../data/mock'
import { useAthletes, useStore } from '../store'
import { can } from '../permissions'
import { Card, NoAccess, PageHeader, inputCls } from '../components/ui'
import AthleteRow from '../components/AthleteRow'

const POS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']
const STATES = [...new Set(athletes.map((a) => a.state))].sort()

export default function Search() {
  const { role } = useStore()
  const all = useAthletes()
  const [q, setQ] = useState('')
  const [pos, setPos] = useState<Position[]>([])
  const [year, setYear] = useState('')
  const [state, setState] = useState('')
  const [minH, setMinH] = useState(68)
  const [minGpa, setMinGpa] = useState(0)
  const [elig, setElig] = useState<'' | EligibilityStatus>('')
  const [sort, setSort] = useState<'ppg' | 'height' | 'gpa' | 'name'>('ppg')

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    return all
      .filter((a) => a.published) // coaches never see unpublished profiles
      .filter((a) => !term || `${a.firstName} ${a.lastName} ${a.highSchool} ${a.club} ${a.city}`.toLowerCase().includes(term))
      .filter((a) => !pos.length || pos.includes(a.position))
      .filter((a) => !year || a.gradYear === Number(year))
      .filter((a) => !state || a.state === state)
      .filter((a) => a.heightIn >= minH)
      .filter((a) => a.gpa >= minGpa)
      .filter((a) => !elig || a.eligibility === elig)
      .sort((a, b) => sort === 'name' ? a.lastName.localeCompare(b.lastName) : sort === 'height' ? b.heightIn - a.heightIn : sort === 'gpa' ? b.gpa - a.gpa : b.ppg - a.ppg)
  }, [all, q, pos, year, state, minH, minGpa, elig, sort])

  if (!can(role, 'athlete.search')) return <NoAccess what="search athletes" />

  const clear = () => { setQ(''); setPos([]); setYear(''); setState(''); setMinH(68); setMinGpa(0); setElig('') }

  return (
    <>
      <PageHeader title="Find players" subtitle="Filter published athlete profiles. Filter fields will follow the final agreed spec." />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit space-y-4 lg:sticky lg:top-6">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Name, school or club</label>
            <input className={`${inputCls} mt-1`} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500">Position</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {POS.map((p) => (
                <button key={p} onClick={() => setPos((s) => s.includes(p) ? s.filter((x) => x !== p) : [...s, p])}
                  className={`rounded-md px-2.5 py-1 text-sm font-semibold ring-1 ${pos.includes(p) ? 'bg-brand text-white ring-brand' : 'bg-white ring-slate-300'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Class</label>
              <select className={`${inputCls} mt-1`} value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Any</option>{[2027, 2028, 2029].map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">State</label>
              <select className={`${inputCls} mt-1`} value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Any</option>{STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Min height: {fmtHeight(minH)}</label>
            <input type="range" min={68} max={84} value={minH} onChange={(e) => setMinH(+e.target.value)} className="mt-1 w-full accent-[#f26b1d]" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Min GPA: {minGpa.toFixed(1)}</label>
            <input type="range" min={0} max={4} step={0.1} value={minGpa} onChange={(e) => setMinGpa(+e.target.value)} className="mt-1 w-full accent-[#f26b1d]" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Eligibility</label>
            <select className={`${inputCls} mt-1`} value={elig} onChange={(e) => setElig(e.target.value as EligibilityStatus | '')}>
              <option value="">Any</option><option value="verified">Verified</option><option value="pending">Pending</option>
              <option value="not_submitted">Not submitted</option><option value="expired">Expired</option>
            </select>
          </div>
          <button onClick={clear} className="text-sm font-medium text-brand hover:underline">Clear filters</button>
        </Card>
        <div>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-slate-500"><b className="text-ink">{results.length}</b> players</span>
            <label className="flex items-center gap-2 text-slate-500">Sort
              <select className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="ppg">Points per game</option><option value="height">Height</option><option value="gpa">GPA</option><option value="name">Last name</option>
              </select>
            </label>
          </div>
          <div className="space-y-3">
            {results.map((a) => <AthleteRow key={a.id} a={a} />)}
            {!results.length && <Card className="text-center text-slate-500">No players match these filters.</Card>}
          </div>
        </div>
      </div>
    </>
  )
}
