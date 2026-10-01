import { useRef, useState } from 'react'
import type { DocumentRecord } from '../data/mock'
import { useDocuments, useStore } from '../store'
import { can } from '../permissions'
import { Button, Card, DocBadge, EligibilityBadge, NoAccess, PageHeader, inputCls } from '../components/ui'

const CATEGORIES: DocumentRecord['category'][] = ['Transcript', 'Test scores', 'ID / Birth certificate', 'Eligibility Center registration']

export default function MyDocuments() {
  const { role, myAthleteId, profile, addDocument } = useStore()
  const docs = useDocuments().filter((d) => d.athleteId === myAthleteId)
  const [cat, setCat] = useState(CATEGORIES[0])
  const fileRef = useRef<HTMLInputElement>(null)
  if (!can(role, 'document.manage_own')) return <NoAccess what="manage athlete documents" />

  return (
    <>
      <PageHeader title="Documents & eligibility" subtitle="Your files are private. Coaches see only the verification status unless you grant access." />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Document</th><th>File</th><th>Version</th><th>Uploaded</th><th>Expires</th><th className="pr-4">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium">{d.category}</td>
                  <td className="text-slate-500">📄 {d.fileName}</td>
                  <td>v{d.version}</td>
                  <td>{d.uploadedAt}</td>
                  <td>{d.expiresAt ?? '—'}</td>
                  <td className="pr-4"><DocBadge status={d.status} />{d.reason && <div className="mt-1 text-xs text-rose-600">{d.reason}</div>}</td>
                </tr>
              ))}
              {!docs.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No documents uploaded yet.</td></tr>}
            </tbody>
          </table>
        </Card>
        <div className="space-y-4">
          <Card>
            <div className="text-sm font-semibold">Eligibility status</div>
            <div className="mt-2"><EligibilityBadge status={profile.eligibility} /></div>
            <p className="mt-2 text-xs text-slate-500">The exact eligibility rules will follow the spec agreed with the client.</p>
          </Card>
          <Card className="space-y-3">
            <div className="text-sm font-semibold">Upload a document</div>
            <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value as typeof cat)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { addDocument({ athleteId: myAthleteId, category: cat, fileName: f.name }); e.target.value = '' } }} />
            <Button className="w-full" onClick={() => fileRef.current?.click()}>⬆ Choose file</Button>
            <p className="text-xs text-slate-500">Uploading a new file creates a new version and sends it to the admin review queue.</p>
          </Card>
        </div>
      </div>
    </>
  )
}
