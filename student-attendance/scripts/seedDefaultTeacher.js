const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedDefaultTeacher() {
  await prisma.user.upsert({
    where: { email: "default.teacher@example.com" },
    update: {},
    create: {
      name: "Default Teacher",
      email: "default.teacher@example.com",
      mobile: "9999999999",
      password: "password",
      role: "teacher",
    },
  });
}

module.exports = seedDefaultTeacher;
