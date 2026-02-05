// Import all seed scripts
const seedAdmin = require("./seedAdmin");
const seedDefaultTeacher = require("./seedDefaultTeacher");
const seedDepartmentsAndClasses = require("./seedDepartmentsAndClasses");

async function runAllSeeds() {
  try {
    await seedAdmin();
    await seedDefaultTeacher();
    await seedDepartmentsAndClasses();
    console.log("All seeds executed successfully.");
  } catch (error) {
    console.error("Error running seeds:", error);
    process.exit(1);
  }
}

runAllSeeds();
