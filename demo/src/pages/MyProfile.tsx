import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fmtHeight, type Athlete, type Position } from '../data/mock'
import { useStore } from '../store'
import { can } from '../permissions'
import { Button, Card, EligibilityBadge, NoAccess, PageHeader, inputCls } from '../components/ui'

export default function MyProfile() {
  const { role, profile, saveProfile } = useStore()
  const [f, setF] = useState<Athlete>(profile)
  const [saved, setSaved] = useState(false)
  if (!can(role, 'profile.edit_own')) return <NoAccess what="edit an athlete profile" />

  const set = <K extends keyof Athlete>(k: K, v: Athlete[K]) => { setF((p) => ({ ...p, [k]: v })); setSaved(false) }
  const complete = [f.firstName, f.lastName, f.highSchool, f.club, f.bio, f.city].filter(Boolean).length / 6

  return (
    <>
      <PageHeader title="My recruiting profile" subtitle="This is what coaches see when they find you."
        actions={<Link to={`/athletes/${profile.id}`} className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Preview as coach →</Link>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); saveProfile(f); setSaved(true) }}>
            <Field label="First name"><input className={inputCls} value={f.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
            <Field label="Last name"><input className={inputCls} value={f.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
            <Field label="Position">
              <select className={inputCls} value={f.position} onChange={(e) => set('position', e.target.value as Position)}>
                {['PG', 'SG', 'SF', 'PF', 'C'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Graduation year">
              <select className={inputCls} value={f.gradYear} onChange={(e) => set('gradYear', +e.target.value)}>{[2027, 2028, 2029, 2030].map((y) => <option key={y}>{y}</option>)}</select>
            </Field>
            <Field label={`Height: ${fmtHeight(f.heightIn)}`}><input type="range" min={64} max={88} value={f.heightIn} onChange={(e) => set('heightIn', +e.target.value)} className="w-full accent-[#f26b1d]" /></Field>
            <Field label="Weight (lb)"><input type="number" className={inputCls} value={f.weightLb} onChange={(e) => set('weightLb', +e.target.value)} /></Field>
            <Field label="High school"><input className={inputCls} value={f.highSchool} onChange={(e) => set('highSchool', e.target.value)} /></Field>
            <Field label="Club / travel team"><input className={inputCls} value={f.club} onChange={(e) => set('club', e.target.value)} /></Field>
            <Field label="City"><input className={inputCls} value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label="State"><input className={inputCls} value={f.state} maxLength={2} onChange={(e) => set('state', e.target.value.toUpperCase())} /></Field>
            <Field label="Points per game"><input type="number" step={0.1} className={inputCls} value={f.ppg} onChange={(e) => set('ppg', +e.target.value)} /></Field>
            <Field label="GPA"><input type="number" step={0.01} min={0} max={4} className={inputCls} value={f.gpa} onChange={(e) => set('gpa', +e.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label="About me"><textarea rows={3} className={inputCls} value={f.bio} onChange={(e) => set('bio', e.target.value)} /></Field></div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="accent-[#f26b1d]" checked={f.published} onChange={(e) => set('published', e.target.checked)} />
              Profile visible to verified coaches
            </label>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit">Save profile</Button>
              {saved && <span className="text-sm text-emerald-600">✓ Saved</span>}
            </div>
          </form>
        </Card>
        <div className="space-y-4">
          <Card>
            <div className="text-sm font-semibold">Profile strength</div>
            <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand" style={{ width: `${complete * 100}%` }} /></div>
            <div className="mt-1 text-xs text-slate-500">{Math.round(complete * 100)}% complete</div>
          </Card>
          <Card>
            <div className="text-sm font-semibold">Eligibility</div>
            <div className="mt-2"><EligibilityBadge status={profile.eligibility} /></div>
            <Link to="/me/documents" className="mt-3 block text-sm font-medium text-brand hover:underline">Manage documents →</Link>
          </Card>
          <Card>
            <div className="text-sm font-semibold">Game film</div>
            <Link to="/me/film" className="mt-2 block text-sm font-medium text-brand hover:underline">Upload a full game →</Link>
          </Card>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{label}</span>{children}</label>
}
