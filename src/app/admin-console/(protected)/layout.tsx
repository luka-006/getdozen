import { requireAdminConsoleSession } from "@/lib/admin-console";
import { assertProductAccess } from "@/lib/waitlist-guard";

export default async function AdminConsoleProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertProductAccess();
  await requireAdminConsoleSession();
  return children;
}
