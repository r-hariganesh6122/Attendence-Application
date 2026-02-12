const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log("Clearing all data...");

    // Delete in order of dependencies (reverse of creation order)
    await prisma.attendance.deleteMany();
    console.log("✓ Cleared attendance records");

    await prisma.attendanceLock.deleteMany();
    console.log("✓ Cleared attendance locks");

    await prisma.student.deleteMany();
    console.log("✓ Cleared students");

    await prisma.classTeacher.deleteMany();
    console.log("✓ Cleared class-teacher associations");

    // Try to clear courses (may not exist if migrations haven't been run)
    try {
      await prisma.course.deleteMany();
      console.log("✓ Cleared courses");
    } catch (error) {
      if (error.code === "P2021") {
        console.log("ℹ Course table doesn't exist yet (skipping)");
      } else {
        throw error;
      }
    }

    await prisma.class.deleteMany();
    console.log("✓ Cleared classes");

    await prisma.department.deleteMany();
    console.log("✓ Cleared departments");

    await prisma.program.deleteMany();
    console.log("✓ Cleared programs");

    await prisma.user.deleteMany();
    console.log("✓ Cleared users");

    console.log("\n✓ All data cleared successfully!");
  } catch (error) {
    console.error("Error clearing data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();
