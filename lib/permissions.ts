import { auth } from './auth-server';
import { prisma } from './prisma';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export async function getUserPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: {
                    include: {
                      menu: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const permissions: Record<string, {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }> = {};

  user.userRoles.forEach((userRole) => {
    userRole.role.rolePermissions.forEach((rolePermission) => {
      const menuCode = rolePermission.permission.menuCode;
      if (!permissions[menuCode]) {
        permissions[menuCode] = {
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        };
      }
      permissions[menuCode].canView ||= rolePermission.permission.canView;
      permissions[menuCode].canCreate ||= rolePermission.permission.canCreate;
      permissions[menuCode].canEdit ||= rolePermission.permission.canEdit;
      permissions[menuCode].canDelete ||= rolePermission.permission.canDelete;
    });
  });

  return permissions;
}

export async function checkPermission(
  userId: string,
  menuCode: string,
  action: PermissionAction
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  if (!permissions || !permissions[menuCode]) return false;

  const permission = permissions[menuCode];
  switch (action) {
    case 'view':
      return permission.canView;
    case 'create':
      return permission.canCreate;
    case 'edit':
      return permission.canEdit;
    case 'delete':
      return permission.canDelete;
    default:
      return false;
  }
}

export async function requirePermission(
  menuCode: string,
  action: PermissionAction = 'view'
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const hasPermission = await checkPermission(session.user.id, menuCode, action);
  if (!hasPermission) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return true;
}

