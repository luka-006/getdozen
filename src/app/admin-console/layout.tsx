import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Console",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminConsoleRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-console-shell min-h-[calc(100vh-4rem)] bg-mist/40">
      {children}
    </div>
  );
}
