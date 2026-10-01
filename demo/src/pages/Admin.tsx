import { useState } from 'react'
import { Link } from 'react-router-dom'
import { athleteById, coaches } from '../data/mock'
import { useDocuments, useStore } from '../store'
import { can } from '../permissions'
import { Badge, Button, Card, DocBadge, NoAccess, PageHeader } from '../components/ui'

export function AdminQueue() {
  const { role, setDocStatus, profile, myAthleteId } = useStore()
  const docs = useDocuments()
  const [tab, setTab] = useState<'pending' | 'verified' | 'rejected'>('pending')
  if (!can(role, 'document.verify')) return <NoAccess what="review documents" />
  const shown = docs.filter((d) => d.status === tab)
  const nameOf = (id: string) => { const a = id === myAthleteId ? profile : athleteById(id); return a ? `${a.firstName} ${a.lastName}` : id }

  return (
    <>
      <PageHeader title="Document verification" subtitle="Review athlete eligibility documents. Every decision is recorded in the audit log." />
      <div className="mb-4 flex gap-2">
        {(['pending', 'verified', 'rejected'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ring-1 ${tab === t ? 'bg-ink text-white ring-ink' : 'bg-white ring-slate-300'}`}>
            {t} ({docs.filter((d) => d.status === t).length})
          </button>
        ))}
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Athlete</th><th>Document</th><th>File</th><th>Uploaded</th><th>Status</th><th className="pr-4 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3"><Link to={`/athletes/${d.athleteId}`} className="font-medium hover:text-brand">{nameOf(d.athleteId)}</Link></td>
                <td>{d.category} <span className="text-xs text-slate-400">v{d.version}</span></td>
                <td className="text-slate-500">📄 {d.fileName}</td>
                <td>{d.uploadedAt}</td>
                <td><DocBadge status={d.status} /></td>
                <td className="space-x-2 pr-4 text-right">
                  {d.status !== 'verified' && <Button className="px-2.5 py-1" onClick={() => setDocStatus(d.id, 'verified')}>Verify</Button>}
                  {d.status !== 'rejected' && <Button variant="secondary" className="px-2.5 py-1" onClick={() => { const r = prompt('Reason for rejection (shown to the athlete)'); if (r != null) setDocStatus(d.id, 'rejected', r || 'Document unreadable') }}>Reject</Button>}
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Nothing here.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  )
}

export function AdminCoaches() {
  const { role, coachVerified, setCoachVerified } = useStore()
  if (!can(role, 'coach.verify')) return <NoAccess what="manage coach accounts" />
  return (
    <>
      <PageHeader title="Coach accounts" subtitle="Only verified coaches can search athletes and view film." />
      <div className="space-y-3">
        {coaches.map((c) => (
          <Card key={c.id} className="flex flex-wrap items-center gap-3">
            <div className="flex-1"><div className="font-semibold">{c.name}</div><div className="text-sm text-slate-500">{c.title} · {c.program}</div></div>
            {coachVerified[c.id] ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Awaiting verification</Badge>}
            <Button variant={coachVerified[c.id] ? 'secondary' : 'primary'} onClick={() => setCoachVerified(c.id, !coachVerified[c.id])}>
              {coachVerified[c.id] ? 'Revoke' : 'Verify coach'}
            </Button>
          </Card>
        ))}
      </div>
    </>
  )
}

export function AdminAudit() {
  const { role, audit } = useStore()
  if (!can(role, 'audit.view')) return <NoAccess what="view the audit log" />
  return (
    <>
      <PageHeader title="Audit log" subtitle="Who did what and when. Actions you take in this demo appear here." />
      <Card className="p-0">
        <ul className="divide-y divide-slate-100 text-sm">
          {audit.map((e, i) => (
            <li key={i} className="flex flex-wrap gap-x-4 px-4 py-2.5">
              <span className="w-40 font-mono text-xs text-slate-400">{new Date(e.at).toLocaleString()}</span>
              <span className="w-44 font-medium">{e.who}</span>
              <span className="flex-1 text-slate-600">{e.action}</span>
            </li>
          ))}
          {!audit.length && <li className="px-4 py-6 text-center text-slate-500">No activity yet. Try shortlisting a player or verifying a document.</li>}
        </ul>
      </Card>
    </>
  )
}
