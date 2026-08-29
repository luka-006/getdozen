"use client";

import dynamic from "next/dynamic";

const BugReportButton = dynamic(
  () =>
    import("@/components/bug-report-button").then((m) => m.BugReportButton),
  { ssr: false },
);

export function BugReportLazy({ email = "" }: { email?: string }) {
  return <BugReportButton email={email} />;
}
