import type { Metadata } from "next";
import { Providers } from "../providers";
import { AdminNavigationProvider } from "./AdminNavigationContext";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import { AdminTopbar } from "../components/admin/AdminTopbar";
import { getVisibleAdminMenuCodes } from "@/lib/admin-menu-visibility";
import { requireCmsSession } from "@/lib/dealer-auth-server";
import { getUserPermissions } from "@/lib/permissions";
import { syncAdminMenus } from "@/lib/sync-admin-menus";

export const metadata: Metadata = {
  title: "Admin - Hyundai Capital CMS",
  description: "Content Management System",
};

export default async function BackOfficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireCmsSession();
  await syncAdminMenus();
  const permissions = (await getUserPermissions(session.user.id)) ?? {};
  const visibleMenuCodes = getVisibleAdminMenuCodes(permissions);

  return (
    <Providers>
      <AdminNavigationProvider>
        <div className="flex min-h-screen bg-gray-50">
          <AdminSidebar visibleMenuCodes={visibleMenuCodes} />
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

