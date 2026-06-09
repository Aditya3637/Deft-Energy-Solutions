/**
 * Energy-markets & DER domain (Stage B6) — DERIVED from the org's real data.
 *
 * Pure, deterministic, no I/O — fed real rows by the service and synthetic
 * personas by the CI invariant. Same discipline as the diagnosis/compliance
 * engines: we compute org-specific numbers from the org's actual bills and
 * equipment, and we DO NOT fabricate org data. Inputs that are genuinely
 * external (the power-exchange clearing price, the carbon-credit spot price)
 * are clearly flagged `indicative` so the UI can label them — they become live
 * only when the IEX / registry integrations land (Stage G).
 */

/* ----------------------------------------------------------------- constants */

// CEA CO2 Baseline Database (national grid emission factor), tCO2e per kWh.
const GRID_FACTOR_TCO2E_PER_KWH = 0.00071;
// Li-ion BESS turnkey benchmark and operating assumptions (industry rules of thumb).
const BESS_CAPEX_INR_PER_KWH = 30_000;
const BESS_PEAK_SHAVE_FRACTION = 0.3; // shave ~30% of peak demand
const BESS_DURATION_H = 2; // 2-hour battery
const BESS_CYCLES_PER_YEAR = 300;
const BESS_ROUNDTRIP = 0.85;
const SOLAR_CUF = 0.18; // capacity utilisation factor for rooftop solar (India)
const HOURS_PER_YEAR = 8760;
// Indicative external market references (NOT live until the IEX/registry feeds land).
const IEX_INDICATIVE_INR_PER_KWH = 4.2; // typical DAM day-average
const IEX_PEAK_OFFPEAK_SPREAD_INR = 4.0; // ~peak − off-peak when bill ToD rates absent
const CCC_INDICATIVE_INR = 1450; // ₹ per carbon-credit certificate (CCTS)
const OA_ELIGIBILITY_KW = 1000; // open access: ≥ 1 MW connected load

const round = (n: number) => Math.round(n);
const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/* --------------------------------------------------------------------- types */

export type BillRow = {
  discom: string | null;
  energyKwh: number | null;
  maxDemandKva: number | null;
  contractDemandKva: number | null;
  sanctionedLoadKw: number | null;
  supplyVoltage: string | null;
  totalAmountDue: number | null;
  fixedDemandCharges: number | null;
  crossSubsidySurcharge: number | null;
  additionalSurcharge: number | null;
  wheelingCharges: number | null;
  todPeakRate: number | null;
  todOffPeakRate: number | null;
};

export type BuildingRow = {
  discom: string;
  sanctionedLoadKw: number | null;
  contractDemandKva: number | null;
  savingsInr: number;
};

export type EquipmentRow = { type: string; ratingKw: number | null };

export type GhgRow = { year: number; scope1: number; scope2: number; scope3: number };

export type MarketsInput = {
  bills: BillRow[];
  buildings: BuildingRow[];
  equipment: EquipmentRow[];
  ghg: GhgRow[];
};

export type GhgScope = {
  scope: string;
  note: string;
  tco2e: number;
  sources: { name: string; tco2e: number }[];
};

export type OpenAccess = {
  eligible: boolean;
  loadKw: number;
  monthlyKwh: number;
  gridRateINR: number;
  exchangeRateINR: number;
  charges: { name: string; rate: number; indicative?: boolean }[];
  steps: string[];
};

export type CarbonCredits = {
  /** "estimated" → potential from avoided emissions · "registry" → live holdings. */
  source: "estimated" | "registry";
  asOf: string;
  held: number;
  retired: number;
  ccPriceINR: number;
  projects: { name: string; credits: number }[];
};

export type Bess = {
  peakKw: number;
  recommendedKw: number;
  recommendedKwh: number;
  capexINR: number;
  demandSavingINR: number;
  arbitrageSavingINR: number;
  paybackYrs: number;
};

export type Microgrid = {
  islandingHours: number;
  reliabilityPct: number;
  renewableSharePct: number;
  components: { name: string; spec: string }[];
};

export type Vpp = {
  sites: number;
  dispatchableKw: number;
  drEventsYTD: number;
  drRevenueINR: number;
  der: { name: string; kw: number }[];
};

/* --------------------------------------------------------------- derivations */

const kwh = (b: BillRow) => b.energyKwh ?? 0;

/** Blended grid tariff (₹/kWh) the org actually pays, from bill totals. */
function blendedGridRate(bills: BillRow[]): number {
  const totalKwh = sum(bills.map(kwh));
  const totalInr = sum(bills.map((b) => b.totalAmountDue ?? 0));
  if (totalKwh <= 0 || totalInr <= 0) return 0;
  return round2(totalInr / totalKwh);
}

/** Peak demand (kVA≈kW) across the portfolio, from metered max demand. */
function peakKw(bills: BillRow[]): number {
  return round(Math.max(0, ...bills.map((b) => b.maxDemandKva ?? 0)));
}

