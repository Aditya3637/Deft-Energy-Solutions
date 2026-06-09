/** Efficiency (ECM) fixtures — mirror of the server's EfficiencyResult shape. */

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

/** Demo portfolio (~5.2M kWh/yr @ ₹8/kWh) for the static build / anonymous demo. */
export const EFFICIENCY_FIXTURE: EfficiencyResult = {
  totalKwh: 5_200_000,
  blendedRateInr: 8,
  annualKwhSaved: 1_300_000,
  annualSavingInr: 10_400_000,
  pctOfConsumption: 25,
  measures: [
    { id: "vfd", name: "VFDs on motors & drives", category: "Motors", annualKwhSaved: 416_000, annualSavingInr: 3_328_000, capexInr: 8_320_000, paybackYrs: 2.5, note: "Variable-speed drives on pumps, fans, compressors and conveyors." },
    { id: "hvac", name: "HVAC optimisation & efficient chillers", category: "HVAC", annualKwhSaved: 312_000, annualSavingInr: 2_496_000, capexInr: 7_488_000, paybackYrs: 3.0, note: "High-COP chillers, economisers and setpoint tuning." },
    { id: "led", name: "LED lighting retrofit", category: "Lighting", annualKwhSaved: 234_000, annualSavingInr: 1_872_000, capexInr: 3_369_600, paybackYrs: 1.8, note: "LED + occupancy/daylight sensors across sites." },
    { id: "compressed-air", name: "Compressed-air leak fix & optimisation", category: "Compressed air", annualKwhSaved: 156_000, annualSavingInr: 1_248_000, capexInr: 1_872_000, paybackYrs: 1.5, note: "Leak survey, pressure right-sizing, sequencing." },
    { id: "bms", name: "Smart controls / BMS scheduling", category: "Controls", annualKwhSaved: 104_000, annualSavingInr: 832_000, capexInr: 2_080_000, paybackYrs: 2.5, note: "Schedule HVAC/lighting to occupancy; kill standby load." },
    { id: "process", name: "Process & waste-heat recovery", category: "Process", annualKwhSaved: 78_000, annualSavingInr: 624_000, capexInr: 2_184_000, paybackYrs: 3.5, note: "Recover flue/condensate heat; optimise furnaces and boilers." },
  ],
};
