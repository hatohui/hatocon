import type { Metadata } from "next";
import AdminSidenav from "@/components/admin/AdminSidenav";

export const metadata: Metadata = {
  title: "Admin",
  description: "Platform administration dashboard.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <AdminSidenav />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
