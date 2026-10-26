import AdminLayout from "@/features/admin/AdminLayout";

export const metadata = {
  title: "Admin Console — Delivery Platform",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
