import meow from "meow"
import { render } from "ink"
import React from "react"
import { DumpCommand } from "./commands/dump.js"
import { ArbCommand } from "./commands/arb.js"

const cli = meow(
  `
  Usage
    $ poly dump <address>
    $ poly arb

  Commands
    dump <address>  Dump account data
    arb             Scan for arbitrage opportunities

  Options (dump)
    --days, -d          Days of history (default: 90)
    --output, -o        Output directory (default: ./data)

  Options (arb)
    --threshold, -t     Max sum of asks (default: 0.98)
    --min-outcomes, -m  Min outcomes per event (default: 4)
    --min-volume        Min event volume in USD (default: 10000)
    --min-depth         Min orderbook depth in USD (default: 500)

  Examples
    $ poly dump 0xd0b4...ed6 --days 30
    $ poly arb
    $ poly arb --threshold 0.95 --min-outcomes 6
`,
  {
    importMeta: import.meta,
    flags: {
      days: { type: "number", shortFlag: "d", default: 90 },
      output: { type: "string", shortFlag: "o", default: "./data" },
      threshold: { type: "number", shortFlag: "t", default: 0.98 },
      minOutcomes: { type: "number", shortFlag: "m", default: 4 },
      minVolume: { type: "number", default: 10_000 },
      minDepth: { type: "number", default: 500 },
    },
  }
)

const [command, target] = cli.input

if (command === "dump" && target) {
  render(<DumpCommand target={target} days={cli.flags.days} output={cli.flags.output} />)
} else if (command === "arb") {
  render(
    <ArbCommand
      threshold={cli.flags.threshold}
      minOutcomes={cli.flags.minOutcomes}
      minVolume={cli.flags.minVolume}
      minDepth={cli.flags.minDepth}
    />
  )
} else {
  cli.showHelp()
}
