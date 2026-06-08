import { notFound } from "next/navigation";

import { WORK_ORDERS, getWorkOrder } from "@/lib/mock/field";
import { WorkOrderDetail } from "@/components/field/work-order-detail";

export function generateStaticParams() {
  return WORK_ORDERS.map((w) => ({ id: w.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wo = getWorkOrder(id);
  return { title: wo ? wo.title : "Work order" };
}

export default async function WorkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wo = getWorkOrder(id);
  if (!wo) notFound();
  return <WorkOrderDetail wo={wo} />;
}
