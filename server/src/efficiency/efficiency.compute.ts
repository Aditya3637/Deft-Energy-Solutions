/**
 * Efficiency engine (the "Reduce" rung) — DERIVED from the org's real data.
 *
 * The diagnosis engine recovers money already lost on the bill; this engine
 * estimates money saved by consuming LESS — energy-conservation measures (ECMs)
 * matched to the org's actual consumption and building mix. Pure + deterministic
 * (CI-tested), same no-fabrication discipline: savings = real kWh × the org's
 * blended ₹/kWh × an industry-benchmark reduction; capex is derived from a
 * benchmark payback, and everything is clearly an *estimate* (capex-led), never
 * presented as guaranteed like a billing-error recovery.
 *
 * To avoid double-counting with the 58-check diagnosis, ECMs here are strictly
 * consumption-reduction (lighting, HVAC, motors, compressed air, …) — NOT power
 * factor / contract demand / tariff / ToD, which the diagnosis already covers.
 */

export type BuildingKind = "INDUSTRIAL" | "COMMERCIAL";

export type Ecm = {
  id: string;
  name: string;
  category: string;
  /** Fraction of TOTAL consumption this measure typically saves (de-conflicted per type). */
  pctOfTotal: number;
  /** Industry-benchmark simple payback (years) → capex is derived from savings × this. */
  paybackYrs: number;
  note: string;
};

/**
 * ECM libraries by building kind. The pcts are non-overlapping within a kind so
 * they sum safely (commercial ≈ 25%, industrial ≈ 26% of total — both sane
 * ceilings for a full retrofit programme).
 */
const LIBRARY: Record<BuildingKind, Ecm[]> = {
  COMMERCIAL: [
    { id: "hvac", name: "HVAC optimisation & efficient chillers", category: "HVAC", pctOfTotal: 0.08, paybackYrs: 3.0, note: "Cooling is the largest commercial load — high-COP chillers, economisers, setpoint tuning." },
    { id: "led", name: "LED lighting retrofit", category: "Lighting", pctOfTotal: 0.06, paybackYrs: 1.8, note: "Replace tube/CFL/HID with LED + occupancy/daylight sensors." },
    { id: "bms", name: "Smart controls / BMS scheduling", category: "Controls", pctOfTotal: 0.04, paybackYrs: 2.5, note: "Schedule HVAC/lighting to occupancy; kill standby and after-hours load." },
    { id: "vfd", name: "VFDs on pumps & fans", category: "Motors", pctOfTotal: 0.03, paybackYrs: 2.5, note: "Variable-speed drives on AHU fans and chilled/condenser-water pumps." },
    { id: "envelope", name: "Cool roof & building envelope", category: "Envelope", pctOfTotal: 0.02, paybackYrs: 5.0, note: "Reflective roof + glazing film cut the cooling load at source." },
    { id: "refrigeration", name: "Refrigeration efficiency", category: "Refrigeration", pctOfTotal: 0.02, paybackYrs: 3.0, note: "EC fans, floating head pressure, door/seal fixes for retail & kitchens." },
  ],
  INDUSTRIAL: [
    { id: "vfd", name: "VFDs on motors & drives", category: "Motors", pctOfTotal: 0.10, paybackYrs: 2.5, note: "Variable-speed drives on pumps, fans, compressors and conveyors." },
    { id: "compressed-air", name: "Compressed-air leak fix & optimisation", category: "Compressed air", pctOfTotal: 0.05, paybackYrs: 1.5, note: "Leak survey, pressure right-sizing, sequencing — often the fastest payback." },
    { id: "process", name: "Process & waste-heat recovery", category: "Process", pctOfTotal: 0.04, paybackYrs: 3.5, note: "Recover flue/condensate heat; optimise furnaces, boilers and ovens." },
    { id: "led", name: "High-bay LED lighting", category: "Lighting", pctOfTotal: 0.03, paybackYrs: 1.8, note: "LED high-bays + zoning for sheds and shop floors." },
    { id: "hvac", name: "Ventilation & HVAC optimisation", category: "HVAC", pctOfTotal: 0.02, paybackYrs: 3.0, note: "Right-size ventilation and space cooling for occupied zones." },
    { id: "pumping", name: "Pumping system optimisation", category: "Motors", pctOfTotal: 0.02, paybackYrs: 2.0, note: "Trim impellers, fix throttling, sequence pumps to demand." },
  ],
};

