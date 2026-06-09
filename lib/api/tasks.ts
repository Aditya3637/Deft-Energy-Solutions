import * as M from "@/lib/mock/tasks";

export type { Task, TaskStatus, TaskSource, TaskPriority } from "@/lib/mock/tasks";
export const TASK_COLUMNS = M.TASK_COLUMNS;

export const tasks = {
  list: async (): Promise<M.Task[]> => M.TASKS,
};
