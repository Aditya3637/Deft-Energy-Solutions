import { ClipboardList } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";

export const metadata = { title: "Field" };

export default function FieldHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Today</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned to you</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ClipboardList}
            title="Nothing assigned yet"
            description="Work orders and audit tasks for your sites will show up here, ready for offline use."
          />
        </CardContent>
      </Card>
    </div>
  );
}
