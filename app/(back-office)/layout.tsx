import type { Metadata } from "next";
import { Providers } from "../providers";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import { AdminTopbar } from "../components/admin/AdminTopbar";

export const metadata: Metadata = {
  title: "Admin - Hyundai Capital CMS",
  description: "Content Management System",
};

export default function BackOfficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminTopbar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}

