const { PrismaClient } = require("@prisma/client");
const { generateRandomPassword } = require("./passwordUtils");
const prisma = new PrismaClient();

async function seedAdmin() {
  const result = await prisma.user.upsert({
    where: { mobile: "8888888888" },
    update: {},
    create: {
      name: "Admin",
      mobile: "8888888888",
      password: generateRandomPassword(),
      role: "admin",
    },
  });
  console.log(`✓ Admin seeded (Password: ${result.password})`);
}

module.exports = seedAdmin;
