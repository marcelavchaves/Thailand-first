import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Usage Report",
  robots: { index: false, follow: false },
};

export default function UsageReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
