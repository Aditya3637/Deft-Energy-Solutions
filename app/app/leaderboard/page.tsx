import { Trophy, Award, Gift, Star } from "lucide-react";

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
import { StatCard } from "@/components/app/stat-card";
import { api } from "@/lib/api";
import { formatIndianNumber } from "@/lib/format";

export const metadata = { title: "Rewards" };

export default async function LeaderboardPage() {
  const [BUILDINGS, BADGES, REWARDS] = await Promise.all([
    api.portfolio.buildings(),
    api.ecosystem.badges(),
    api.ecosystem.rewards(),
  ]);
  // Lower EPI ranks higher; points scale with savings captured.
  const ranked = [...BUILDINGS]
    .sort((a, b) => a.epi - b.epi)
    .map((b, i) => ({ ...b, rank: i + 1, points: Math.round(b.savingsINR / 1000) }));
  const earnedBadges = BADGES.filter((b) => b.earned).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Rewards" description="Leaderboards, badges and points to keep teams engaged." />

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Building rankings</CardTitle>
              <CardDescription>By Energy Performance Index — lower is better.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {ranked.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        b.rank <= 3
                          ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
                          : "flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
                      }
                    >
                      {b.rank}
                    </span>
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-muted-foreground">{b.city} · EPI {b.epi}</div>
                    </div>
                  </div>
                  <span className="font-semibold text-primary">{formatIndianNumber(b.points)} pts</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Points balance" value={formatIndianNumber(REWARDS.points)} icon={Star} tone="success" />
            <StatCard label="Tier" value={REWARDS.tier} icon={Award} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Redeem</CardTitle>
              <CardDescription>Spend points on platform credit and partner perks.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {REWARDS.redeemable.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="flex items-center gap-2 text-sm">
                    <Gift className="h-4 w-4 text-muted-foreground" /> {r.name}
                  </span>
                  <DemoButton
                    variant="outline"
                    size="sm"
                    disabled={REWARDS.points < r.cost}
                    toastTitle="Reward redeemed"
                    toastDescription={`${r.name} — applied to your account (demo).`}
                  >
                    {formatIndianNumber(r.cost)} pts
                  </DemoButton>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((b) => (
              <Card key={b.id} className={b.earned ? "" : "opacity-60"}>
                <CardContent className="flex items-start gap-3 pt-6">
                  <span
                    className={
                      b.earned
                        ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                        : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    }
                  >
                    <Trophy className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{b.name}</h3>
                      {b.earned && <Badge variant="success">Earned</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{earnedBadges} of {BADGES.length} badges earned.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
