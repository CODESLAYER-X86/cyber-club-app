const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany({ select: { title: true, certificateLayout: true } });
  events.forEach(e => {
    if (e.certificateLayout) {
       console.log(e.title, JSON.parse(e.certificateLayout).clubLogo);
    }
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
