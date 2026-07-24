const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const cats = await prisma.category.findMany();
  console.log('Categories:', JSON.stringify(cats, null, 2));
  await prisma.$disconnect();
})().catch(e => console.error(e));
