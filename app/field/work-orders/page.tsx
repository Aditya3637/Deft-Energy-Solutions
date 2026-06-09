import { api } from "@/lib/api";
import { WorkOrdersList } from "@/components/field/work-orders-list";

export const metadata = { title: "Work orders" };

export default async function WorkOrdersPage() {
  const workOrders = await api.field.workOrders();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Work orders</h1>
      <WorkOrdersList workOrders={workOrders} />
    </div>
  );
}
