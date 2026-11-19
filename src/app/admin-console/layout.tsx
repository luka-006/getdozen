import type { Metadata } from "next";
import { assertProductAccess } from "@/lib/waitlist-guard";

export const metadata: Metadata = {
  title: "Console",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminConsoleRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertProductAccess();
  return (
    <div className="admin-console-shell min-h-[calc(100vh-4rem)] bg-mist/40">
      {children}
    </div>
  );
}
