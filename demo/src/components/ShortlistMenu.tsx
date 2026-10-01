import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { can } from '../permissions'

export default function ShortlistMenu({ athleteId }: { athleteId: string }) {
  const { role, shortlists, toggleOnList, createShortlist } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  if (!can(role, 'shortlist.manage')) return null
  const count = shortlists.filter((l) => l.entries.some((e) => e.athleteId === athleteId)).length

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ${count ? 'bg-orange-50 text-brand-dark ring-orange-200' : 'bg-white text-ink ring-slate-300 hover:bg-slate-50'}`}>
        {count ? `★ On ${count} list${count > 1 ? 's' : ''}` : '☆ Shortlist'}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {shortlists.map((l) => (
            <label key={l.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
              <input type="checkbox" className="accent-[#f26b1d]" checked={l.entries.some((e) => e.athleteId === athleteId)} onChange={() => toggleOnList(l.id, athleteId)} />
              {l.name}
            </label>
          ))}
          <button className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-brand hover:bg-orange-50"
            onClick={() => { const n = prompt('New shortlist name'); if (n?.trim()) createShortlist(n.trim()) }}>
            + New list
          </button>
        </div>
      )}
    </div>
  )
}
