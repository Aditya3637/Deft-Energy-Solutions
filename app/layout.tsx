import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Deft Energy Solutions",
    template: "%s · Deft Energy",
  },
  description:
    "Upload a bill, get an instant diagnosis and quantified savings. Smart, sustainable energy for the way you work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">{children}</body>
    </html>
  );
}