/** Aggregate kWh saved is capped at this share of consumption — a realistic ceiling. */
const MAX_REDUCTION_FRACTION = 0.3;

export type BillRow = { energyKwh: number | null; totalAmountDue: number | null; buildingId: string | null };
export type BuildingRow = { id: string; type: string };

export type EfficiencyInput = { bills: BillRow[]; buildings: BuildingRow[] };

export type EcmResult = {
  id: string;
  name: string;
  category: string;
  annualKwhSaved: number;
  annualSavingInr: number;
  capexInr: number;
  paybackYrs: number;
  note: string;
};

export type EfficiencyResult = {
  totalKwh: number;
  blendedRateInr: number;
  annualKwhSaved: number;
  annualSavingInr: number;
  pctOfConsumption: number;
  measures: EcmResult[];
};

const round = (n: number) => Math.round(n);
const round2 = (n: number) => Math.round(n * 100) / 100;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

function kindOf(type: string): BuildingKind {
  return type === "INDUSTRIAL" ? "INDUSTRIAL" : "COMMERCIAL";
}

export function computeEfficiency(input: EfficiencyInput): EfficiencyResult {
  const typeById = new Map(input.buildings.map((b) => [b.id, kindOf(b.type)]));

  // Real consumption grouped by building kind (bills with no building → COMMERCIAL).
  const kwhByKind = new Map<BuildingKind, number>();
  let totalKwh = 0;
  for (const b of input.bills) {
    const kwh = b.energyKwh ?? 0;
    if (kwh <= 0) continue;
    const kind = (b.buildingId && typeById.get(b.buildingId)) || "COMMERCIAL";
    kwhByKind.set(kind, (kwhByKind.get(kind) ?? 0) + kwh);
    totalKwh += kwh;
  }

  const totalInr = sum(input.bills.map((b) => b.totalAmountDue ?? 0));
  const blendedRateInr = totalKwh > 0 && totalInr > 0 ? round2(totalInr / totalKwh) : 0;

  // Match ECMs per kind, aggregate by ECM id across kinds.
  const acc = new Map<string, EcmResult>();
  for (const [kind, kwh] of kwhByKind) {
    for (const ecm of LIBRARY[kind]) {
      const kwhSaved = kwh * ecm.pctOfTotal;
      const savingInr = kwhSaved * blendedRateInr;
      if (savingInr <= 0 && kwhSaved <= 0) continue;
      const prev = acc.get(ecm.id);
      const annualKwhSaved = (prev?.annualKwhSaved ?? 0) + kwhSaved;
      const annualSavingInr = (prev?.annualSavingInr ?? 0) + savingInr;
      acc.set(ecm.id, {
        id: ecm.id,
        name: ecm.name,
        category: ecm.category,
        annualKwhSaved: round(annualKwhSaved),
        annualSavingInr: round(annualSavingInr),
        capexInr: round(annualSavingInr * ecm.paybackYrs),
        paybackYrs: ecm.paybackYrs,
        note: ecm.note,
      });
    }
  }

  let measures = [...acc.values()].filter((m) => m.annualSavingInr > 0).sort((a, b) => b.annualSavingInr - a.annualSavingInr);

  // Guardrail: never claim more than MAX_REDUCTION_FRACTION of consumption.
  let annualKwhSaved = sum(measures.map((m) => m.annualKwhSaved));
  let annualSavingInr = sum(measures.map((m) => m.annualSavingInr));
  const cap = totalKwh * MAX_REDUCTION_FRACTION;
  if (totalKwh > 0 && annualKwhSaved > cap) {
    const scale = cap / annualKwhSaved;
    measures = measures.map((m) => ({
      ...m,
      annualKwhSaved: round(m.annualKwhSaved * scale),
      annualSavingInr: round(m.annualSavingInr * scale),
      capexInr: round(m.capexInr * scale),
    }));
    annualKwhSaved = sum(measures.map((m) => m.annualKwhSaved));
    annualSavingInr = sum(measures.map((m) => m.annualSavingInr));
  }

  return {
    totalKwh: round(totalKwh),
    blendedRateInr,
    annualKwhSaved,
    annualSavingInr,
    pctOfConsumption: totalKwh > 0 ? Math.round((annualKwhSaved / totalKwh) * 100) : 0,
    measures,
  };
}
