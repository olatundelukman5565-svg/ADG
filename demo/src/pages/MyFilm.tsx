import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gamesForAthlete } from '../data/mock'
import { localVideoUrls, useStore } from '../store'
import { can } from '../permissions'
import { Badge, Button, Card, NoAccess, PageHeader, inputCls } from '../components/ui'

export default function MyFilm() {
  const { role, myAthleteId, uploads, startUpload } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [label, setLabel] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  if (!can(role, 'film.upload')) return <NoAccess what="upload game film" />

  const onFile = (file?: File) => {
    if (!file) return
    const id = startUpload(file.name, Math.max(1, Math.round(file.size / 1e6)), label.trim() || file.name.replace(/\.[^.]+$/, ''))
    if (file.type.startsWith('video/')) localVideoUrls.set(id, URL.createObjectURL(file))
    setLabel('')
    if (fileRef.current) fileRef.current.value = ''
  }
  const linked = gamesForAthlete(myAthleteId)

  return (
    <>
      <PageHeader title="My film" subtitle="Upload full games. Coaches review them with timestamps, bookmarks and clips." />
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Game title</span>
            <input className={inputCls} placeholder="e.g. Elite Rise vs Court Kings – Summer Classic" value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <Button onClick={() => fileRef.current?.click()}>⬆ Choose game video</Button>
        </div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]) }}
          className="mt-4 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Or drag a video file here. In the real platform, large files (2–10 GB) upload in resumable chunks straight to secure storage, so a dropped connection doesn't restart the upload.
        </div>
      </Card>

      {uploads.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-bold">Uploads</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {uploads.map((u) => (
              <li key={u.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex-1 font-medium">{u.gameLabel}</span>
                  <span className="text-xs text-slate-500">{u.fileName} · {u.sizeMb} MB</span>
                  {u.status === 'uploading' && <Badge tone="blue">Uploading {Math.round(u.progress)}%</Badge>}
                  {u.status === 'processing' && <Badge tone="amber">Processing (creating streaming versions) {Math.round(u.progress)}%</Badge>}
                  {u.status === 'ready' && <Badge tone="green">Ready</Badge>}
                  {u.status === 'ready' && localVideoUrls.has(u.id) && (
                    <Button variant="secondary" onClick={() => setPreview(localVideoUrls.get(u.id)!)}>▶ Preview</Button>
                  )}
                </div>
                {u.status !== 'ready' && (
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div className={`h-1.5 rounded-full transition-all ${u.status === 'uploading' ? 'bg-sky-500' : 'bg-amber-500'}`} style={{ width: `${u.progress}%` }} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {preview && (
        <Card className="mt-6">
          <div className="mb-2 flex items-center justify-between"><h2 className="font-bold">Preview</h2><button className="text-sm text-slate-500" onClick={() => setPreview(null)}>Close</button></div>
          <video src={preview} controls className="w-full rounded-lg bg-black" />
          <p className="mt-2 text-xs text-slate-500">This preview plays your local file. On the live platform, coaches stream it at adaptive quality.</p>
        </Card>
      )}

      <Card className="mt-6">
        <h2 className="font-bold">Games you're tagged in</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {linked.map((g) => (
            <li key={g.id}><Link to={`/games/${g.id}?focus=${myAthleteId}`} className="flex items-center justify-between py-2.5 text-sm hover:text-brand">
              <span className="font-medium">{g.home} vs {g.away}</span><span className="text-slate-500">{g.event} · {g.date}</span>
            </Link></li>
          ))}
        </ul>
      </Card>
    </>
  )
}
