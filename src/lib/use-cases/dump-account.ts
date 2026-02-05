import * as api from "../polymarket-api.js"
import { writeOutput } from "../fs.js"
import { computeSummary } from "./compute-summary.js"
import { isErr } from "../result.js"
import type { Summary } from "../types.js"

export interface DumpAccountInput {
  target: string
  days: number
  outputDir: string
}

export interface DumpAccountResult {
  outputPath: string
  address: string
  summary: Summary
}

export type DumpStage = "resolve" | "activity" | "positions" | "profile" | "markets" | "summary" | "writing"

export interface DumpProgress {
  stage: DumpStage
  message: string
  current?: number
  total?: number
}

export class DumpError extends Error {
  constructor(
    public stage: DumpStage,
    message: string
  ) {
    super(message)
    this.name = "DumpError"
  }
}

export async function dumpAccount(
  input: DumpAccountInput,
  onProgress?: (p: DumpProgress) => void
): Promise<DumpAccountResult> {
  const emit = onProgress ?? (() => {})

  emit({ stage: "resolve", message: "Resolving address..." })
  const addrResult = await api.resolveAddress(input.target)
  if (isErr(addrResult)) throw new DumpError("resolve", addrResult.error.message)
  const address = addrResult.data

  emit({ stage: "activity", message: "Fetching activity..." })
  const actResult = await api.fetchActivity(address, input.days, (cur, tot) => {
    emit({ stage: "activity", message: "Fetching activity...", current: cur, total: tot })
  })
  if (isErr(actResult)) throw new DumpError("activity", actResult.error.message)

  emit({ stage: "positions", message: "Fetching positions..." })
  const posResult = await api.fetchPositions(address)
  if (isErr(posResult)) throw new DumpError("positions", posResult.error.message)

  emit({ stage: "profile", message: "Extracting profile..." })
  const profile = api.extractProfileFromActivity(address, actResult.data)

  emit({ stage: "markets", message: "Fetching markets..." })
  const conditionIds = [...new Set(actResult.data.map(a => a.conditionId))]
  const mktResult = await api.fetchMarkets(conditionIds, (cur, tot) => {
    emit({ stage: "markets", message: "Fetching markets...", current: cur, total: tot })
  })
  if (isErr(mktResult)) throw new DumpError("markets", mktResult.error.message)

  emit({ stage: "summary", message: "Computing summary..." })
  const summary = computeSummary(actResult.data, posResult.data)

  emit({ stage: "writing", message: "Writing files..." })
  const outputPath = await writeOutput(
    input.outputDir,
    address,
    {
      activity: actResult.data,
      positions: posResult.data,
      profile,
      markets: mktResult.data,
      summary,
    },
    input.days
  )

  return { outputPath, address, summary }
}
