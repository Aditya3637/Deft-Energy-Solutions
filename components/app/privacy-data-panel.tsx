"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Download, Trash2, Save } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { account, type AccountProfile } from "@/lib/api/account";

const GRIEVANCE_EMAIL = "privacy@deftenergy.example";

export function PrivacyDataPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const [loaded, setLoaded] = React.useState(false);
  const [profile, setProfile] = React.useState<AccountProfile | null>(null);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    account.profile().then((p) => {
      setProfile(p);
      setName(p?.name ?? "");
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> Privacy &amp; your data (DPDP)
          </CardTitle>
          <CardDescription>
            Sign in to access, correct, export, or delete your personal data under the DPDP Act, 2023.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const saveName = async () => {
    setBusy("name");
    const ok = await account.correctName(name.trim() || "User");
    setBusy(null);
    toast(ok ? { title: "Name updated" } : { title: "Couldn't update", description: "Try again." });
  };
  const download = async () => {
    setBusy("export");
    const ok = await account.exportData();
    setBusy(null);
    if (!ok) toast({ title: "Export failed", description: "Try again." });
  };
  const erase = async () => {
    setBusy("delete");
    const ok = await account.erase();
    setBusy(null);
    if (ok) {
      toast({ title: "Account deleted", description: "Your data has been erased." });
      router.push("/");
    } else {
      toast({ title: "Couldn't delete", description: "Try again or contact support." });
    }
  };

  const consent = profile.consentAt ? new Date(profile.consentAt).toLocaleDateString("en-IN") : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" /> Privacy &amp; your data (DPDP)
        </CardTitle>
        <CardDescription>
          Your rights under India&rsquo;s Digital Personal Data Protection Act, 2023 — exercise them here.
          Signed in as <span className="font-medium text-foreground">{profile.email}</span>
          {profile.org ? ` · ${profile.org.name}` : ""} · consent given {consent}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Correction */}
        <div className="space-y-2">
          <Label htmlFor="dp-name">Your name (correct it anytime)</Label>
          <div className="flex gap-2">
            <Input id="dp-name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
            <Button variant="outline" onClick={saveName} disabled={busy === "name" || name.trim() === profile.name}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>

        {/* Access / portability */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
          <div>
            <div className="text-sm font-medium">Download my data</div>
            <p className="text-xs text-muted-foreground">A machine-readable copy of your data (JSON).</p>
          </div>
          <Button variant="outline" onClick={download} disabled={busy === "export"}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>

        {/* Erasure */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-destructive">Delete my account &amp; data</div>
            <p className="text-xs text-muted-foreground">
              Permanently erases your account, organisation and all bills/tasks/data. Cannot be undone.
            </p>
          </div>
          {confirmDelete ? (
            <div className="flex gap-2">
              <Button variant="destructive" onClick={erase} disabled={busy === "delete"}>
                {busy === "delete" ? "Deleting…" : "Yes, delete everything"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Questions or a grievance? Our Data Protection Officer responds within 15 days at{" "}
          <a href={`mailto:${GRIEVANCE_EMAIL}`} className="font-medium text-foreground hover:underline">{GRIEVANCE_EMAIL}</a>.
          See the <Link href="/privacy" className="font-medium text-foreground hover:underline">Privacy Policy</Link>.
        </p>
      </CardContent>
    </Card>
  );
}
