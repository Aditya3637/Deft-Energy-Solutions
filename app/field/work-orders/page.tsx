import { WorkOrdersList } from "@/components/field/work-orders-list";

export const metadata = { title: "Work orders" };

export default function WorkOrdersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Work orders</h1>
      <WorkOrdersList />
    </div>
  );
}
