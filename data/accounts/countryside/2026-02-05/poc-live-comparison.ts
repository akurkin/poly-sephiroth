#!/usr/bin/env bun
/**
 * POC: Live Vegas vs Polymarket Edge Scanner
 * Compares The Odds API prices to Polymarket prices
 */

const ODDS_API_KEY = "d4f8a3a181c974d2e52223d0120ccb97";

// Convert American odds to implied probability
function americanToProb(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

// Normalize team names for matching
function normalizeTeam(name: string): string {
  return name
    .toLowerCase()
    .replace(/^will the /, "")
    .replace(/ win.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface VegasOdds {
  team: string;
  price: number; // American odds
  prob: number;  // Implied probability
  book: string;
}

interface PolyPrice {
  team: string;
  price: number; // 0-1
}

interface Edge {
  team: string;
  vegasProb: number;
  polyPrice: number;
  edge: number;
  book: string;
  signal: "BUY" | "AVOID" | "NEUTRAL";
}

async function fetchVegasNBAChampion(): Promise<VegasOdds[]> {
  const url = `https://api.the-odds-api.com/v4/sports/basketball_nba_championship_winner/odds/?apiKey=${ODDS_API_KEY}&regions=us&oddsFormat=american`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data[0]?.bookmakers) return [];

  // Use DraftKings as reference (Pinnacle requires paid tier)
  const dk = data[0].bookmakers.find((b: any) => b.key === "draftkings");
  if (!dk) return [];

  return dk.markets[0].outcomes.map((o: any) => ({
    team: normalizeTeam(o.name),
    price: o.price,
    prob: americanToProb(o.price),
    book: "DraftKings"
  }));
}

async function fetchVegasNBAGames(): Promise<Map<string, VegasOdds[]>> {
  const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american`;
  const res = await fetch(url);
  const data = await res.json();

  const games = new Map<string, VegasOdds[]>();

  for (const game of data) {
    const gameKey = `${game.away_team} @ ${game.home_team}`;
    const dk = game.bookmakers?.find((b: any) => b.key === "draftkings");
    if (!dk) continue;

    const odds: VegasOdds[] = dk.markets[0].outcomes.map((o: any) => ({
      team: normalizeTeam(o.name),
      price: o.price,
      prob: americanToProb(o.price),
      book: "DraftKings"
    }));

    games.set(gameKey, odds);
  }

  return games;
}

async function fetchPolyNBAChampion(): Promise<PolyPrice[]> {
  const url = "https://gamma-api.polymarket.com/events?slug=2026-nba-champion";
  const res = await fetch(url);
  const data = await res.json();

  return data[0].markets.map((m: any) => ({
    team: normalizeTeam(m.question),
    price: parseFloat(JSON.parse(m.outcomePrices)[0])
  }));
}

function calculateEdges(vegas: VegasOdds[], poly: PolyPrice[]): Edge[] {
  const edges: Edge[] = [];

  for (const v of vegas) {
    const p = poly.find(x => x.team === v.team);
    if (!p) continue;

    const edge = v.prob - p.price;
    let signal: "BUY" | "AVOID" | "NEUTRAL" = "NEUTRAL";
    if (edge > 0.03) signal = "BUY";
    if (edge < -0.03) signal = "AVOID";

    edges.push({
      team: v.team,
      vegasProb: v.prob,
      polyPrice: p.price,
      edge,
      book: v.book,
      signal
    });
  }

  return edges.sort((a, b) => b.edge - a.edge);
}

async function main() {
  console.log("=== POC: Vegas vs Polymarket Edge Scanner ===\n");
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // NBA Championship Futures
  console.log("## NBA Championship Futures\n");

  const vegasChamp = await fetchVegasNBAChampion();
  const polyChamp = await fetchPolyNBAChampion();
  const champEdges = calculateEdges(vegasChamp, polyChamp);

  console.log("| Team | Vegas (DK) | Polymarket | Edge | Signal |");
  console.log("|------|------------|------------|------|--------|");

  for (const e of champEdges.slice(0, 15)) {
    const vegasPct = (e.vegasProb * 100).toFixed(1) + "%";
    const polyPct = (e.polyPrice * 100).toFixed(1) + "%";
    const edgePct = (e.edge * 100).toFixed(1) + "%";
    const signal = e.signal === "BUY" ? "🟢 BUY" : e.signal === "AVOID" ? "🔴 AVOID" : "⚪";
    console.log(`| ${e.team} | ${vegasPct} | ${polyPct} | ${edgePct} | ${signal} |`);
  }

  // Summary
  const buySignals = champEdges.filter(e => e.signal === "BUY");
  const avoidSignals = champEdges.filter(e => e.signal === "AVOID");

  console.log(`\n### Summary`);
  console.log(`- BUY signals (edge > 3%): ${buySignals.length}`);
  console.log(`- AVOID signals (edge < -3%): ${avoidSignals.length}`);

  if (buySignals.length > 0) {
    console.log(`\n### Top Opportunities`);
    for (const e of buySignals.slice(0, 3)) {
      console.log(`- ${e.team}: ${(e.edge * 100).toFixed(1)}% edge (Vegas ${(e.vegasProb * 100).toFixed(1)}% vs Poly $${e.polyPrice.toFixed(3)})`);
    }
  }

  // Tonight's Games
  console.log("\n## Tonight's NBA Games\n");

  const vegasGames = await fetchVegasNBAGames();
  console.log(`Found ${vegasGames.size} games with odds\n`);

  for (const [game, odds] of vegasGames) {
    console.log(`### ${game}`);
    for (const o of odds) {
      console.log(`  ${o.team}: ${(o.prob * 100).toFixed(1)}% (${o.price > 0 ? '+' : ''}${o.price})`);
    }
    console.log("");
  }

  console.log("\n(Note: Daily game markets on Polymarket may have already resolved)");
}

main().catch(console.error);
