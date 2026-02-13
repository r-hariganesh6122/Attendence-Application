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

async function seedAttendance() {
  const students = await prisma.student.findMany();
  // Use local date (YYYY-MM-DD) for attendance
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayString = `${yyyy}-${mm}-${dd}`;
  const today = new Date(todayString);

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
        date: today,
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
  }

  await prisma.$disconnect();
  console.log("Attendance seeding complete.");
}

module.exports = seedAttendance;
