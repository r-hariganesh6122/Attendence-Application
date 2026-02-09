const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function viewPasswords(role = null) {
  try {
    let users;
    if (role) {
      users = await prisma.user.findMany({
        where: { role },
        select: {
          id: true,
          name: true,
          mobile: true,
          role: true,
          password: true,
        },
      });
    } else {
      users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          mobile: true,
          role: true,
          password: true,
        },
      });
    }

    if (users.length === 0) {
      console.log("No users found");
      return;
    }

    console.log(
      "\n╔════════════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                        USER CREDENTIALS                           ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════════════╝\n",
    );

    users.forEach((user) => {
      console.log(`Name: ${user.name}`);
      console.log(`Mobile: ${user.mobile}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password: ${user.password}`);
      console.log("─".repeat(70));
    });
  } catch (error) {
    console.error("Error retrieving passwords:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get role from command line argument (optional)
const role = process.argv[2];
viewPasswords(role);
