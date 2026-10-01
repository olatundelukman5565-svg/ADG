import type { ReactNode } from 'react'
import type { EligibilityStatus, DocStatus } from '../data/mock'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

const tones = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
}
export type Tone = keyof typeof tones

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>{children}</span>
}

export function EligibilityBadge({ status }: { status: EligibilityStatus }) {
  const map: Record<EligibilityStatus, [Tone, string]> = {
    verified: ['green', 'Eligibility verified'],
    pending: ['amber', 'Eligibility pending'],
    not_submitted: ['slate', 'Not submitted'],
    expired: ['red', 'Eligibility expired'],
  }
  const [tone, label] = map[status]
  return <Badge tone={tone}>{label}</Badge>
}

export function DocBadge({ status }: { status: DocStatus }) {
  const tone: Tone = status === 'verified' ? 'green' : status === 'pending' ? 'amber' : 'red'
  if (status === 'expired') return <Badge tone="red">Expired</Badge>
  return <Badge tone={tone}>{status[0].toUpperCase() + status.slice(1)}</Badge>
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled, className = '' }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; type?: 'button' | 'submit'; disabled?: boolean; className?: string
}) {
  const v = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'bg-white text-ink ring-1 ring-slate-300 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }[variant]
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${v} ${className}`}>
      {children}
    </button>
  )
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('')
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 45% 42%)` }}>
      {initials}
    </div>
  )
}

export function NoAccess({ what }: { what: string }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg text-center">
      <div className="text-4xl">🔒</div>
      <h2 className="mt-2 text-lg font-bold">Not available for your role</h2>
      <p className="mt-1 text-sm text-slate-500">Your account does not have permission to {what}. Switch role from the sidebar to explore other views.</p>
    </Card>
  )
}

export const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-orange-100'