/** ₹/kVA/month demand charge, derived from billed fixed charges ÷ contract demand. */
function demandRatePerKvaMonth(bills: BillRow[]): number {
  const withBoth = bills.filter((b) => (b.fixedDemandCharges ?? 0) > 0 && (b.contractDemandKva ?? 0) > 0);
  if (withBoth.length === 0) return 0;
  const rates = withBoth.map((b) => (b.fixedDemandCharges as number) / (b.contractDemandKva as number));
  return round2(sum(rates) / rates.length);
}

/** ToD peak−offpeak spread (₹/kWh) from bills, falling back to the indicative spread. */
function todSpread(bills: BillRow[]): { spread: number; indicative: boolean } {
  const withTod = bills.filter((b) => b.todPeakRate != null && b.todOffPeakRate != null);
  if (withTod.length === 0) return { spread: IEX_PEAK_OFFPEAK_SPREAD_INR, indicative: true };
  const spreads = withTod.map((b) => (b.todPeakRate as number) - (b.todOffPeakRate as number));
  return { spread: Math.max(0, round2(sum(spreads) / spreads.length)), indicative: false };
}

export function ghgScopes(input: MarketsInput): GhgScope[] {
  const { bills, ghg } = input;
  const totalKwh = sum(bills.map(kwh));
  const scope2 = round(totalKwh * GRID_FACTOR_TCO2E_PER_KWH);

  // Per-DISCOM Scope-2 breakdown, proportional to each grid's metered kWh.
  const byDiscom = new Map<string, number>();
  for (const b of bills) {
    const d = (b.discom ?? "").trim() || "Unattributed grid";
    byDiscom.set(d, (byDiscom.get(d) ?? 0) + kwh(b));
  }
  const sources = [...byDiscom.entries()]
    .filter(([, k]) => k > 0)
    .map(([d, k]) => ({ name: `Grid — ${d}`, tco2e: round(k * GRID_FACTOR_TCO2E_PER_KWH) }))
    .sort((a, b) => b.tco2e - a.tco2e);

  // Scope 1 & 3 are not derivable from electricity bills — they come from the
  // org's recorded GHG inventory (latest year), or 0 when none is recorded.
  const latest = [...ghg].sort((a, b) => b.year - a.year)[0];
  const scope1 = latest?.scope1 ?? 0;
  const scope3 = latest?.scope3 ?? 0;

  return [
    {
      scope: "Scope 1",
      note: "Direct — from recorded inventory (DG, refrigerants)",
      tco2e: scope1,
      sources: scope1 > 0 ? [{ name: "Recorded direct emissions", tco2e: scope1 }] : [],
    },
    {
      scope: "Scope 2",
      note: "Purchased electricity — auto from your bills",
      tco2e: scope2,
      sources,
    },
    {
      scope: "Scope 3",
      note: "Value chain — from recorded inventory",
      tco2e: scope3,
      sources: scope3 > 0 ? [{ name: "Recorded value-chain emissions", tco2e: scope3 }] : [],
    },
  ];
}

export function openAccess(input: MarketsInput): OpenAccess {
  const { bills, buildings } = input;
  const loadKw = round(
    Math.max(
      0,
      ...buildings.map((b) => b.sanctionedLoadKw ?? 0),
      ...bills.map((b) => b.sanctionedLoadKw ?? 0),
    ),
  );
  const billsWithKwh = bills.filter((b) => kwh(b) > 0);
  const monthlyKwh = billsWithKwh.length ? round(sum(billsWithKwh.map(kwh)) / billsWithKwh.length) : 0;
  const totalKwh = sum(bills.map(kwh));

  // Per-kWh charges derived from real bill line-items where present.
  const perKwh = (pick: (b: BillRow) => number | null) =>
    totalKwh > 0 ? round2(sum(bills.map((b) => pick(b) ?? 0)) / totalKwh) : 0;

  const charges: OpenAccess["charges"] = [
    { name: "Cross-subsidy surcharge", rate: perKwh((b) => b.crossSubsidySurcharge) },
    { name: "Additional surcharge", rate: perKwh((b) => b.additionalSurcharge) },
    { name: "Wheeling charge", rate: perKwh((b) => b.wheelingCharges) },
    // Transmission + losses are not itemised on the bill — indicative defaults.
    { name: "Transmission charge", rate: 0.25, indicative: true },
    { name: "Losses (~4%)", rate: 0.17, indicative: true },
  ];

  return {
    eligible: loadKw >= OA_ELIGIBILITY_KW,
    loadKw,
    monthlyKwh,
    gridRateINR: blendedGridRate(bills),
    exchangeRateINR: IEX_INDICATIVE_INR_PER_KWH, // indicative — no live IEX feed yet
    charges,
    steps: ["Eligibility", "State charges", "SLDC NOC", "Scheduling"],
  };
}

