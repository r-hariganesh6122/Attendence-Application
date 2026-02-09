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

  // Create or find the "General" course
  const course = await prisma.course.upsert({
    where: { courseCode: "GEN001" },
    update: {},
    create: {
      courseCode: "GEN001",
      subject: "General",
    },
  });

  const classes = await prisma.class.findMany();
  let count = 0;
  for (const cls of classes) {
    try {
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
