// Demo data only. Every name, school and number here is fictional.

export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'
export type EligibilityStatus = 'verified' | 'pending' | 'not_submitted' | 'expired'
export type DocStatus = 'pending' | 'verified' | 'rejected' | 'expired'
export const DEMO_TODAY = '2026-10-01'

export interface Athlete {
  id: string
  firstName: string
  lastName: string
  position: Position
  gradYear: number
  heightIn: number
  weightLb: number
  city: string
  state: string
  highSchool: string
  club: string
  gpa: number
  ppg: number
  rpg: number
  apg: number
  eligibility: EligibilityStatus
  bio: string
  published: boolean
}

export interface Game {
  id: string
  date: string
  event: string
  home: string
  away: string
  durationSec: number
  athleteIds: { athleteId: string; jersey: number; side: 'home' | 'away' }[]
}

export interface DocumentRecord {
  id: string
  athleteId: string
  category: 'Transcript' | 'Test scores' | 'ID / Birth certificate' | 'Eligibility Center registration'
  fileName: string
  uploadedAt: string
  expiresAt?: string
  status: DocStatus
  version: number
}

export interface Coach {
  id: string
  name: string
  title: string
  program: string
  verified: boolean
}

const FIRST = ['Jalen', 'Marcus', 'Devin', 'Isaiah', 'Tyrese', 'Caleb', 'Andre', 'Malik', 'Jordan', 'Elijah',
  'Cameron', 'Xavier', 'Darius', 'Trey', 'Noah', 'Amari', 'Jaylen', 'Kobe', 'Miles', 'Zion',
  'Bryce', 'Dante', 'Quinn', 'Rashad', 'Terrence', 'Victor', 'Wesley', 'Aaron', 'Brandon', 'Chris',
  'Damon', 'Evan', 'Felix', 'Grant', 'Hassan', 'Ivan', 'Jamal', 'Kendall', 'Luke', 'Mason']
const LAST = ['Carter', 'Brooks', 'Hayes', 'Mitchell', 'Coleman', 'Reed', 'Foster', 'Bennett', 'Price', 'Ward',
  'Jenkins', 'Perry', 'Russell', 'Sanders', 'Barnes', 'Fisher', 'Hamilton', 'Graham', 'Wallace', 'Stone',
  'Porter', 'Hunter', 'Dixon', 'Hart', 'Mills', 'Gibson', 'Ellis', 'Owens', 'Webb', 'Tucker',
  'Grant', 'Holmes', 'Lane', 'Rice', 'Pierce', 'Dean', 'Boyd', 'Shaw', 'Knight', 'Fields']
const PLACES: [string, string][] = [
  ['Atlanta', 'GA'], ['Houston', 'TX'], ['Chicago', 'IL'], ['Charlotte', 'NC'], ['Phoenix', 'AZ'],
  ['Columbus', 'OH'], ['Memphis', 'TN'], ['Baltimore', 'MD'], ['Orlando', 'FL'], ['Seattle', 'WA'],
  ['Dallas', 'TX'], ['Detroit', 'MI'], ['Newark', 'NJ'], ['Las Vegas', 'NV'], ['Indianapolis', 'IN'],
]
const CLUBS = ['Elite Rise 17U', 'Hoop City Select', 'Prime Time Ballers', 'Next Level Academy', 'Court Kings', 'Rising Stars AAU']
const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']
const ELIG: EligibilityStatus[] = ['verified', 'verified', 'verified', 'pending', 'pending', 'not_submitted', 'expired']

// Small deterministic PRNG so the demo looks the same on every load.
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const rand = rng(42)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const range = (min: number, max: number, dp = 0) => {
  const v = min + rand() * (max - min)
  const f = 10 ** dp
  return Math.round(v * f) / f
}

const HEIGHT_BY_POS: Record<Position, [number, number]> = {
  PG: [70, 76], SG: [73, 78], SF: [76, 80], PF: [78, 82], C: [80, 85],
}

