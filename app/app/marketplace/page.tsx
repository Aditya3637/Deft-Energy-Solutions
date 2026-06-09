import { Star, Store, FileText, Gavel, Trophy } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoButton } from "@/components/ui/demo-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/page-header";
import { api } from "@/lib/api";
import { formatRupees, formatRupeesCompact } from "@/lib/format";

export const metadata = { title: "Marketplace" };

const rfqVariant = { open: "secondary", evaluating: "warning", awarded: "success" } as const;

export default async function MarketplacePage() {
  const [VENDORS, RFQS, REVERSE_AUCTION] = await Promise.all([
    api.ecosystem.vendors(),
    api.ecosystem.rfqs(),
    api.ecosystem.reverseAuction(),
  ]);
  const lowestTco = REVERSE_AUCTION.bids.length
    ? Math.min(...REVERSE_AUCTION.bids.map((b) => b.tcoINR))
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketplace" description="Vetted vendors, RFQs and competitive reverse auctions." />

      <Tabs defaultValue="vendors">
        <TabsList>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="rfqs">RFQs</TabsTrigger>
          <TabsTrigger value="auction">Reverse auction</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {VENDORS.map((v) => (
              <Card key={v.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{v.name}</h3>
                      <p className="text-sm text-muted-foreground">{v.category} · {v.location}</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium">
                      <Star className="h-4 w-4 fill-warning text-warning" /> {v.rating}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{v.jobs} jobs completed</span>
                    <DemoButton variant="outline" size="sm" toastTitle="Quote requested" toastDescription={`We'll route your RFQ to ${v.name}.`}>
                      Request quote
                    </DemoButton>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rfqs" className="space-y-3">
          {RFQS.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div>
                  <h3 className="font-medium">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.category} · closes {r.closes}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{r.bids} bids</span>
                  <Badge variant={rfqVariant[r.status]} className="capitalize">{r.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="auction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gavel className="h-4 w-4 text-primary" /> {REVERSE_AUCTION.title}
              </CardTitle>
              <CardDescription>Sealed bids ranked by total cost of ownership · closes in {REVERSE_AUCTION.closesIn}</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {REVERSE_AUCTION.bids.length === 0 && (
                <p className="py-2 text-sm text-muted-foreground">
                  No bids yet — invite vendors to bid on this request. Competitive bidding ships at Stage F.
                </p>
              )}
              {REVERSE_AUCTION.bids
                .slice()
                .sort((a, b) => a.tcoINR - b.tcoINR)
                .map((b, i) => (
                  <div key={b.vendor} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">{i + 1}</span>
                      <div>
                        <div className="font-medium">{b.vendor}</div>
                        <div className="text-xs text-muted-foreground">{b.deliveryWeeks} weeks · bid {formatRupees(b.amountINR)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <div className="font-semibold">{formatRupeesCompact(b.tcoINR)}</div>
                        <div className="text-xs text-muted-foreground">TCO</div>
                      </div>
                      {b.tcoINR === lowestTco && <Badge variant="success" className="gap-1"><Trophy className="h-3 w-3" /> Best</Badge>}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <DemoButton toastTitle="Bid awarded" toastDescription="Purchase-order workflow ships at Stage F.">
              Award to best bid
            </DemoButton>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
