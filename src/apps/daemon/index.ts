import { dumpAccount } from "../../lib/use-cases/index.js"

const accounts = process.argv.slice(2)
if (accounts.length === 0) {
  console.error("Usage: polyd <address> [address...]")
  process.exit(1)
}

async function run() {
  for (const account of accounts) {
    console.log(`Dumping ${account}...`)
    try {
      const result = await dumpAccount({ target: account, days: 90, outputDir: "./data" }, p =>
        console.log(`  ${p.message}`)
      )
      console.log(`  Done: ${result.summary.totalTrades} trades`)
    } catch (e) {
      console.error(`  Failed:`, e instanceof Error ? e.message : e)
    }
  }
}

run()
setInterval(run, 6 * 60 * 60 * 1000)
