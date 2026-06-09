import {
  LayoutDashboard,
  Layers,
  FileText,
  Building2,
  ListChecks,
  Bell,
  LineChart,
  Gauge,
  Calculator,
  CalendarClock,
  Wallet,
  Presentation,
  ShieldCheck,
  BadgeCheck,
  Leaf,
  ArrowLeftRight,
  BatteryCharging,
  Store,
  GraduationCap,
  Trophy,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  /** Section heading, framed by HOW it saves money (the savings ladder). */
  label: string;
  items: NavItem[];
};

/**
 * Primary app navigation, grouped by the value ladder — so the IA tells the
 * money story: see/recover → reprice/generate → earn/comply. "Savings" is the
 * consolidated, lever-attributed Savings Stack that headlines it.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/app", icon: LayoutDashboard },
      { label: "Savings", href: "/app/savings", icon: Layers },
      { label: "Executive", href: "/app/executive", icon: Presentation },
      { label: "Analytics", href: "/app/analytics", icon: LineChart },
      { label: "ROI", href: "/app/roi", icon: Calculator },
    ],
  },
  {
    label: "Recover",
    items: [
      { label: "Bills", href: "/app/bills", icon: FileText },
      { label: "Buildings", href: "/app/buildings", icon: Building2 },
      { label: "Payments", href: "/app/payments", icon: CalendarClock },
      { label: "Alerts", href: "/app/alerts", icon: Bell },
      { label: "Tasks", href: "/app/tasks", icon: ListChecks },
      { label: "Accuracy", href: "/app/accuracy", icon: Gauge },
    ],
  },
  {
    label: "Reprice & generate",
    items: [
      { label: "Markets", href: "/app/markets", icon: ArrowLeftRight },
      { label: "Assets", href: "/app/assets", icon: BatteryCharging },
      { label: "Carbon", href: "/app/carbon", icon: Leaf },
    ],
  },
  {
    label: "Earn & comply",
    items: [
      { label: "Collections", href: "/app/collections", icon: Wallet },
      { label: "Compliance", href: "/app/compliance", icon: ShieldCheck },
      { label: "Marketplace", href: "/app/marketplace", icon: Store },
      { label: "Approvals", href: "/app/capex", icon: BadgeCheck },
    ],
  },
  {
    label: "More",
    items: [
      { label: "Rewards", href: "/app/leaderboard", icon: Trophy },
      { label: "Training", href: "/app/training", icon: GraduationCap },
      { label: "Settings", href: "/app/settings", icon: Settings },
    ],
  },
];

/** Flattened list (for lookups / any consumer that wants every item). */
export const PRIMARY_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Field/mobile bottom nav — a focused subset for on-site roles. */
export const FIELD_NAV: NavItem[] = [
  { label: "Home", href: "/field", icon: LayoutDashboard },
  { label: "Work", href: "/field/work-orders", icon: ListChecks },
  { label: "Audit", href: "/field/audit", icon: FileText },
  { label: "Collect", href: "/field/collection", icon: Wallet },
];
