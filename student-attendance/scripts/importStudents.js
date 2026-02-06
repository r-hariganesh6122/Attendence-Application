const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const STUDENTS_DIR = path.join(__dirname, "Students");

// Simple string similarity function (case-insensitive, based on common substring length)
function similarity(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  let max = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j <= a.length; j++) {
      const sub = a.slice(i, j);
      if (b.includes(sub) && sub.length > max) max = sub.length;
    }
  }
  return max;
}

async function importStudents() {
  // Fetch all classes from DB
  const classes = await prisma.class.findMany();
  const files = fs.readdirSync(STUDENTS_DIR).filter((f) => f.endsWith(".xlsx"));
  for (const file of files) {
    const filePath = path.join(STUDENTS_DIR, file);
    const workbook = xlsx.readFile(filePath);
    for (const sheetName of workbook.SheetNames) {
      // Find closest class name
      let bestClass = null;
      let bestScore = 0;
      for (const c of classes) {
        const score = similarity(sheetName, c.name);
        if (score > bestScore) {
          bestScore = score;
          bestClass = c;
        }
      }
      const classId = bestClass ? bestClass.id : null;
      if (!classId) {
        console.warn(`No matching class for sheet: ${sheetName}`);
      }
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      // Skip header row, start from row 2
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 5) continue;
        const rollNo = String(row[1]).trim();
        const regNo = String(row[2]).trim();
        const studentName = String(row[3]).trim();
        let residence = String(row[4]).trim().toUpperCase();
        if (residence === "SOS") residence = "OSS";
        const validResidences = ["H", "D", "OSS"];
        // Set residence to null if invalid
        if (!validResidences.includes(residence)) residence = null;
        // Skip if rollNo or studentName is missing or looks like a header/footer
        if (
          !rollNo ||
          !studentName ||
          rollNo.toLowerCase().includes("roll") ||
          studentName.toLowerCase().includes("name")
        )
          continue;
        try {
          await prisma.student.create({
            data: { rollNo, regNo, studentName, residence, classId },
          });
          console.log(
            `Inserted: ${studentName} (${rollNo}) to classId ${classId}`,
          );
        } catch (err) {
          console.error(
            `Failed to insert ${studentName} (${rollNo}):`,
            err.message,
          );
        }
      }
    }
  }
  await prisma.$disconnect();
}

module.exports = importStudents;
