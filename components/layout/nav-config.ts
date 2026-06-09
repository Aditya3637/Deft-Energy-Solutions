import {
  LayoutDashboard,
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

/**
 * Primary app navigation. Ordered by the core loop (bills first), then the
 * widening modules. Hrefs are placeholders until Stage B builds the screens.
 */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Executive", href: "/app/executive", icon: Presentation },
  { label: "Bills", href: "/app/bills", icon: FileText },
  { label: "Payments", href: "/app/payments", icon: CalendarClock },
  { label: "Buildings", href: "/app/buildings", icon: Building2 },
  { label: "Tasks", href: "/app/tasks", icon: ListChecks },
  { label: "Alerts", href: "/app/alerts", icon: Bell },
  { label: "Analytics", href: "/app/analytics", icon: LineChart },
  { label: "Accuracy", href: "/app/accuracy", icon: Gauge },
  { label: "ROI", href: "/app/roi", icon: Calculator },
  { label: "Approvals", href: "/app/capex", icon: BadgeCheck },
  { label: "Compliance", href: "/app/compliance", icon: ShieldCheck },
  { label: "Carbon", href: "/app/carbon", icon: Leaf },
  { label: "Markets", href: "/app/markets", icon: ArrowLeftRight },
  { label: "Assets", href: "/app/assets", icon: BatteryCharging },
  { label: "Marketplace", href: "/app/marketplace", icon: Store },
  { label: "Training", href: "/app/training", icon: GraduationCap },
  { label: "Rewards", href: "/app/leaderboard", icon: Trophy },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

/** Field/mobile bottom nav — a focused subset for on-site roles. */
export const FIELD_NAV: NavItem[] = [
  { label: "Home", href: "/field", icon: LayoutDashboard },
  { label: "Work", href: "/field/work-orders", icon: ListChecks },
  { label: "Audit", href: "/field/audit", icon: FileText },
  { label: "Collect", href: "/field/collection", icon: Wallet },
];
