import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import Spinner from "ink-spinner"
import { scanArb, ScanError, type ScanProgress, type ArbOpportunity } from "../../../lib/use-cases/index.js"

interface Props {
  threshold: number
  minOutcomes: number
  minVolume: number
  minDepth: number
}

type State =
  | { status: "scanning"; progress: ScanProgress }
  | { status: "done"; opportunities: ArbOpportunity[]; elapsed: number }
  | { status: "error"; message: string; stage?: string }

export function ArbCommand({ threshold, minOutcomes, minVolume, minDepth }: Props) {
  const [state, setState] = useState<State>({
    status: "scanning",
    progress: { stage: "events", message: "Starting..." },
  })

  useEffect(() => {
    const start = Date.now()
    scanArb(
      { threshold, minOutcomes, minVolume, minDepth },
      p => setState({ status: "scanning", progress: p })
    )
      .then(opportunities =>
        setState({ status: "done", opportunities, elapsed: (Date.now() - start) / 1000 })
      )
      .catch(e => {
        const msg = e instanceof Error ? e.message : String(e)
        const stage = e instanceof ScanError ? e.stage : undefined
        setState({ status: "error", message: msg, stage })
      })
  }, [threshold, minOutcomes, minVolume, minDepth])

  if (state.status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {state.message}</Text>
        {state.stage && <Text color="gray">Stage: {state.stage}</Text>}
      </Box>
    )
  }

  if (state.status === "scanning") {
    const { progress } = state
    const hasCount = progress.current !== undefined
    return (
      <Box>
        <Text color="green"><Spinner type="dots" /></Text>
        <Text> {progress.message}</Text>
        {hasCount && (
          <Text color="gray"> ({progress.current}/{progress.total})</Text>
        )}
      </Box>
    )
  }

  const { opportunities, elapsed } = state
  return (
    <Box flexDirection="column">
      {opportunities.length === 0 ? (
        <Text color="yellow">No arbitrage opportunities found (threshold: {threshold})</Text>
      ) : (
        <>
          <Text bold color="green">=== ARBITRAGE OPPORTUNITIES ===</Text>
          <Text> </Text>
          {opportunities.map(opp => (
            <Box key={opp.event.id} flexDirection="column" marginBottom={1}>
              <Text bold color="green">{opp.event.slug}</Text>
              <Text>  Sum of asks: ${opp.sumOfAsks.toFixed(3)} ({opp.outcomes.length} outcomes{opp.outcomesWithNoAsks > 0 && `, ${opp.outcomesWithNoAsks} empty`})</Text>
              <Text>  Profit margin: {(opp.profitMargin * 100).toFixed(1)}%</Text>
              <Text>  Min depth: ${opp.minDepth.toFixed(0)}</Text>
              <Text color="gray">  Top outcomes:</Text>
              {opp.outcomes
                .filter(o => o.bestAsk !== null)
                .slice(0, 5)
                .map(o => (
                  <Text key={o.tokenId} color="gray">
                    {"    "}{o.question.slice(0, 40).padEnd(42)} ${o.bestAsk?.toFixed(3) ?? "N/A"} (${o.bestAskSize.toFixed(0)} avail)
                  </Text>
                ))}
            </Box>
          ))}
        </>
      )}
      <Text color="gray">Scanned in {elapsed.toFixed(1)}s | Threshold: {threshold}</Text>
    </Box>
  )
}
