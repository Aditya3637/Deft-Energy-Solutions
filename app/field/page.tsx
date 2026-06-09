import { api } from "@/lib/api";
import { FieldHome } from "@/components/field/field-home";

export const metadata = { title: "Field" };

export default async function FieldHomePage() {
  const [workOrders, stops] = await Promise.all([
    api.field.workOrders(),
    api.field.collectionStops(),
  ]);
  return <FieldHome workOrders={workOrders} stops={stops} />;
}
