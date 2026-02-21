import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const deviceApiHash = await bcrypt.hash('devkey-001', 10);

  const [north, center] = await Promise.all([
    prisma.branch.upsert({
      where: { code: 'NORTE' },
      update: {},
      create: { code: 'NORTE', name: 'Sucursal Norte' },
    }),
    prisma.branch.upsert({
      where: { code: 'CENTRO' },
      update: {},
      create: { code: 'CENTRO', name: 'Sucursal Centro' },
    }),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@scale.local' },
    update: {},
    create: {
      email: 'admin@scale.local',
      passwordHash,
      role: Role.GLOBAL_MANAGER,
      name: 'Admin Global',
    },
  });

  const branchManager = await prisma.user.upsert({
    where: { email: 'sucursal.norte@scale.local' },
    update: {},
    create: {
      email: 'sucursal.norte@scale.local',
      passwordHash,
      role: Role.BRANCH_MANAGER,
      name: 'Gestor Norte',
    },
  });

  await prisma.userBranchAccess.upsert({
    where: {
      userId_branchId: {
        userId: branchManager.id,
        branchId: north.id,
      },
    },
    update: {},
    create: {
      userId: branchManager.id,
      branchId: north.id,
    },
  });

  await prisma.scale.upsert({
    where: { deviceId: 'SCALE-001' },
    update: {},
    create: {
      deviceId: 'SCALE-001',
      apiKeyHash: deviceApiHash,
      label: 'Balanza Helado 1',
      branchId: north.id,
    },
  });

  await prisma.scale.upsert({
    where: { deviceId: 'SCALE-002' },
    update: {},
    create: {
      deviceId: 'SCALE-002',
      apiKeyHash: await bcrypt.hash('devkey-002', 10),
      label: 'Balanza Helado 2',
      branchId: center.id,
    },
  });

  await prisma.branchAlertConfig.upsert({
    where: { branchId: north.id },
    update: {},
    create: {
      branchId: north.id,
      minWeight: 0.2,
      maxWeight: 22,
      staleAfterMinutes: 25,
    },
  });

  await prisma.branchAlertConfig.upsert({
    where: { branchId: center.id },
    update: {},
    create: {
      branchId: center.id,
      minWeight: 0.2,
      maxWeight: 25,
      staleAfterMinutes: 30,
    },
  });

  const northScale = await prisma.scale.findUniqueOrThrow({
    where: { deviceId: 'SCALE-001' },
  });

  await prisma.scaleAlertConfig.upsert({
    where: { scaleId: northScale.id },
    update: {},
    create: {
      scaleId: northScale.id,
      maxWeight: 20,
    },
  });

  console.log('Seed completado');
  console.log('Global manager: admin@scale.local / Admin123!');
  console.log('Branch manager: sucursal.norte@scale.local / Admin123!');
  console.log('Device: SCALE-001 / devkey-001');
  console.log('Device: SCALE-002 / devkey-002');
  console.log(`Admin creado: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
