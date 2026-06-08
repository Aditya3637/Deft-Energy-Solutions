import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deft Energy Solutions",
  description: "Smart, sustainable energy solutions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
