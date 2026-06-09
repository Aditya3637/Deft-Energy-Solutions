import * as M from "@/lib/mock/tasks";
import { apiFetch, isApiConfigured, liveServer, NO_STORE } from "@/lib/api/client";

export type { Task, TaskStatus, TaskSource, TaskPriority } from "@/lib/mock/tasks";
export const TASK_COLUMNS = M.TASK_COLUMNS;

type ServerTask = {
  id: string;
  title: string;
  building: string;
  source: "DIAGNOSIS" | "ALERT" | "AUDIT";
  priority: "HIGH" | "MEDIUM" | "LOW";
  assignee: string;
  due: string;
  savingsInr: number | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
};

const SOURCE: Record<ServerTask["source"], M.Task["source"]> = {
  DIAGNOSIS: "Diagnosis",
  ALERT: "Alert",
  AUDIT: "Audit",
};

function mapTask(t: ServerTask): M.Task {
  return {
    id: t.id,
    title: t.title,
    building: t.building,
    source: SOURCE[t.source],
    priority: t.priority.toLowerCase() as M.Task["priority"],
    assignee: t.assignee,
    due: t.due,
    savingsINR: t.savingsInr ?? undefined,
    status: t.status.toLowerCase() as M.Task["status"],
  };
}

export type CreateTaskInput = {
  title: string;
  building?: string;
  assignee?: string;
  due?: string;
  savingsInr?: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  source?: "DIAGNOSIS" | "ALERT" | "AUDIT";
};

export const tasks = {
  list: async (): Promise<M.Task[]> => {
    if (liveServer()) {
      try {
        const data = await apiFetch<ServerTask[]>("/v1/tasks", NO_STORE);
        return data.map(mapTask);
      } catch {
        /* fall back to fixtures */
      }
    }
    return M.TASKS;
  },

  /**
   * Create a task (the "act on it" step of the core loop). Persists via
   * POST /v1/tasks when a backend is configured; a no-op "demo add" otherwise.
   */
  create: async (input: CreateTaskInput): Promise<{ created: boolean; task?: M.Task }> => {
    if (!isApiConfigured()) return { created: false };
    try {
      const t = await apiFetch<ServerTask>("/v1/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...input,
          savingsInr: input.savingsInr != null ? Math.round(input.savingsInr) : undefined,
        }),
      });
      return { created: true, task: mapTask(t) };
    } catch {
      return { created: false };
    }
  },
};
