const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const ACS_DIR = path.join(__dirname, "ACs");

// Extract mobile number from text like "John (9999999999)"
function extractMobileFromName(text) {
  const match = text.match(/\(([0-9]+)\)/);
  return match ? match[1] : null;
}

// Extract name without mobile number
function extractName(text) {
  return text.replace(/\s*\([0-9]+\)\s*/, "").trim();
}

async function importAcademicCoordinators() {
  try {
    const filePath = path.join(ACS_DIR, "AcademicCoordinators.xlsx");

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read rows as raw data to preserve format
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Skip header row (row 0), process from row 1
    let currentCoordinatorName = null;
    let currentMobile = null;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      if (!row || row.length === 0) continue;

      // Get values safely - check for actual content, not just truthy
      const col0 = row[0];
      const col1 = row[1];
      const col2 = row[2];

      const sNo =
        col0 && col0.toString().trim() !== "" ? col0.toString().trim() : "";
      const nameWithMobile =
        col1 && col1.toString().trim() !== "" ? col1.toString().trim() : "";
      const departmentName =
        col2 && col2.toString().trim() !== "" ? col2.toString().trim() : "";

      // Skip completely empty rows
      if (!sNo && !nameWithMobile && !departmentName) continue;

      // If S.No is present AND Name has mobile number format, it's a new coordinator
      // S.No should be a number and nameWithMobile should contain "(XXX)" pattern
      const hasValidMobileFormat =
        nameWithMobile && nameWithMobile.match(/\([0-9]+\)/);

      if (sNo && nameWithMobile && hasValidMobileFormat) {
        currentCoordinatorName = extractName(nameWithMobile);
        currentMobile = extractMobileFromName(nameWithMobile);

        if (!currentMobile) {
          console.warn(
            `Row ${i + 1}: No mobile number found for ${nameWithMobile}`,
          );
          currentCoordinatorName = null;
          currentMobile = null;
          continue;
        }

        console.log(
          `→ Processing coordinator: ${currentCoordinatorName} (${currentMobile})`,
        );
      }

      // Process department assignment
      if (departmentName) {
        if (!currentCoordinatorName || !currentMobile) {
          console.warn(
            `Row ${i + 1}: No coordinator info for department ${departmentName}`,
          );
          continue;
        }

        try {
          // Find department (case-insensitive)
          const department = await prisma.department.findFirst({
            where: {
              name: {
                contains: departmentName,
              },
            },
          });

          if (!department) {
            console.warn(`Department not found: ${departmentName}`);
            continue;
          }

          // Check if user already exists
          let user = await prisma.user.findUnique({
            where: { mobile: currentMobile },
          });

          if (!user) {
            // Create new coordinator user
            const hashedPassword = await bcrypt.hash(currentMobile, 10);
            user = await prisma.user.create({
              data: {
                name: currentCoordinatorName,
                mobile: currentMobile,
                passwordHash: hashedPassword,
                role: "academic_coordinator",
                coordinatorDepartmentId: department.id,
              },
            });

            console.log(
              `✓ Created Academic Coordinator: ${currentCoordinatorName} (${currentMobile}) for ${department.name}`,
            );
          } else {
            // Update existing user to include academic coordinator role for this department
            // For multiple departments, update the main department
            if (!user.coordinatorDepartmentId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  role: "academic_coordinator",
                  coordinatorDepartmentId: department.id,
                },
              });

              console.log(
                `✓ Updated ${currentCoordinatorName} (${currentMobile}) as Academic Coordinator for ${department.name}`,
              );
            } else {
              console.log(
                `✓ ${currentCoordinatorName} (${currentMobile}) already coordinator for ${user.coordinatorDepartment?.name || "a department"}`,
              );
            }
          }

          // Also add them as a teacher in this department if not already
          const existingTeacherDept = await prisma.teacherDepartment.findUnique(
            {
              where: {
                teacherId_departmentId: {
                  teacherId: user.id,
                  departmentId: department.id,
                },
              },
            },
          );

          if (!existingTeacherDept) {
            await prisma.teacherDepartment.create({
              data: {
                teacherId: user.id,
                departmentId: department.id,
              },
            });

            console.log(
              `  → Assigned to teach in department: ${department.name}`,
            );
          }
        } catch (err) {
          console.error(
            `Error processing department ${departmentName} for ${currentCoordinatorName}:`,
            err.message,
          );
        }
      }
    }

    console.log("\n✓ Academic Coordinators import completed!");
  } catch (err) {
    console.error("Error importing Academic Coordinators:", err.message);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
}

module.exports = importAcademicCoordinators;

// Run directly if called as main script
if (require.main === module) {
  importAcademicCoordinators().finally(() => {
    prisma.$disconnect();
  });
}
