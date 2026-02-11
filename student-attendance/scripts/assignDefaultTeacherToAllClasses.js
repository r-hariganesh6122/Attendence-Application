// scripts/assignDefaultTeacherToAllClasses.js
// Assigns the default teacher to all classes as ClassTeacher

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function assignDefaultTeacherToAllClasses() {
  const teacher = await prisma.user.findFirst({
    where: { mobile: "9999999999", role: "teacher" },
  });
  if (!teacher) {
    console.error("Default teacher not found.");
    return;
  }

  const classes = await prisma.class.findMany();
  let count = 0;
  for (const cls of classes) {
    try {
      // Create or find the "General" course for this specific class
      const course = await prisma.course.upsert({
        where: {
          classId_courseCode: {
            classId: cls.id,
            courseCode: "GEN001",
          },
        },
        update: {},
        create: {
          courseCode: "GEN001",
          subject: "General",
          classId: cls.id,
        },
      });

      await prisma.classTeacher.upsert({
        where: {
          classId_teacherId_courseId: {
            classId: cls.id,
            teacherId: teacher.id,
            courseId: course.id,
          },
        },
        update: {},
        create: {
          classId: cls.id,
          teacherId: teacher.id,
          courseId: course.id,
        },
      });
      count++;
    } catch (error) {
      console.error(
        `Failed to assign teacher to class ${cls.name}:`,
        error.message,
      );
    }
  }
  console.log(`✓ Default teacher assigned to ${count} classes`);
}

module.exports = assignDefaultTeacherToAllClasses;
