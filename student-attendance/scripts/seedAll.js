// Import all seed scripts
const seedAdmin = require("./seedAdmin");
const seedDefaultTeacher = require("./seedDefaultTeacher");
const seedDepartmentsAndClasses = require("./seedDepartmentsAndClasses");
const importStudents = require("./importStudents");
const seedAttendance = require("./seedAttendance");

async function runAllSeeds() {
  try {
    await seedAdmin();
    await seedDefaultTeacher();
    await seedDepartmentsAndClasses();
    await importStudents();
    await seedAttendance();
    console.log("All seeds executed successfully.");
  } catch (error) {
    console.error("Error running seeds:", error);
    process.exit(1);
  }
}

runAllSeeds();
