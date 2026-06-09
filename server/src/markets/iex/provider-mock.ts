import { aggregates, type IexQuote } from "./iex-core";

/**
 * Indicative day-ahead reference (typical Indian DAM shape). Works with no
 * account; the UI labels it "indicative" until a real feed is configured.
 */
const REFERENCE_BLOCKS = [
  { h: "00", p: 2.9 },
  { h: "02", p: 2.7 },
  { h: "04", p: 3.1 },
  { h: "06", p: 4.4 },
  { h: "08", p: 5.6 },
  { h: "10", p: 4.9 },
  { h: "12", p: 4.2 },
  { h: "14", p: 4.0 },
  { h: "16", p: 4.8 },
  { h: "18", p: 8.9 },
  { h: "20", p: 7.6 },
  { h: "22", p: 4.3 },
];

export function iexMockQuote(): IexQuote {
  return {
    ...aggregates(REFERENCE_BLOCKS),
    blocks: REFERENCE_BLOCKS,
    asOf: "indicative reference",
    source: "indicative",
  };
}
