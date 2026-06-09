import * as M from "@/lib/mock/field";

export type {
  WorkOrder,
  WoStatus,
  WoType,
  WoPriority,
  ChecklistItem,
  Measurement,
  AuditSection,
  Stop,
  StopStatus,
} from "@/lib/mock/field";
export const AUDIT_META = M.AUDIT_META;
export const AUDIT_SECTIONS = M.AUDIT_SECTIONS;

export const field = {
  workOrders: async (): Promise<M.WorkOrder[]> => M.WORK_ORDERS,
  workOrder: async (id: string): Promise<M.WorkOrder | undefined> => M.getWorkOrder(id),
  auditMeasurements: async (): Promise<M.Measurement[]> => M.AUDIT_MEASUREMENTS,
  collectionStops: async (): Promise<M.Stop[]> => M.COLLECTION_STOPS,
};
