import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashExistingPasswords() {
  try {
    console.log("Starting password hashing migration...\n");

    // Find all users with plaintext passwords (no passwordHash yet)
    const usersToMigrate = await prisma.user.findMany({
      where: {
        password: {
          not: null,
        },
        passwordHash: null,
      },
    });

    if (usersToMigrate.length === 0) {
      console.log(
        "No users with plaintext passwords found. Migration complete.",
      );
      return;
    }

    console.log(`Found ${usersToMigrate.length} users to migrate.\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersToMigrate) {
      try {
        // Hash the plaintext password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Update user with hashed password
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: hashedPassword,
            // Do NOT clear the plaintext password yet, keep it for reference
          },
        });

        console.log(
          `✓ Hashed password for user: ${user.name} (ID: ${user.id})`,
        );
        successCount++;
      } catch (error) {
        console.error(`✗ Error hashing password for user ${user.name}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✓ Migration complete!`);
    console.log(`  Successfully hashed: ${successCount} passwords`);
    console.log(`  Errors encountered: ${errorCount} passwords`);
    console.log(
      `\nNote: Plaintext passwords are still stored. After verifying logins work,`,
    );
    console.log(
      `you can manually delete the password column from the database.`,
    );
  } catch (error) {
    console.error("Fatal error during migration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
hashExistingPasswords();
