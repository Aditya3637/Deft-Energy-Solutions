import { api } from "@/lib/api";
import { PageHeader } from "@/components/app/page-header";
import { CapexApprovals } from "@/components/app/capex-approvals";

export const metadata = { title: "CAPEX approvals" };

export default async function CapexPage() {
  const requests = await api.capex.requests();
  return (
    <div className="space-y-6">
      <PageHeader
        title="CAPEX approvals"
        description="Investment requests routed Facility Mgr → Energy Mgr → CFO → Board."
      />
      <CapexApprovals initialRequests={requests} />
    </div>
  );
}
