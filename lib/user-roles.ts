import { prisma } from '@/lib/prisma';

export async function getRoleNamesByIds(roleIds: string[]): Promise<string[]> {
  if (roleIds.length === 0) return [];
  const roles = await prisma.role.findMany({
    where: { id: { in: roleIds } },
    select: { name: true },
  });
  return roles.map((r) => r.name);
}

export async function getRoleNamesForUser(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { select: { name: true } } },
  });
  return userRoles.map((ur) => ur.role.name);
}
