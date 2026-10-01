import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useStore, type Role } from '../store'

const NAV: Record<Role, { to: string; label: string; icon: string }[]> = {
  coach: [
    { to: '/coach', label: 'Dashboard', icon: '🏠' },
    { to: '/search', label: 'Find players', icon: '🔎' },
    { to: '/shortlists', label: 'Shortlists', icon: '📋' },
  ],
  athlete: [
    { to: '/me', label: 'My profile', icon: '👤' },
    { to: '/me/film', label: 'My film', icon: '🎬' },
    { to: '/me/documents', label: 'Documents & eligibility', icon: '📄' },
  ],
  admin: [
    { to: '/admin', label: 'Verification queue', icon: '✅' },
    { to: '/admin/coaches', label: 'Coach accounts', icon: '🧑‍🏫' },
    { to: '/admin/audit', label: 'Audit log', icon: '🧾' },
  ],
}

const HOME: Record<Role, string> = { coach: '/coach', athlete: '/me', admin: '/admin' }
const ROLE_LABEL: Record<Role, string> = { coach: 'Coach / Recruiter', athlete: 'Athlete', admin: 'Administrator' }

export default function Layout({ children }: { children: ReactNode }) {
  const { role, setRole, reset, profile } = useStore()
  const navigate = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [loc.pathname])

  const userName = role === 'coach' ? 'Coach Dana Whitfield' : role === 'admin' ? 'ADGP Admin' : `${profile.firstName} ${profile.lastName}`

  const sidebar = (
    <div className="flex h-full flex-col bg-ink text-slate-200">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-lg">🏀</div>
        <div>
          <div className="text-lg font-extrabold tracking-tight text-white">ADGP</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400">Recruiting platform</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV[role].map((n) => (
          <NavLink key={n.to} to={n.to} end
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}>
            <span>{n.icon}</span>{n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Demo: view as</div>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-white/5 p-1">
          {(['coach', 'athlete', 'admin'] as Role[]).map((r) => (
            <button key={r} onClick={() => { setRole(r); navigate(HOME[r]) }}
              className={`rounded-md px-2 py-1.5 text-xs font-semibold capitalize ${role === r ? 'bg-brand text-white' : 'text-slate-300 hover:bg-white/10'}`}>
              {r}
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-400">Signed in as <span className="text-slate-200">{userName}</span><br />{ROLE_LABEL[role]}</div>
        <button onClick={() => { if (confirm('Reset all demo data?')) { reset(); navigate('/') } }} className="mt-2 text-xs text-slate-400 underline hover:text-white">Reset demo data</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 lg:block"><div className="fixed inset-y-0 w-64">{sidebar}</div></aside>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <span className="font-extrabold">🏀 ADGP</span>
        <button onClick={() => setOpen(true)} className="rounded px-2 py-1 text-sm ring-1 ring-white/30">Menu</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}
      <main className="min-w-0 flex-1">
        <div className="bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800 ring-1 ring-amber-200">
          Clickable demo with fictional sample data. Changes are saved in this browser only.
        </div>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </main>
    </div>
  )
}