export const athletes: Athlete[] = FIRST.map((first, i) => {
  const position = POSITIONS[i % 5]
  const [city, state] = pick(PLACES)
  const [hMin, hMax] = HEIGHT_BY_POS[position]
  const heightIn = Math.round(range(hMin, hMax))
  return {
    id: `a${i + 1}`,
    firstName: first,
    lastName: LAST[i],
    position,
    gradYear: 2027 + (i % 3),
    heightIn,
    weightLb: Math.round(150 + (heightIn - 70) * 6 + range(-10, 15)),
    city,
    state,
    highSchool: `${city} ${pick(['Central', 'North', 'Prep', 'Academy', 'West'])} HS`,
    club: pick(CLUBS),
    gpa: range(2.6, 4.0, 2),
    ppg: range(6, 26, 1),
    rpg: position === 'C' || position === 'PF' ? range(6, 13, 1) : range(2, 7, 1),
    apg: position === 'PG' ? range(4, 9, 1) : range(0.8, 4, 1),
    eligibility: pick(ELIG),
    bio: `${position === 'PG' ? 'Floor general' : position === 'C' ? 'Rim protector' : 'Versatile wing'} from ${city}. Plays for ${pick(CLUBS)} on the travel circuit.`,
    published: i !== 39,
  }
})

export const games: Game[] = Array.from({ length: 12 }, (_, g) => {
  const home = CLUBS[g % CLUBS.length]
  const away = CLUBS[(g + 2) % CLUBS.length]
  const roster = athletes.filter((_, i) => i % 12 === g || (i + 5) % 12 === g || (i + 9) % 12 === g)
  return {
    id: `g${g + 1}`,
    date: `2026-0${(g % 6) + 4}-${String(10 + g).padStart(2, '0')}`,
    event: pick(['Spring Showcase', 'Summer Classic', 'Peach Jam Qualifier', 'Regional Invitational']),
    home,
    away,
    durationSec: 32 * 60,
    athleteIds: roster.map((a, k) => ({ athleteId: a.id, jersey: 3 + ((k * 7 + g) % 30), side: k % 2 ? 'away' : 'home' })),
  }
})

export const documents: DocumentRecord[] = athletes.flatMap((a, i) => {
  if (a.eligibility === 'not_submitted') return []
  const status: DocStatus = a.eligibility === 'verified' ? 'verified' : a.eligibility === 'pending' ? 'pending' : 'verified'
  return [
    { id: `d${i}-1`, athleteId: a.id, category: 'Transcript', fileName: `${a.lastName}_transcript.pdf`, uploadedAt: '2026-08-02', expiresAt: a.eligibility === 'expired' ? '2026-09-01' : '2027-08-01', status, version: 1 + (i % 2) },
    { id: `d${i}-2`, athleteId: a.id, category: 'Eligibility Center registration', fileName: `${a.lastName}_ec_registration.pdf`, uploadedAt: '2026-07-21', status, version: 1 },
  ] as DocumentRecord[]
})

export const coaches: Coach[] = [
  { id: 'c1', name: 'Coach Dana Whitfield', title: 'Assistant Coach', program: 'Lakeshore State University', verified: true },
  { id: 'c2', name: 'Coach Sam Ortega', title: 'Director of Recruiting', program: 'Midland College', verified: false },
  { id: 'c3', name: 'Coach Riley Abrams', title: 'Head Coach', program: 'Coastal Tech', verified: false },
]

export const athleteById = (id: string) => athletes.find((a) => a.id === id)
export const gameById = (id: string) => games.find((g) => g.id === id)
export const gamesForAthlete = (id: string) => games.filter((g) => g.athleteIds.some((p) => p.athleteId === id))
export const fmtHeight = (inches: number) => `${Math.floor(inches / 12)}'${inches % 12}"`
export const fmtTime = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
