const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedAdmin() {
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      mobile: "8888888888",
      password: "adminpassword",
      role: "admin",
    },
  });
}

module.exports = seedAdmin;
