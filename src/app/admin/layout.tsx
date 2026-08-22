import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Admin",
  description: "Dozen admin.",
  path: "/admin",
  index: false,
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
