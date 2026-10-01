import { useState } from 'react'
import { Link } from 'react-router-dom'
import { athleteById, fmtHeight } from '../data/mock'
import { RECRUIT_STATUSES, useStore, type RecruitStatus } from '../store'
import { can } from '../permissions'
import { Avatar, Button, Card, EligibilityBadge, NoAccess, PageHeader } from '../components/ui'

export default function Shortlists() {
  const { role, shortlists, createShortlist, deleteShortlist, toggleOnList, setStatus } = useStore()
  const [active, setActive] = useState<string | undefined>(shortlists[0]?.id)
  const [view, setView] = useState<'table' | 'board'>('table')
  if (!can(role, 'shortlist.manage')) return <NoAccess what="manage shortlists" />
  const list = shortlists.find((l) => l.id === active) ?? shortlists[0]

  return (
    <>
      <PageHeader title="Shortlists" subtitle="Organize prospects and track where each one is in your recruiting process."
        actions={<Button onClick={() => { const n = prompt('New shortlist name'); if (n?.trim()) createShortlist(n.trim()) }}>+ New list</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {shortlists.map((l) => (
          <button key={l.id} onClick={() => setActive(l.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${list?.id === l.id ? 'bg-ink text-white ring-ink' : 'bg-white ring-slate-300'}`}>
            {l.name} <span className="opacity-60">({l.entries.length})</span>
          </button>
        ))}
      </div>
      {!list ? <Card className="text-slate-500">Create your first shortlist to start tracking players.</Card> : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex rounded-lg bg-white p-1 ring-1 ring-slate-300">
              {(['table', 'board'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`rounded-md px-3 py-1 text-sm font-semibold capitalize ${view === v ? 'bg-slate-100' : 'text-slate-500'}`}>{v === 'board' ? 'Pipeline board' : 'Table'}</button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => { if (confirm(`Delete "${list.name}"?`)) { deleteShortlist(list.id); setActive(undefined) } }}>Delete list</Button>
          </div>
          {view === 'table' ? (
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr><th className="px-4 py-3">Player</th><th>Pos</th><th>Ht</th><th>Class</th><th>Eligibility</th><th>Status</th><th /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.entries.map((e) => {
                    const a = athleteById(e.athleteId)!
                    return (
                      <tr key={e.athleteId}>
                        <td className="px-4 py-3"><Link to={`/athletes/${a.id}`} className="flex items-center gap-2 font-semibold hover:text-brand"><Avatar name={`${a.firstName} ${a.lastName}`} size={30} />{a.firstName} {a.lastName}</Link></td>
                        <td>{a.position}</td><td>{fmtHeight(a.heightIn)}</td><td>{a.gradYear}</td>
                        <td><EligibilityBadge status={a.eligibility} /></td>
                        <td>
                          <select value={e.status} onChange={(ev) => setStatus(list.id, a.id, ev.target.value as RecruitStatus)} className="rounded-md border border-slate-300 bg-white px-2 py-1">
                            {RECRUIT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="pr-4 text-right"><button onClick={() => toggleOnList(list.id, a.id)} className="text-slate-400 hover:text-rose-600">Remove</button></td>
                      </tr>
                    )
                  })}
                  {!list.entries.length && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">This list is empty. Add players from <Link className="text-brand underline" to="/search">Find players</Link>.</td></tr>}
                </tbody>
              </table>
            </Card>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {RECRUIT_STATUSES.map((s) => (
                <div key={s} className="w-52 shrink-0 rounded-xl bg-slate-100 p-2">
                  <div className="px-1 pb-2 text-xs font-bold uppercase text-slate-500">{s} ({list.entries.filter((e) => e.status === s).length})</div>
                  <div className="space-y-2">
                    {list.entries.filter((e) => e.status === s).map((e) => {
                      const a = athleteById(e.athleteId)!
                      const i = RECRUIT_STATUSES.indexOf(s)
                      return (
                        <div key={e.athleteId} className="rounded-lg bg-white p-2.5 text-sm shadow-sm">
                          <Link to={`/athletes/${a.id}`} className="font-semibold hover:text-brand">{a.firstName} {a.lastName}</Link>
                          <div className="text-xs text-slate-500">{a.position} · {fmtHeight(a.heightIn)} · {a.gradYear}</div>
                          <div className="mt-2 flex justify-between text-xs">
                            <button disabled={i === 0} onClick={() => setStatus(list.id, a.id, RECRUIT_STATUSES[i - 1])} className="text-slate-500 disabled:opacity-30">← Back</button>
                            <button disabled={i === RECRUIT_STATUSES.length - 1} onClick={() => setStatus(list.id, a.id, RECRUIT_STATUSES[i + 1])} className="font-semibold text-brand disabled:opacity-30">Advance →</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
