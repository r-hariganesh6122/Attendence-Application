// scripts/assignDefaultTeacherToAllClasses.js
// Assigns the default teacher to all classes as ClassTeacher

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function assignDefaultTeacherToAllClasses() {
  const teacher = await prisma.user.findFirst({
    where: { email: "default.teacher@example.com", role: "teacher" },
  });
  if (!teacher) {
    console.error("Default teacher not found.");
    return;
  }

  const classes = await prisma.class.findMany();
  for (const cls of classes) {
    await prisma.classTeacher.upsert({
      where: {
        classId_teacherId_subject: {
          classId: cls.id,
          teacherId: teacher.id,
          subject: "General",
        },
      },
      update: {},
      create: {
        classId: cls.id,
        teacherId: teacher.id,
        subject: "General",
      },
    });
  }
  await prisma.$disconnect();
  console.log("Default teacher assigned to all classes.");
}

assignDefaultTeacherToAllClasses();
