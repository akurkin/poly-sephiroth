import type { Activity, Position, Profile, GammaMarket, GammaEvent, CLOBOrderbook } from "./types.js"
import { ok, err, type Result } from "./result.js"

const DATA_API = "https://data-api.polymarket.com"
const GAMMA_API = "https://gamma-api.polymarket.com"
const CLOB_API = "https://clob.polymarket.com"
const PAGE_SIZE = 100
const RATE_LIMIT_MS = 100

let lastRequest = 0

async function apiFetch<T>(url: string): Promise<Result<T>> {
  const wait = Math.max(0, RATE_LIMIT_MS - (Date.now() - lastRequest))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastRequest = Date.now()

  const res = await fetch(url)
  if (!res.ok) return err(new Error(`HTTP ${res.status}: ${url}`))
  return ok((await res.json()) as T)
}

export async function resolveAddress(target: string): Promise<Result<string>> {
  if (target.startsWith("0x") && target.length === 42) return ok(target)
  return err(new Error(`Username lookup not supported. Please use wallet address (0x...)`))
}

export type ProgressFn = (current: number, total: number) => void

export async function fetchActivity(
  address: string,
  days: number,
  onProgress?: ProgressFn
): Promise<Result<Activity[]>> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const all: Activity[] = []
  let offset = 0

  while (true) {
    const result = await apiFetch<Activity[]>(
      `${DATA_API}/activity?user=${address}&limit=${PAGE_SIZE}&offset=${offset}`
    )
    if ("error" in result) return result

    const page = result.data
    if (page.length === 0) break

    const inRange = page.filter(a => a.timestamp * 1000 >= cutoff)
    all.push(...inRange)
    onProgress?.(all.length, all.length + PAGE_SIZE)

    if (inRange.length < page.length) break
    offset += PAGE_SIZE
  }

  return ok(all)
}

export async function fetchPositions(address: string): Promise<Result<Position[]>> {
  return apiFetch<Position[]>(`${DATA_API}/positions?user=${address}`)
}

export function extractProfileFromActivity(address: string, activity: Activity[]): Profile {
  const first = activity[0]
  return {
    address,
    name: first?.name ?? "",
    pseudonym: first?.pseudonym ?? "",
    bio: first?.bio ?? "",
    profileImage: first?.profileImage ?? "",
  }
}

export async function fetchMarkets(
  conditionIds: string[],
  onProgress?: ProgressFn
): Promise<Result<Record<string, GammaMarket>>> {
  const markets: Record<string, GammaMarket> = {}
  const unique = [...new Set(conditionIds)]

  for (let i = 0; i < unique.length; i++) {
    const id = unique[i]
    if (!id) continue

    const result = await apiFetch<GammaMarket[]>(`${GAMMA_API}/markets?condition_id=${id}`)
    if ("data" in result && result.data[0]) {
      markets[id] = result.data[0]
    }
    onProgress?.(i + 1, unique.length)
  }

  return ok(markets)
}

export async function fetchEvents(
  onProgress?: ProgressFn
): Promise<Result<GammaEvent[]>> {
  const all: GammaEvent[] = []
  let offset = 0

  while (true) {
    const result = await apiFetch<GammaEvent[]>(
      `${GAMMA_API}/events?closed=false&active=true&limit=${PAGE_SIZE}&offset=${offset}`
    )
    if ("error" in result) return result

    const page = result.data
    if (page.length === 0) break

    all.push(...page)
    onProgress?.(all.length, all.length + PAGE_SIZE)
    offset += PAGE_SIZE
  }

  return ok(all)
}

export async function fetchOrderbook(
  tokenId: string
): Promise<Result<CLOBOrderbook>> {
  return apiFetch<CLOBOrderbook>(`${CLOB_API}/book?token_id=${tokenId}`)
}
