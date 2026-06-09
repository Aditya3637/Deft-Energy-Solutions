/**
 * DISCOM / biller catalog for the BBPS-style fetch channel.
 *
 * `bbpsBillerId` is intentionally null in the seed — real BBPS biller IDs come
 * from your aggregator's biller directory (each aggregator exposes a "list
 * billers" call) and should be filled per deployment, or resolved at runtime by
 * the bbps provider. `params` declares the customer inputs a biller needs
 * (BBPS billers publish required params; most electricity billers need just the
 * consumer/account number).
 */

export type BillerParam = {
  name: string;
  label: string;
  placeholder?: string;
};

export type Biller = {
  id: string; // our slug
  discom: string; // display name
  state: string;
  bbpsBillerId: string | null; // fill from aggregator directory for live fetch
  params: BillerParam[];
};

const CONSUMER = (placeholder = "e.g. 0123456789"): BillerParam[] => [
  { name: "consumerNumber", label: "Consumer number", placeholder },
];

export const BILLERS: Biller[] = [
  { id: "msedcl", discom: "MSEDCL (Mahavitaran)", state: "Maharashtra", bbpsBillerId: null, params: CONSUMER("12-digit consumer no.") },
  { id: "adani-mumbai", discom: "Adani Electricity Mumbai", state: "Maharashtra", bbpsBillerId: null, params: CONSUMER() },
  { id: "tata-power-mumbai", discom: "Tata Power Mumbai", state: "Maharashtra", bbpsBillerId: null, params: CONSUMER() },
  { id: "bescom", discom: "BESCOM", state: "Karnataka", bbpsBillerId: null, params: [{ name: "consumerNumber", label: "Account ID", placeholder: "account ID" }] },
  { id: "tangedco", discom: "TANGEDCO", state: "Tamil Nadu", bbpsBillerId: null, params: CONSUMER() },
  { id: "tpddl", discom: "Tata Power-DDL", state: "Delhi", bbpsBillerId: null, params: [{ name: "consumerNumber", label: "CA number", placeholder: "CA number" }] },
  { id: "bses-rajdhani", discom: "BSES Rajdhani", state: "Delhi", bbpsBillerId: null, params: [{ name: "consumerNumber", label: "CA number", placeholder: "CA number" }] },
  { id: "bses-yamuna", discom: "BSES Yamuna", state: "Delhi", bbpsBillerId: null, params: [{ name: "consumerNumber", label: "CA number", placeholder: "CA number" }] },
  { id: "uppcl", discom: "UPPCL", state: "Uttar Pradesh", bbpsBillerId: null, params: [{ name: "consumerNumber", label: "Account number", placeholder: "account number" }] },
  { id: "torrent", discom: "Torrent Power", state: "Gujarat / Maharashtra", bbpsBillerId: null, params: [{ name: "consumerNumber", label: "Service number", placeholder: "service number" }] },
  { id: "dgvcl", discom: "DGVCL (Gujarat)", state: "Gujarat", bbpsBillerId: null, params: CONSUMER() },
  { id: "cesc", discom: "CESC Kolkata", state: "West Bengal", bbpsBillerId: null, params: CONSUMER() },
  { id: "pspcl", discom: "PSPCL", state: "Punjab", bbpsBillerId: null, params: [{ name: "consumerNumber", label: "Account number", placeholder: "account number" }] },
  { id: "tsspdcl", discom: "TSSPDCL", state: "Telangana", bbpsBillerId: null, params: [{ name: "consumerNumber", label: "Unique service no.", placeholder: "USC number" }] },
  { id: "apspdcl", discom: "APSPDCL", state: "Andhra Pradesh", bbpsBillerId: null, params: [{ name: "consumerNumber", label: "Service number", placeholder: "service number" }] },
];

const BY_ID: Record<string, Biller> = Object.fromEntries(BILLERS.map((b) => [b.id, b] as const));

export function billerById(id: string): Biller | undefined {
  return BY_ID[id];
}
