import type { Metadata } from "next";
import { Providers } from "../providers";
import { AdminNavigationProvider } from "./AdminNavigationContext";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import { AdminTopbar } from "../components/admin/AdminTopbar";
import { requireCmsSession } from "@/lib/dealer-auth-server";

export const metadata: Metadata = {
  title: "Admin - Hyundai Capital CMS",
  description: "Content Management System",
};

export default async function BackOfficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireCmsSession();

  return (
    <Providers>
      <AdminNavigationProvider>
        <div className="flex min-h-screen bg-gray-50">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AdminTopbar />
            <main className="flex-1 p-6 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </AdminNavigationProvider>
    </Providers>
  );
}

