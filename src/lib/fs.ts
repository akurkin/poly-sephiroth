import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { Activity, Position, Profile, GammaMarket, Summary, DumpMeta } from "./types.js"

export interface DumpData {
  activity: Activity[]
  positions: Position[]
  profile: Profile
  markets: Record<string, GammaMarket>
  summary: Summary
}

export async function writeOutput(
  baseDir: string,
  address: string,
  data: DumpData,
  days: number
): Promise<string> {
  const dateStr = new Date().toISOString().split("T")[0]
  const outputDir = join(baseDir, "accounts", address.toLowerCase(), dateStr!)

  await mkdir(outputDir, { recursive: true })

  const meta: DumpMeta = {
    address,
    username: data.profile.name || null,
    dumpedAt: new Date().toISOString(),
    days,
    version: "0.1.0",
  }

  await Promise.all([
    writeFile(join(outputDir, "activity.json"), JSON.stringify(data.activity, null, 2)),
    writeFile(join(outputDir, "positions.json"), JSON.stringify(data.positions, null, 2)),
    writeFile(join(outputDir, "profile.json"), JSON.stringify(data.profile, null, 2)),
    writeFile(join(outputDir, "markets.json"), JSON.stringify(data.markets, null, 2)),
    writeFile(join(outputDir, "summary.json"), JSON.stringify(data.summary, null, 2)),
    writeFile(join(outputDir, "meta.json"), JSON.stringify(meta, null, 2)),
  ])

  return outputDir
}
