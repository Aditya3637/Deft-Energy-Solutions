import { api } from "@/lib/api";
import { AuditCapture } from "@/components/field/audit-capture";

export const metadata = { title: "On-site audit" };

export default async function AuditPage() {
  const measurements = await api.field.auditMeasurements();
  return <AuditCapture measurements={measurements} />;
}
