// Import all seed scripts
const seedAdmin = require("./seedAdmin");
const seedDefaultTeacher = require("./seedDefaultTeacher");
const seedDepartmentsAndClasses = require("./seedDepartmentsAndClasses");
const assignDefaultTeacherToAllClasses = require("./assignDefaultTeacherToAllClasses");
const importTeachers = require("./importTeachers");
const importStudents = require("./importStudents");
const importAcademicCoordinators = require("./importAcademicCoordinators");
const seedAttendance = require("./seedAttendance");
const seedSpecialHolidays = require("./seedSpecialHolidays");
const hashExistingPasswords = require("./hashExistingPasswords");

async function runAllSeeds() {
  try {
    await seedAdmin();
    await seedDefaultTeacher();
    await seedDepartmentsAndClasses();
    await assignDefaultTeacherToAllClasses();
    await importTeachers();
    await importStudents();
    await importAcademicCoordinators();
    await seedAttendance();
    await seedSpecialHolidays();
    await hashExistingPasswords();
    console.log("All seeds executed successfully.");
    console.log(
      "Note: Sunday locking is now automated and will run on app startup.",
    );
  } catch (error) {
    console.error("Error running seeds:", error);
    process.exit(1);
  }
}

runAllSeeds();
