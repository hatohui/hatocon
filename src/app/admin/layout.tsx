import AdminSidenav from "@/components/admin/AdminSidenav";

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
