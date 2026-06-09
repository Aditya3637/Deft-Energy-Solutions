/**
 * Commission money-math invariants (runs in CI — `ts-node --transpile-only`).
 * Real money rides on commissionPaise(); these lock its guarantees against
 * regression. Exits non-zero on any failure.
 */

import { commissionPaise, type CommissionModel } from "../src/collections/money";

const base: CommissionModel = {
  type: "PERCENT", perTxnPaise: 0, rateBps: 0, currentBps: 0, outstandingBps: 0, capPaise: 0, minPaise: 0,
};
const L = 10_000_000; // ₹1,00,000 in paise

let failures = 0;
function check(cond: boolean, msg: string): void {
  if (cond) console.log(`  ok   ${msg}`);
  else {
    console.error(`  FAIL ${msg}`);
    failures += 1;
  }
}

console.log("Collection commission invariants:");

// PERCENT: 1% (100 bps) of ₹1,00,000 = ₹1,000 (100000 paise), exact integer.
check(commissionPaise({ ...base, type: "PERCENT", rateBps: 100 }, L) === 100_000, "PERCENT 1% of ₹1L = ₹1,000");

// PERCENT floors (never rounds up): 0.33% of 100 paise = 0.33 → 0.
check(commissionPaise({ ...base, type: "PERCENT", rateBps: 33 }, 100) === 0, "PERCENT floors sub-paise to 0");

// PER_TXN: flat regardless of amount, but never exceeds the amount collected.
check(commissionPaise({ ...base, type: "PER_TXN", perTxnPaise: 1000 }, L) === 1000, "PER_TXN flat ₹10 on a large bill");
check(commissionPaise({ ...base, type: "PER_TXN", perTxnPaise: 1000 }, 500) === 500, "PER_TXN clamps to the amount when amount < flat");

// PERCENT cap: 1% of ₹1L = ₹1,000, capped at ₹20.
check(commissionPaise({ ...base, type: "PERCENT", rateBps: 100, capPaise: 2000 }, L) === 2000, "PERCENT cap respected");

// PERCENT_SPLIT: current vs arrears rate selected by isOutstanding.
const split: CommissionModel = { ...base, type: "PERCENT_SPLIT", currentBps: 500, outstandingBps: 1000 };
check(commissionPaise(split, L, false) === 500_000, "PERCENT_SPLIT current = 5%");
check(commissionPaise(split, L, true) === 1_000_000, "PERCENT_SPLIT arrears = 10%");

// min floor applies only when commission is actually due.
check(commissionPaise({ ...base, type: "PERCENT", rateBps: 1, minPaise: 500 }, L) === 1000, "min not applied below... raw 1000 > min 500 → 1000");
check(commissionPaise({ ...base, type: "PERCENT", rateBps: 0, minPaise: 500 }, L) === 0, "min NOT applied when nothing is due (0%)");

// never negative; zero amount → zero; output is an integer.
check(commissionPaise({ ...base, type: "PERCENT", rateBps: 100 }, 0) === 0, "zero amount → zero commission");
check(Number.isInteger(commissionPaise({ ...base, type: "PERCENT", rateBps: 137 }, 1_234_567)), "commission is always an integer paise");

if (failures > 0) {
  console.error(`\n${failures} commission invariant(s) failed.`);
  process.exit(1);
}
console.log("\nAll commission invariants hold.");
