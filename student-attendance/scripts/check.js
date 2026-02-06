const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkInvalidResidence() {
  const validResidences = ["H", "D", "OSS"];
  const students = await prisma.student.findMany();
  const invalid = students.filter(
    (s) => !validResidences.includes((s.residence || "").toUpperCase()),
  );
  if (invalid.length === 0) {
    console.log("No students with invalid ResidenceType.");
  } else {
    console.log("Students with invalid ResidenceType:");
    invalid.forEach((s) => {
      console.log(
        `ID: ${s.id}, RollNo: ${s.rollNo}, RegNo: ${s.regNo}, Name: ${s.studentName}, Residence: ${s.residence}`,
      );
    });
    console.log(`Total: ${invalid.length}`);
  }
  await prisma.$disconnect();
}

checkInvalidResidence();