export function carbonCredits(input: MarketsInput): CarbonCredits {
  const { bills, buildings } = input;
  const scope2 = round(sum(bills.map(kwh)) * GRID_FACTOR_TCO2E_PER_KWH);
  const totalInr = sum(bills.map((b) => b.totalAmountDue ?? 0));
  const totalSavings = sum(buildings.map((b) => b.savingsInr));
  // Avoided-emissions potential: the fraction of spend the diagnosis can recover
  // maps to a like fraction of Scope-2 emissions avoided → 1 credit per tCO2e.
  const reductionRatio = totalInr > 0 ? clamp(totalSavings / totalInr, 0, 0.3) : 0;
  const potential = round(scope2 * reductionRatio);

  const projects = buildings
    .filter((b) => b.savingsInr > 0)
    .sort((a, b) => b.savingsInr - a.savingsInr)
    .slice(0, 6)
    .map((b) => ({
      name: `${b.discom} site — efficiency`,
      credits: totalSavings > 0 ? round((b.savingsInr / totalSavings) * potential) : 0,
    }))
    .filter((p) => p.credits > 0);

  return {
    source: "estimated", // potential from avoided emissions — not a registry holding
    asOf: "estimated",
    held: potential,
    retired: 0,
    ccPriceINR: CCC_INDICATIVE_INR, // indicative spot — no registry feed yet
    projects,
  };
}

export function bess(input: MarketsInput): Bess {
  const { bills } = input;
  const peak = peakKw(bills);
  const recommendedKw = round(peak * BESS_PEAK_SHAVE_FRACTION);
  const recommendedKwh = recommendedKw * BESS_DURATION_H;
  const demandRate = demandRatePerKvaMonth(bills);
  const { spread } = todSpread(bills);

  const demandSavingINR = round(recommendedKw * demandRate * 12);
  const arbitrageSavingINR = round(recommendedKwh * BESS_CYCLES_PER_YEAR * spread * BESS_ROUNDTRIP);
  const capexINR = recommendedKwh * BESS_CAPEX_INR_PER_KWH;
  const annual = demandSavingINR + arbitrageSavingINR;
  const paybackYrs = annual > 0 ? round2(capexINR / annual) : 0;

  return { peakKw: peak, recommendedKw, recommendedKwh, capexINR, demandSavingINR, arbitrageSavingINR, paybackYrs };
}

const isType = (e: EquipmentRow, re: RegExp) => re.test(e.type) || re.test(e.type.toLowerCase());
const ratedKw = (es: EquipmentRow[]) => sum(es.map((e) => e.ratingKw ?? 0));

export function microgrid(input: MarketsInput): Microgrid {
  const { bills, buildings, equipment } = input;
  const solarKw = ratedKw(equipment.filter((e) => isType(e, /solar|pv/i)));
  const dgKw = ratedKw(equipment.filter((e) => isType(e, /dg|diesel|genset|generator/i)));
  const gridKva = round(
    Math.max(0, ...buildings.map((b) => b.contractDemandKva ?? b.sanctionedLoadKw ?? 0)),
  );
  const totalKwh = sum(bills.map(kwh));
  const solarKwh = solarKw * SOLAR_CUF * HOURS_PER_YEAR;
  const renewableSharePct = totalKwh > 0 ? clamp(round((100 * solarKwh) / totalKwh), 0, 100) : 0;

  const batteryKw = bess(input).recommendedKw;
  const batteryKwh = bess(input).recommendedKwh;
  const criticalLoadKw = Math.max(1, round(peakKw(bills) * 0.3));
  const islandingHours = batteryKwh > 0 ? round2(batteryKwh / criticalLoadKw) : 0;

  const components: Microgrid["components"] = [];
  if (solarKw > 0) components.push({ name: "Rooftop solar", spec: `${round(solarKw)} kWp` });
  if (batteryKw > 0) components.push({ name: "Battery storage", spec: `${batteryKw} kW / ${batteryKwh} kWh` });
  if (dgKw > 0) components.push({ name: "DG backup", spec: `${round(dgKw)} kW` });
  if (gridKva > 0) components.push({ name: "Grid connection", spec: `${gridKva} kVA` });

  const reliabilityPct = components.length >= 3 ? 99.95 : components.length > 0 ? 99.5 : 0;
  return { islandingHours, reliabilityPct, renewableSharePct, components };
}

export function vpp(input: MarketsInput): Vpp {
  const { buildings, equipment } = input;
  const solarKw = round(ratedKw(equipment.filter((e) => isType(e, /solar|pv/i))));
  const flexKw = round(ratedKw(equipment.filter((e) => isType(e, /hvac|chiller|ev|pump|motor/i))));
  const batteryKw = bess(input).recommendedKw;

  const der: Vpp["der"] = [];
  if (solarKw > 0) der.push({ name: "Solar", kw: solarKw });
  if (batteryKw > 0) der.push({ name: "Battery", kw: batteryKw });
  if (flexKw > 0) der.push({ name: "Flexible loads (HVAC / EV / motors)", kw: flexKw });

  const dispatchableKw = sum(der.map((d) => d.kw));
  return {
    sites: buildings.length,
    dispatchableKw,
    drEventsYTD: 0, // no demand-response programme enrolled yet — honest zero
    drRevenueINR: 0,
    der,
  };
}
