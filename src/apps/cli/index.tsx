import meow from "meow"
import { render } from "ink"
import React from "react"
import { DumpCommand } from "./commands/dump.js"

const cli = meow(
  `
  Usage
    $ poly dump <address>

  Options
    --days, -d    Days of history (default: 90)
    --output, -o  Output directory (default: ./data)

  Examples
    $ poly dump 0xd0b4c4c020abdc88ad9a884f999f3d8cff8ffed6 --days 30
`,
  {
    importMeta: import.meta,
    flags: {
      days: { type: "number", shortFlag: "d", default: 90 },
      output: { type: "string", shortFlag: "o", default: "./data" },
    },
  }
)

const [command, target] = cli.input

if (command === "dump" && target) {
  render(<DumpCommand target={target} days={cli.flags.days} output={cli.flags.output} />)
} else {
  cli.showHelp()
}
