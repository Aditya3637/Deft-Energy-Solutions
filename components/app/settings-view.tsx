"use client";

import * as React from "react";
import { Mail, MessageSquare, Smartphone, Bell } from "lucide-react";

import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/mock/ecosystem";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const CHANNELS = [
  { id: "email", label: "Email", icon: Mail, on: true },
  { id: "sms", label: "SMS", icon: Smartphone, on: false },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, on: true },
  { id: "push", label: "Push", icon: Bell, on: true },
];

export function SettingsView() {
  const [lang, setLang] = React.useState(LANGUAGES[0]);
  const [channels, setChannels] = React.useState<Record<string, boolean>>(
    Object.fromEntries(CHANNELS.map((c) => [c.id, c.on])),
  );

  return (
    <Tabs defaultValue="org">
      <TabsList>
        <TabsTrigger value="org">Organisation</TabsTrigger>
        <TabsTrigger value="language">Language</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="org">
        <Card>
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
            <CardDescription>Basic details for your account.</CardDescription>
          </CardHeader>
          <CardContent className="grid max-w-md gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Organisation name</Label>
              <Input id="org-name" defaultValue="Acme Industries" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-gst">GSTIN</Label>
              <Input id="org-gst" defaultValue="27ABCDE1234F1Z5" />
            </div>
            <div className="flex justify-end">
              <Button>Save changes</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ML01 Localisation */}
      <TabsContent value="language">
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>
              Choose the platform language. English now; regional languages roll out with the i18n layer.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={cn(
                  "flex items-center justify-between rounded-md border px-4 py-2.5 text-left text-sm transition-colors",
                  lang === l ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50",
                )}
              >
                {l}
                {lang === l && <span className="text-xs text-primary">Selected</span>}
              </button>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Where alerts and reports are delivered.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {CHANNELS.map((c) => {
              const Icon = c.icon;
              const on = channels[c.id];
              return (
                <div key={c.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground" /> {c.label}
                  </span>
                  <Button
                    variant={on ? "secondary" : "outline"}
                    size="sm"
                    aria-pressed={on}
                    onClick={() => setChannels((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                  >
                    {on ? "On" : "Off"}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
