import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import Spinner from "ink-spinner"
import { dumpAccount, DumpError, type DumpProgress, type DumpAccountResult } from "../../../lib/use-cases/index.js"

interface Props {
  target: string
  days: number
  output: string
}

type State =
  | { status: "loading"; progress: DumpProgress }
  | { status: "success"; result: DumpAccountResult }
  | { status: "error"; message: string; stage?: string }

const LABELS: Record<string, string> = {
  resolve: "Resolving address",
  activity: "Fetching activity",
  positions: "Fetching positions",
  profile: "Fetching profile",
  markets: "Fetching markets",
  summary: "Computing summary",
  writing: "Writing files",
}

export function DumpCommand({ target, days, output }: Props) {
  const [state, setState] = useState<State>({
    status: "loading",
    progress: { stage: "resolve", message: "Starting..." },
  })

  useEffect(() => {
    dumpAccount({ target, days, outputDir: output }, p => setState({ status: "loading", progress: p }))
      .then(result => setState({ status: "success", result }))
      .catch(e => {
        const msg = e instanceof Error ? e.message : String(e)
        const stage = e instanceof DumpError ? e.stage : undefined
        setState({ status: "error", message: msg, stage })
      })
  }, [target, days, output])

  if (state.status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {state.message}</Text>
        {state.stage && <Text color="gray">Stage: {state.stage}</Text>}
      </Box>
    )
  }

  if (state.status === "success") {
    const { result } = state
    const { summary } = result
    return (
      <Box flexDirection="column">
        <Text color="green">Saved to {result.outputPath}</Text>
        <Text> Trades: {summary.totalTrades.toLocaleString()}</Text>
        <Text> Volume: ${summary.totalVolume.toLocaleString()}</Text>
        <Text color={summary.estimatedProfit >= 0 ? "green" : "red"}>
          {" "}
          Est. Profit: ${summary.estimatedProfit.toLocaleString()}
        </Text>
      </Box>
    )
  }

  const { progress } = state
  const label = LABELS[progress.stage] ?? progress.message
  const showCount = progress.current !== undefined

  return (
    <Box>
      <Text color="green">
        <Spinner type="dots" />
      </Text>
      <Text> {label}</Text>
      {showCount && (
        <Text color="gray">
          {" "}
          ({progress.current}/{progress.total})
        </Text>
      )}
    </Box>
  )
}
