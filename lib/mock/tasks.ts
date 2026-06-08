/** Mock tasks (CL03) — many auto-created from diagnoses and alerts. Deterministic. */

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskSource = "Diagnosis" | "Alert" | "Audit";
export type TaskPriority = "high" | "medium" | "low";

export type Task = {
  id: string;
  title: string;
  building: string;
  source: TaskSource;
  priority: TaskPriority;
  assignee: string;
  due: string;
  savingsINR?: number;
  status: TaskStatus;
};

export const TASKS: Task[] = [
  { id: "t1", title: "Apply to reduce contract demand to 800 kVA", building: "Acme Bhosari Plant", source: "Diagnosis", priority: "high", assignee: "R. Mehta", due: "20-06-2026", savingsINR: 1080000, status: "todo" },
  { id: "t2", title: "Get quotes for APFC panel (raise PF to 0.95)", building: "CoolChain Cold Storage", source: "Diagnosis", priority: "high", assignee: "S. Nair", due: "24-06-2026", savingsINR: 578400, status: "todo" },
  { id: "t3", title: "Investigate power-factor drop to 0.88", building: "CoolChain Cold Storage", source: "Alert", priority: "high", assignee: "S. Nair", due: "12-06-2026", status: "in_progress" },
  { id: "t4", title: "Pilot ToD load-shift on chiller plant", building: "Acme Bhosari Plant", source: "Diagnosis", priority: "medium", assignee: "R. Mehta", due: "30-06-2026", savingsINR: 1109000, status: "in_progress" },
  { id: "t5", title: "Chase missing May bill from BESCOM", building: "Riverside Mall", source: "Alert", priority: "medium", assignee: "A. Iyer", due: "10-06-2026", status: "in_progress" },
  { id: "t6", title: "Upload 3 pending bills (data gap)", building: "TechPark Block C", source: "Alert", priority: "medium", assignee: "A. Iyer", due: "15-06-2026", status: "todo" },
  { id: "t7", title: "Review EPI vs benchmark (28.4 vs 18)", building: "CoolChain Cold Storage", source: "Audit", priority: "low", assignee: "S. Nair", due: "05-07-2026", status: "todo" },
  { id: "t8", title: "Verify corrected meter multiplying factor", building: "Acme Chakan Unit 2", source: "Diagnosis", priority: "low", assignee: "R. Mehta", due: "28-06-2026", status: "done" },
  { id: "t9", title: "Submit net-metering application", building: "Orchid Tower (HQ)", source: "Audit", priority: "low", assignee: "A. Iyer", due: "01-06-2026", savingsINR: 540000, status: "done" },
];

export const TASK_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];
