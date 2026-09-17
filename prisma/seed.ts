import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Empty seed script - app is for personal tracking
  await prisma.workOrder.deleteMany();
  console.log("Banco de dados limpo com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
