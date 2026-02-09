const { PrismaClient } = require("@prisma/client");
const { generateRandomPassword } = require("./passwordUtils");
const prisma = new PrismaClient();

async function seedDefaultTeacher() {
  const result = await prisma.user.upsert({
    where: { mobile: "9999999999" },
    update: {},
    create: {
      name: "Default Teacher",
      mobile: "9999999999",
      password: generateRandomPassword(),
      role: "teacher",
    },
  });
  console.log(`✓ Default teacher seeded (Password: ${result.password})`);
}

module.exports = seedDefaultTeacher;
