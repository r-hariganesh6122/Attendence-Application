const { PrismaClient } = require("@prisma/client");
const xlsx = require("xlsx");
const path = require("path");
const { generateRandomPassword } = require("./passwordUtils");

const prisma = new PrismaClient();

async function importTeachers() {
  try {
    // Path to teachers Excel file
    const filePath = path.join(__dirname, "Teachers", "Teachers Data.xlsx");

    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log(`Found ${sheetNames.length} sheets in Excel file`);

    let teachersCreated = 0;
    let classTeachersCreated = 0;

    // Iterate through each sheet (each represents a class/course)
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      if (!data || data.length < 3) {
        console.log(
          `⚠ Sheet "${sheetName}" has insufficient data, skipping...`,
        );
        continue;
      }

      console.log(`\nProcessing sheet: "${sheetName}"`);

      // Find the matching Class by name (sheet name)
      const classRecord = await prisma.class.findFirst({
        where: {
          name: sheetName,
        },
      });

      if (!classRecord) {
        console.log(
          `⚠ Could not find class with name "${sheetName}", skipping...`,
        );
        continue;
      }

      console.log(`✓ Found class: ${classRecord.name} (ID: ${classRecord.id})`);

      // Excel Format: Row 1 = Class name, Row 2 = Headers, Row 3+ = Data
      // Headers expected: Course Code (0), Course Title (1), Name of the faculty (2)
      // Data row: [course_code, course_title, "Faculty Name (mobile_number)"]

      // Process each row starting from row 3 (index 2)
      for (let i = 2; i < data.length; i++) {
        const row = data[i];

        if (!row || !row[2]) {
          continue; // Skip empty rows
        }

        // Extract teacher info from column 2 (faculty name column)
        let teacherInfo = String(row[2]).trim();
        // Each cell now contains only one teacher: "Name (phone)"
        const teacherEntries = [teacherInfo];

        // Extract course name from column 1 (Course Title)
        const courseName = row[1] ? String(row[1]).trim() : sheetName;
        // Extract course code from column 0 (Course Code)
        const courseCode = row[0] ? String(row[0]).trim() : "";

        if (!courseCode) {
          console.log(
            `⚠ Skipping row - no course code found for "${courseName}"`,
          );
          continue;
        }

        // Create or find the Course for this specific class
        const course = await prisma.course.upsert({
          where: {
            classId_courseCode: {
              classId: classRecord.id,
              courseCode: courseCode,
            },
          },
          update: {
            subject: courseName,
          },
          create: {
            courseCode,
            subject: courseName,
            classId: classRecord.id,
          },
        });

        // Process each teacher in the cell
        for (const entry of teacherEntries) {
          let teacherName = entry;
          let mobileNumber = null;

          // Extract mobile from parentheses: "Faculty Name (9999999999)"
          const mobileMatch = entry.match(/\((\d{10})\)/);
          if (mobileMatch) {
            mobileNumber = mobileMatch[1];
            teacherName = entry.substring(0, mobileMatch.index).trim();
          }

          if (!mobileNumber) {
            console.log(
              `⚠ Skipping teacher "${entry}" - no mobile number found`,
            );
            continue;
          }

          try {
            // Create or update teacher user
            const teacher = await prisma.user.upsert({
              where: { mobile: mobileNumber },
              update: {
                name: teacherName,
              },
              create: {
                name: teacherName,
                mobile: mobileNumber,
                password: generateRandomPassword(),
                role: "teacher",
              },
            });

            // Create or update ClassTeacher association
            await prisma.classTeacher.upsert({
              where: {
                classId_teacherId_courseId: {
                  classId: classRecord.id,
                  teacherId: teacher.id,
                  courseId: course.id,
                },
              },
              update: {},
              create: {
                classId: classRecord.id,
                teacherId: teacher.id,
                courseId: course.id,
              },
            });

            console.log(
              `✓ Added: ${teacherName} (${mobileNumber}) for ${courseName}`,
            );
            classTeachersCreated++;
          } catch (error) {
            console.error(
              `✗ Error adding teacher ${teacherName} (${mobileNumber}):`,
              error.message,
            );
          }
        }
      }
    }

    console.log(
      `\n✓ Teachers import complete! Added/linked ${classTeachersCreated} teacher-class associations.`,
    );
  } catch (error) {
    console.error("Error importing teachers:", error);
    throw error;
  }
}

module.exports = importTeachers;
