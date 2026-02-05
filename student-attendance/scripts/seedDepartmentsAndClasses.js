const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedDepartmentsAndClasses() {
  // Programs
  const programs = [{ name: "BE" }, { name: "BTech" }];

  // Get a valid teacherId
  const teacher = await prisma.user.findFirst({ where: { role: "teacher" } });
  if (!teacher) {
    throw new Error("No teacher found. Please seed a teacher first.");
  }
  const teacherId = teacher.id;

  // Departments and classes structure
  const structure = {
    BE: {
      AERO: [],
      BME: [],
      CIVIL: [],
      CSE: ["A", "B", "C", "D", "E"],
      "CSE-AIML": ["A", "B"],
      "CSE-IOT": [],
      "CYBER SECURITY": ["A", "B"],
      ECE: ["A", "B", "C"],
      EEE: [],
      MECHANICAL: [],
      MCT: [],
      "R&A": [],
    },
    BTech: {
      AGRI: [],
      AIDS: ["A", "B", "C"],
      "BIO-TECH": [],
      CHEMICAL: [],
      "FOOD-TECH": [],
      IT: ["A", "B", "C", "D"],
      PHARMA: [],
    },
  };

  for (const program of programs) {
    const prog = await prisma.program.upsert({
      where: { name: program.name },
      update: {},
      create: { name: program.name },
    });

    for (const [dept, classes] of Object.entries(structure[program.name])) {
      const department = await prisma.department.upsert({
        where: {
          name_programId: {
            name: dept,
            programId: prog.id,
          },
        },
        update: {},
        create: {
          name: dept,
          programId: prog.id,
        },
      });

      if (classes.length > 0) {
        for (const cls of classes) {
          await prisma.class.upsert({
            where: {
              name_departmentId: {
                name: `${dept}-${cls}`,
                departmentId: department.id,
              },
            },
            update: {},
            create: {
              name: `${dept}-${cls}`,
              departmentId: department.id,
              teacherId,
            },
          });
        }
      } else {
        await prisma.class.upsert({
          where: {
            name_departmentId: {
              name: dept,
              departmentId: department.id,
            },
          },
          update: {},
          create: {
            name: dept,
            departmentId: department.id,
            teacherId,
          },
        });
      }
    }
  }
}

module.exports = seedDepartmentsAndClasses;
