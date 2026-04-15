/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS for plain Node (EB, db:seed) */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('Seeding database...');

  const menus = [
    { code: 'DASHBOARD', name: 'Dashboard', path: '/admin/dashboard', order: 1 },
    { code: 'USERS', name: 'User Management', path: '/admin/users', order: 2 },
    { code: 'ROLES', name: 'Role & Permission', path: '/admin/roles', order: 3 },
    { code: 'BANNERS', name: 'Banner Management', path: '/admin/banners', order: 4 },
    { code: 'BENEFITS', name: 'Benefit Settings', path: '/admin/benefits', order: 11 },
    { code: 'PRODUCTS', name: 'Product Section', path: '/admin/products', order: 5 },
    { code: 'PROMOS', name: 'Promo Management', path: '/admin/promos', order: 6 },
    { code: 'ARTICLES', name: 'Artikel/Berita', path: '/admin/articles', order: 7 },
    { code: 'PAGES', name: 'Static Pages', path: '/admin/pages', order: 8 },
    { code: 'LEADS', name: 'Leads', path: '/admin/leads', order: 9 },
    { code: 'FOOTER', name: 'Footer Settings', path: '/admin/footer', order: 10 },
    { code: 'MEDIA', name: 'Media Library', path: '/admin/media', order: 12 },
    { code: 'SETTINGS', name: 'Site Settings', path: '/admin/settings', order: 13 },
  ];

  for (const menu of menus) {
    await prisma.menu.upsert({
      where: { code: menu.code },
      update: {},
      create: menu,
    });
  }
  console.log('Menus created');

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

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Full access to all features',
    },
  });
  console.log('Super Admin role created');

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
