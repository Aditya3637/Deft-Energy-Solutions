import { FieldShell } from "@/components/layout/field-shell";

export default function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FieldShell title="Field">{children}</FieldShell>;
}
