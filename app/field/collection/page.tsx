import { api } from "@/lib/api";
import { CollectionRoute } from "@/components/field/collection-route";

export const metadata = { title: "Collection" };

export default async function CollectionPage() {
  const stops = await api.field.collectionStops();
  return <CollectionRoute initialStops={stops} />;
}
