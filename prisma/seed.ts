import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';
import { ADMIN_MENUS } from '../lib/admin-menus';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const menus = ADMIN_MENUS;

  for (const menu of menus) {
    await prisma.menu.upsert({
      where: { code: menu.code },
      update: { name: menu.name, path: menu.path, order: menu.order },
      create: menu,
    });
  }

  console.log(`Menus synced (${menus.length})`);

  // Create Permissions for each menu (default: all false)
  for (const menu of menus) {
    await prisma.permission.upsert({
      where: { menuCode: menu.code },
      update: {},
      create: {
        menuCode: menu.code,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      },
    });
  }

  console.log('Permissions created');

  // Create Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Full access to all features',
    },
  });

  console.log('Super Admin role created');

  // Grant all permissions to Super Admin
  for (const menu of menus) {
    const permission = await prisma.permission.findUnique({
      where: { menuCode: menu.code },
    });

    if (permission) {
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

      // Update permission to allow all actions for Super Admin
      await prisma.permission.update({
        where: { id: permission.id },
        data: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
      });
    }
  }

  console.log('Super Admin permissions granted');

  // Create default Super Admin user
  const hashedPassword = await hashPassword('admin123');
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'admin@hcfi.com' },
    update: {},
    create: {
      email: 'admin@hcfi.com',
      password: hashedPassword,
      name: 'Super Admin',
      isActive: true,
    },
  });

  console.log('Super Admin user created');

  // Assign Super Admin role to user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });

  console.log('Super Admin role assigned to user');
  console.log('✅ Seeding completed!');
  console.log('📧 Email: admin@hcfi.com');
  console.log('🔑 Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


