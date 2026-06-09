/**
 * Integration-adapter invariants (CI — `ts-node --transpile-only`).
 *
 * Covers the IEX price-feed and carbon-credit-registry provider seams: env-based
 * provider selection, the indicative/estimated fallbacks, and the PURE response
 * mappers (where real adapter bugs live) — verified without a network. Same
 * discipline as the OCR/BBPS adapters. Exits non-zero on any failure.
 */

import {
  aggregates,
  mapIexResponse,
  providerName as iexProvider,
} from "../src/markets/iex/iex-core";
import { iexMockQuote } from "../src/markets/iex/provider-mock";
import {
  CCC_INDICATIVE_INR,
  mapRegistryResponse,
  providerName as registryProvider,
} from "../src/markets/registry/registry-core";
import { registryMockHoldings } from "../src/markets/registry/provider-mock";

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}

console.log("Integration-adapter invariants (IEX + carbon-credit registry):");

// ── Provider selection by env ──────────────────────────────────────────────────
{
  delete process.env.IEX_PROVIDER;
  check(iexProvider() === "mock", "IEX defaults to indicative (mock) with no env");
  process.env.IEX_PROVIDER = "http";
  check(iexProvider() === "http", "IEX_PROVIDER=http selects the live feed");
  delete process.env.IEX_PROVIDER;

  delete process.env.REGISTRY_PROVIDER;
  check(registryProvider() === "mock", "Registry defaults to estimated (mock) with no env");
  process.env.REGISTRY_PROVIDER = "http";
  check(registryProvider() === "http", "REGISTRY_PROVIDER=http selects the live registry");
  delete process.env.REGISTRY_PROVIDER;
}

// ── IEX indicative reference ────────────────────────────────────────────────────
{
  const q = iexMockQuote();
  check(q.source === "indicative", "IEX mock is tagged source=indicative");
  check(q.blocks.length === 12, "IEX reference has 12 two-hour blocks");
  check(q.peakINR === 8.9 && q.offPeakINR === 2.7, "IEX reference peak/off-peak from blocks");
  check(q.lastMcpINR === 4.3, "IEX reference last MCP = last block");
  check(q.dayAvgINR === 4.78, "IEX reference day-average computed from blocks");
}

// ── IEX response mapping (live feed) ────────────────────────────────────────────
{
  const q = mapIexResponse({ blocks: [{ hour: "18", price: 9.2 }, { hour: "02", price: 2.5 }], asOf: "2026-06-09" });
  check(q.source === "iex", "mapped IEX response tagged source=iex");
  check(q.blocks.length === 2, "mapped IEX blocks parsed");
  check(q.peakINR === 9.2 && q.offPeakINR === 2.5, "mapped IEX peak/off-peak");
  check(q.lastMcpINR === 2.5, "mapped IEX last MCP = last block");
  check(q.asOf === "2026-06-09", "mapped IEX carries asOf from feed");

  // Alternate envelope + field names, wrapped in data{}.
  const q2 = mapIexResponse({ data: { series: [{ timeBlock: "00", mcp: 3.0 }] } });
  check(q2.blocks.length === 1 && q2.blocks[0].p === 3.0, "mapper handles data{} + alt field names");

  const empty = aggregates([]);
  check(empty.peakINR === 0 && empty.dayAvgINR === 0, "empty block series → zeros (no NaN)");
}

// ── Carbon-credit registry ──────────────────────────────────────────────────────
{
  const m = registryMockHoldings();
  check(m.source === "estimated" && m.held === 0 && m.retired === 0, "registry mock = estimated, no holdings");
  check(m.ccPriceINR === CCC_INDICATIVE_INR, "registry mock uses indicative spot price");

  const live = mapRegistryResponse({ held: 1200, retired: 300, price: 1500, asOf: "2026-06-09" });
  check(live.source === "registry", "mapped registry response tagged source=registry");
  check(live.held === 1200 && live.retired === 300 && live.ccPriceINR === 1500, "mapped registry holdings");

  const wrapped = mapRegistryResponse({ data: { balance: 50, surrendered: 10 } });
  check(wrapped.held === 50 && wrapped.retired === 10, "registry mapper handles data{} + alt field names");

  const missing = mapRegistryResponse({});
  check(missing.held === 0 && missing.ccPriceINR === CCC_INDICATIVE_INR, "registry mapper defaults price, 0 holdings");

  const negative = mapRegistryResponse({ held: -5, retired: -3 });
  check(negative.held === 0 && negative.retired === 0, "registry mapper clamps negatives to 0");
}

if (failures > 0) {
  console.error(`\n${failures} integration-adapter invariant(s) FAILED`);
  process.exit(1);
}
console.log("\nAll integration-adapter invariants hold.");
