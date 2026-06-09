import { notFound } from "next/navigation";

import { api } from "@/lib/api";
import { WorkOrderDetail } from "@/components/field/work-order-detail";

export async function generateStaticParams() {
  const workOrders = await api.field.workOrders();
  return workOrders.map((w) => ({ id: w.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wo = await api.field.workOrder(id);
  return { title: wo ? wo.title : "Work order" };
}

export default async function WorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wo = await api.field.workOrder(id);
  if (!wo) notFound();
  return <WorkOrderDetail wo={wo} />;
}
