// Import all seed scripts
const seedAdmin = require("./seedAdmin");
const seedDefaultTeacher = require("./seedDefaultTeacher");
const seedDepartmentsAndClasses = require("./seedDepartmentsAndClasses");
const assignDefaultTeacherToAllClasses = require("./assignDefaultTeacherToAllClasses");
const importTeachers = require("./importTeachers");
const importStudents = require("./importStudents");
const seedAttendance = require("./seedAttendance");
const seedAttendance20260206 = require("./seedAttendance20260206");
const hashExistingPasswords = require("./hashExistingPasswords");

async function runAllSeeds() {
  try {
    await seedAdmin();
    await seedDefaultTeacher();
    await seedDepartmentsAndClasses();
    await assignDefaultTeacherToAllClasses();
    await importTeachers();
    await importStudents();
    await seedAttendance();
    await seedAttendance20260206();
    await hashExistingPasswords();
    console.log("All seeds executed successfully.");
  } catch (error) {
    console.error("Error running seeds:", error);
    process.exit(1);
  }
}

runAllSeeds();
