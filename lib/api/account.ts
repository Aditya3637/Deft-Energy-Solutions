import { apiFetch, clearSessionToken, getSessionToken, isApiConfigured } from "@/lib/api/client";

export type AccountProfile = {
  email: string;
  name: string;
  role: string | null;
  org: { id: string; name: string; plan: string } | null;
  consentAt: string | null;
  consentVersion: string;
  memberSince: string | null;
};

export const account = {
  isSignedIn: (): boolean => isApiConfigured() && !!getSessionToken(),

  /** Profile + consent (null if not signed in / no backend). */
  async profile(): Promise<AccountProfile | null> {
    if (!isApiConfigured() || !getSessionToken()) return null;
    try {
      return await apiFetch<AccountProfile>("/v1/account");
    } catch {
      return null;
    }
  },

  /** Right to correction. */
  async correctName(name: string): Promise<boolean> {
    try {
      await apiFetch("/v1/account", { method: "PATCH", body: JSON.stringify({ name }) });
      return true;
    } catch {
      return false;
    }
  },

  /** Right to access — download a JSON export of all your data. */
  async exportData(): Promise<boolean> {
    try {
      const data = await apiFetch<unknown>("/v1/account/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "deft-energy-my-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  },

  /** Right to erasure — permanently delete account + org + data, then sign out. */
  async erase(): Promise<boolean> {
    try {
      await apiFetch("/v1/account", { method: "DELETE" });
      clearSessionToken();
      return true;
    } catch {
      return false;
    }
  },
};
