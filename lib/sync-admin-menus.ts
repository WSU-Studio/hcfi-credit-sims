import { prisma } from '@/lib/prisma';
import { ADMIN_MENUS } from '@/lib/admin-menus';

export async function syncAdminMenus() {
  const superAdminRole = await prisma.role.findFirst({
    where: { name: 'Super Admin' },
    select: { id: true },
  });

  for (const menu of ADMIN_MENUS) {
    await prisma.menu.upsert({
      where: { code: menu.code },
      update: {
        name: menu.name,
        path: menu.path,
        order: menu.order,
      },
      create: menu,
    });

    const permission = await prisma.permission.upsert({
      where: { menuCode: menu.code },
      update: {},
      create: {
        menuCode: menu.code,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
    });

    if (superAdminRole) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

