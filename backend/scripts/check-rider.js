const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const rider = await prisma.user.findFirst({ where: { role: 'RIDER' } });
  console.log('Rider:', rider ? { id: rider.id, name: rider.name, phone: rider.phone } : 'none');
  await prisma.$disconnect();
})();
