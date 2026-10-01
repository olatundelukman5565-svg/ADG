import { useNavigate } from 'react-router-dom'
import { useStore, type Role } from '../store'

const ROLES: { role: Role; title: string; text: string; to: string; icon: string }[] = [
  { role: 'coach', title: 'Coach / Recruiter', icon: '🧑‍🏫', to: '/coach', text: 'Search players, review full-game film, take timestamped notes and manage shortlists.' },
  { role: 'athlete', title: 'Athlete', icon: '⛹️', to: '/me', text: 'Build a recruiting profile, upload game film and submit eligibility documents.' },
  { role: 'admin', title: 'Administrator', icon: '🛡️', to: '/admin', text: 'Verify documents and coaches, and review the audit log.' },
]

export default function Home() {
  const { setRole } = useStore()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-2xl">🏀</div>
          <span className="text-3xl font-extrabold tracking-tight">ADGP</span>
        </div>
        <h1 className="mt-8 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Athlete profiles, eligibility and full-game film. <span className="text-brand">One recruiting workspace.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          This is a clickable demo for reviewing workflows. Pick a role to explore the platform from that user's point of view.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {ROLES.map((r) => (
            <button key={r.role} onClick={() => { setRole(r.role); navigate(r.to) }}
              className="group rounded-2xl bg-white/5 p-6 text-left ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-brand">
              <div className="text-3xl">{r.icon}</div>
              <div className="mt-3 text-lg font-bold">{r.title}</div>
              <p className="mt-1 text-sm text-slate-300">{r.text}</p>
              <div className="mt-4 text-sm font-semibold text-brand group-hover:underline">Enter as {r.title.split(' ')[0].toLowerCase()} →</div>
            </button>
          ))}
        </div>
        <p className="mt-12 text-xs text-slate-500">All names, schools and data are fictional sample data.</p>
      </div>
    </div>
  )
}
