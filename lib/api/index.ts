/**
 * The Stage D mock-API seam. Every screen reads DATA through `api.*` (async,
 * fixtures today). At Stage F the implementations call the real backend behind
 * identical signatures — no call site changes.
 *
 * Pure logic (diagnosis engine, ROI math, formatting, the loss taxonomy) is NOT
 * here — it runs client-side regardless of backend, so it stays in lib/*.
 */
import { portfolio } from "./portfolio";
import { tasks } from "./tasks";
import { alerts } from "./alerts";
import { field } from "./field";
import { sustainability } from "./sustainability";
import { capex } from "./capex";
import { markets } from "./markets";
import { ecosystem } from "./ecosystem";
import { bills } from "./bills";

export const api = {
  portfolio,
  tasks,
  alerts,
  field,
  sustainability,
  capex,
  markets,
  ecosystem,
  bills,
};

// Re-export domain types + presentation constants so call sites import only from "@/lib/api".
export * from "./portfolio";
export * from "./tasks";
export * from "./alerts";
export * from "./field";
export * from "./sustainability";
export * from "./capex";
export * from "./markets";
export * from "./ecosystem";
export * from "./bills";
