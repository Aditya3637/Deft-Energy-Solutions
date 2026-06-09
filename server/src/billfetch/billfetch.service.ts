import { Injectable } from "@nestjs/common";

import { FIELD_DEFS } from "../extract/bill-field-defs";
import { type ExtractedField, mergeRawFields } from "../extract/fields";
import { BILLERS, type Biller, billerById } from "./biller-catalog";
import { BillFetchError, type FetchSource } from "./billfetch-core";
import { fetchBill, fetchSource, isConfigured, providerName } from "./provider";

export type FetchResult = {
  fields: ExtractedField[];
  billerName: string;
  found: number;
  total: number;
  lowConfidence: string[];
  provider: string;
  /** "bbps" = live aggregator; "bbps-demo" = built-in stub. */
  source: FetchSource;
  /** BBPS returns a summary, not all 42 fields — upload the bill for full diagnosis. */
  summary: true;
};

@Injectable()
export class BillFetchService {
  isConfigured(): boolean {
    return isConfigured();
  }

  billers(): Biller[] {
    return BILLERS;
  }

  async fetch(billerId: string, params: Record<string, string>): Promise<FetchResult> {
    const biller = billerById(billerId);
    if (!biller) throw new BillFetchError(`Unknown biller '${billerId}'.`, 400);

    const raw = await fetchBill(biller, params ?? {});
    const { fields, lowConfidence, found } = mergeRawFields(raw);

    return {
      fields,
      billerName: biller.discom,
      found,
      total: FIELD_DEFS.length,
      lowConfidence,
      provider: providerName(),
      source: fetchSource(),
      summary: true,
    };
  }
}
