// scripts/clearAttendance.js
// Script to delete all attendance records from the Attendance table using Prisma

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearAttendance() {
  try {
    const deleted = await prisma.attendance.deleteMany({});
    console.log(`Deleted ${deleted.count} attendance records.`);
  } catch (error) {
    console.error("Error clearing attendance:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAttendance();
