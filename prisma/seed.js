/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS for plain Node (EB, db:seed) */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const adminMenus = require('../lib/admin-menus.data.json');
const dealerMenus = require('../lib/dealer-menus.data.json');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const prisma = new PrismaClient();

const ROLE_NAMES = {
  SUPER_ADMIN: 'Super Admin',
  DEALER_ADMIN: 'Dealer Admin',
  SALESMAN: 'Salesman',
};

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function grantRolePermissions(roleId, grants) {
  for (const [menuCode, flags] of Object.entries(grants)) {
    const permission = await prisma.permission.findUnique({
      where: { menuCode },
    });
    if (!permission) continue;

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId: permission.id,
      },
    });

    await prisma.permission.update({
      where: { id: permission.id },
      data: flags,
    });
  }
}

async function main() {
  console.log('Seeding database...');

  const allMenus = [...adminMenus, ...dealerMenus];

  for (const menu of allMenus) {
    await prisma.menu.upsert({
      where: { code: menu.code },
      update: { name: menu.name, path: menu.path, order: menu.order },
      create: menu,
    });
  }
  console.log(`Menus synced (${allMenus.length})`);

  for (const menu of allMenus) {
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
    where: { name: ROLE_NAMES.SUPER_ADMIN },
    update: {},
    create: {
      name: ROLE_NAMES.SUPER_ADMIN,
      description: 'Full access to all features',
    },
  });

  const dealerAdminRole = await prisma.role.upsert({
    where: { name: ROLE_NAMES.DEALER_ADMIN },
    update: { description: 'Kelola promo diskon dan leads dealer' },
    create: {
      name: ROLE_NAMES.DEALER_ADMIN,
      description: 'Kelola promo diskon dan leads dealer',
    },
  });

  const salesmanRole = await prisma.role.upsert({
    where: { name: ROLE_NAMES.SALESMAN },
    update: { description: 'Buat quotation/simulasi kredit untuk dealer' },
    create: {
      name: ROLE_NAMES.SALESMAN,
      description: 'Buat quotation/simulasi kredit untuk dealer',
    },
  });

  console.log('Roles synced');

  const allAdminGrants = Object.fromEntries(
    adminMenus.map((menu) => [
      menu.code,
      { canView: true, canCreate: true, canEdit: true, canDelete: true },
    ])
  );

  await grantRolePermissions(superAdminRole.id, {
    ...allAdminGrants,
    DEALER_DASHBOARD: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    DEALER_PROMOTIONS: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    DEALER_QUOTATION: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    DEALER_LEADS: { canView: true, canCreate: true, canEdit: true, canDelete: true },
  });

  await grantRolePermissions(dealerAdminRole.id, {
    DEALER_DASHBOARD: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    DEALER_PROMOTIONS: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    DEALER_LEADS: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  });

  await grantRolePermissions(salesmanRole.id, {
    DEALER_DASHBOARD: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    DEALER_QUOTATION: { canView: true, canCreate: true, canEdit: false, canDelete: false },
    DEALER_LEADS: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  });

  console.log('Role permissions granted');

  const hashedPassword = await hashPassword('admin123');
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'admin@hcfi.com' },
    update: { userType: 'HCFI_ADMIN' },
    create: {
      email: 'admin@hcfi.com',
      password: hashedPassword,
      name: 'Super Admin',
      isActive: true,
      userType: 'HCFI_ADMIN',
    },
  });
  console.log('Super Admin user synced');

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
