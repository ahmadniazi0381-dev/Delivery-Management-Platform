import AdminLayout from "@/features/admin/AdminLayout";

export const metadata = {
  title: "Dashboard — Karachi Naseeb Baryani",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
