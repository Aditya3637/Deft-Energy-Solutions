import * as M from "@/lib/mock/alerts";

export type { AlertInstance, AlertRule, AlertSeverity, AlertStatus } from "@/lib/mock/alerts";

export const alerts = {
  list: async (): Promise<M.AlertInstance[]> => M.ALERTS,
  rules: async (): Promise<M.AlertRule[]> => M.ALERT_RULES,
};
