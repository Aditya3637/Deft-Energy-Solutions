import * as M from "@/lib/mock/alerts";
import { apiFetch, liveServer, NO_STORE } from "@/lib/api/client";

export type { AlertInstance, AlertRule, AlertSeverity, AlertStatus } from "@/lib/mock/alerts";

type ServerAlert = {
  id: string;
  title: string;
  building: string;
  detail: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  status: "NEW" | "ACKNOWLEDGED" | "RESOLVED";
  triggered: string; // ISO
};
type ServerRule = {
  id: string;
  name: string;
  condition: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  active: boolean;
};

/** ISO datetime → DD-MM-YYYY (UTC) for display. */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}

function mapAlert(a: ServerAlert): M.AlertInstance {
  return {
    id: a.id,
    title: a.title,
    building: a.building,
    detail: a.detail,
    severity: a.severity.toLowerCase() as M.AlertSeverity,
    status: a.status.toLowerCase() as M.AlertStatus,
    triggered: fmtDate(a.triggered),
  };
}

function mapRule(r: ServerRule): M.AlertRule {
  return {
    id: r.id,
    name: r.name,
    condition: r.condition,
    severity: r.severity.toLowerCase() as M.AlertSeverity,
    active: r.active,
  };
}

export const alerts = {
  list: async (): Promise<M.AlertInstance[]> => {
    if (liveServer()) {
      try {
        const data = await apiFetch<ServerAlert[]>("/v1/alerts", NO_STORE);
        return data.map(mapAlert);
      } catch {
        /* fall back */
      }
    }
    return M.ALERTS;
  },
  rules: async (): Promise<M.AlertRule[]> => {
    if (liveServer()) {
      try {
        const data = await apiFetch<ServerRule[]>("/v1/alerts/rules", NO_STORE);
        return data.map(mapRule);
      } catch {
        /* fall back */
      }
    }
    return M.ALERT_RULES;
  },
};
