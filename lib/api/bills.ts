import * as M from "@/lib/mock/bill";

export type { ExtractedField, FieldGroup } from "@/lib/mock/bill";
export const GROUP_ORDER = M.GROUP_ORDER;

export const bills = {
  /** The sample bill returned by the preview "extraction" (Stage G: real OCR). */
  sample: async (): Promise<M.ExtractedField[]> => M.SAMPLE_FIELDS.map((f) => ({ ...f })),
};
