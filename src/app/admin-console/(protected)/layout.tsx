import { requireAdminConsoleSession } from "@/lib/admin-console";

export default async function AdminConsoleProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminConsoleSession();
  return children;
}
