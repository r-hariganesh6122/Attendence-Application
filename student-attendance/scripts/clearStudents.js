const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearStudents() {
  const deleted = await prisma.student.deleteMany();
  console.log(`Deleted ${deleted.count} students.`);
  await prisma.$disconnect();
}

clearStudents();
