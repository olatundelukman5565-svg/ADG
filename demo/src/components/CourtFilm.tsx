import { useEffect, useRef } from 'react'

// Simulated top-down game footage drawn on a canvas, so the demo needs no video files.
// In the real platform this area is an HLS video player streaming the uploaded game.

export interface FilmPlayer { jersey: number; side: 'home' | 'away'; name?: string; focus?: boolean }

const W = 940
const H = 500
const POSS = 18 // seconds per possession
const HOME = '#f26b1d'
const AWAY = '#2f7de1'

const OFF = [[0.7, 0.5], [0.82, 0.14], [0.82, 0.86], [0.9, 0.3], [0.93, 0.66]]

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function scoreAt(t: number) {
  let home = 0
  let away = 0
  const done = Math.floor(t / POSS)
  for (let p = 0; p < done; p++) {
    const r = hash(p)
    if (r < 0.48) {
      const pts = r < 0.16 ? 3 : 2
      if (p % 2 === 0) home += pts
      else away += pts
    }
  }
  return { home, away }
}

function positions(t: number) {
  const poss = Math.floor(t / POSS)
  const phase = (t % POSS) / POSS
  const homeOnOffense = poss % 2 === 0
  const dir = homeOnOffense ? 1 : -1
  const trans = Math.min(1, (t % POSS) / 3) // first 3s: run from the other end
  const mirror = (x: number, d: number) => (d === 1 ? x : 1 - x)
  const pts: { x: number; y: number; side: 'home' | 'away'; idx: number }[] = []

  OFF.forEach(([ox, oy], i) => {
    const nx = 0.025 * Math.sin(t * 0.8 + i * 1.3 + poss) + 0.02 * Math.sin(t * 1.9 + i)
    const ny = 0.06 * Math.sin(t * 0.55 + i * 2.1 + poss * 0.7)
    const from = mirror(1 - ox + 0.2, dir)
    const to = mirror(ox + nx, dir)
    const offX = from + (to - from) * trans
    const offY = oy + ny
    const defX = offX + dir * 0.035 * trans
    const defY = offY + (0.5 - offY) * 0.12 + 0.02 * Math.sin(t * 1.3 + i)
    pts.push({ x: offX, y: offY, side: homeOnOffense ? 'home' : 'away', idx: i })
    pts.push({ x: defX, y: defY, side: homeOnOffense ? 'away' : 'home', idx: i })
  })

  // Ball: passed between offensive players, then shot near the end of the possession.
  const handler = Math.floor((t % POSS) / 3 + poss) % 5
  const offense = pts.filter((p) => p.side === (homeOnOffense ? 'home' : 'away'))
  const h = offense.find((p) => p.idx === handler)!
  let bx = h.x + dir * 0.008
  let by = h.y
  if (phase > 0.86) {
    const k = (phase - 0.86) / 0.14
    const hoopX = dir === 1 ? 0.947 : 0.053
    bx = h.x + (hoopX - h.x) * k
    by = h.y + (0.5 - h.y) * k
  }
  return { pts, ball: { x: bx, y: by }, shooting: phase > 0.86 }
}

function drawCourt(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#d9a86c'
  ctx.fillRect(0, 0, W, H)
  for (let y = 0; y < H; y += 14) {
    ctx.fillStyle = y % 28 ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)'
    ctx.fillRect(0, y, W, 14)
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 3
  ctx.strokeRect(10, 10, W - 20, H - 20)
  ctx.beginPath(); ctx.moveTo(W / 2, 10); ctx.lineTo(W / 2, H - 10); ctx.stroke()
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2); ctx.stroke()
  for (const side of [0, 1]) {
    const x0 = side ? W - 10 : 10
    const d = side ? -1 : 1
    ctx.fillStyle = 'rgba(15,27,45,0.18)'
    ctx.fillRect(side ? x0 - 190 : x0, H / 2 - 60, 190, 120)
    ctx.strokeRect(side ? x0 - 190 : x0, H / 2 - 60, 190, 120)
    ctx.beginPath(); ctx.arc(x0 + d * 190, H / 2, 60, -Math.PI / 2, Math.PI / 2, side === 1); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x0, 40); ctx.lineTo(x0 + d * 140, 40)
    const a = Math.atan2(210, 100) // three-point arc meets the corner lines
    ctx.arc(x0 + d * 40, H / 2, Math.hypot(100, 210), side ? -(Math.PI - a) : -a, side ? Math.PI - a : a, side === 1)
    ctx.lineTo(x0, H - 40); ctx.stroke()
    ctx.strokeStyle = '#f04'
    ctx.beginPath(); ctx.arc(x0 + d * 40, H / 2, 9, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  }
}

export default function CourtFilm({ t, players, homeName, awayName }: { t: number; players: FilmPlayer[]; homeName: string; awayName: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    drawCourt(ctx)
    const { pts, ball, shooting } = positions(t)
    const team = (side: 'home' | 'away') => players.filter((p) => p.side === side)
    for (const p of pts) {
      const info = team(p.side)[p.idx]
      const x = p.x * W
      const y = p.y * H
      if (info?.focus) {
        ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,0,0.35)'; ctx.fill()
        ctx.font = 'bold 13px system-ui'; ctx.fillStyle = '#0f1b2d'; ctx.textAlign = 'center'
        ctx.fillText(info.name ?? '', x, y - 26)
      }
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2)
      ctx.fillStyle = p.side === 'home' ? HOME : AWAY; ctx.fill()
      ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(String(info?.jersey ?? p.idx + 1), x, y + 1)
    }
    ctx.beginPath(); ctx.arc(ball.x * W, ball.y * H, shooting ? 9 : 7, 0, Math.PI * 2)
    ctx.fillStyle = '#e8590c'; ctx.fill(); ctx.strokeStyle = '#3b1a06'; ctx.lineWidth = 1.5; ctx.stroke()

    // Scoreboard overlay
    const s = scoreAt(t)
    const q = Math.min(4, Math.floor(t / 480) + 1)
    const left = 480 - (t % 480)
    ctx.fillStyle = 'rgba(15,27,45,0.85)'
    ctx.fillRect(W / 2 - 240, 14, 480, 34)
    ctx.textBaseline = 'middle'; ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'left'; ctx.fillStyle = HOME; ctx.fillText(`${homeName.slice(0, 20)}  ${s.home}`, W / 2 - 230, 31)
    ctx.textAlign = 'right'; ctx.fillStyle = '#8fc0ff'; ctx.fillText(`${s.away}  ${awayName.slice(0, 20)}`, W / 2 + 230, 31)
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'
    ctx.fillText(`Q${q} ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`, W / 2, 31)
  }, [t, players, homeName, awayName])

  return <canvas ref={ref} width={W} height={H} className="block h-auto w-full rounded-lg bg-[#d9a86c]" />
}
