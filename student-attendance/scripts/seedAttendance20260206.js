const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function randomInformed() {
  return Math.random() < 0.5;
}

function randomStatus() {
  return Math.random() < 0.8 ? "present" : "absent";
}

function randomReason() {
  const reasons = [
    "Sick",
    "Family Emergency",
    "Personal Work",
    "Travel",
    "Other",
    null,
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

async function seedAttendance20260206() {
  const students = await prisma.student.findMany();
  // Fixed date: February 12, 2026
  const attendanceDate = new Date("2026-02-12T00:00:00.000Z");

  let count = 0;
  for (const student of students) {
    const status = randomStatus();
    let informed = null;
    let absenceReason = null;

    if (status === "absent") {
      informed = randomInformed();
      absenceReason = randomReason();
      // Validation: if informed is true, absenceReason must not be null
      if (informed && !absenceReason) {
        // Re-select a reason that is not null
        const nonNullReasons = [
          "Sick",
          "Family Emergency",
          "Personal Work",
          "Travel",
          "Other",
        ];
        absenceReason =
          nonNullReasons[Math.floor(Math.random() * nonNullReasons.length)];
      }
    }

    await prisma.attendance.create({
      data: {
        date: attendanceDate,
        studentId: student.id,
        classId: student.classId,
        status,
        absenceReason,
        informed,
      },
    });

    console.log(
      `Attendance for ${student.studentName} (${status}${status === "absent" ? ", " + (informed ? "Informed" : "Not Informed") : ""})`,
    );
    count++;
  }

  console.log(
    `✓ Attendance seeding for 2026-02-12 complete. Total: ${count} records`,
  );
}

module.exports = seedAttendance20260206;
