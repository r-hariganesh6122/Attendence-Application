const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function randomHolidayReason() {
  const reasons = [
    "Development",
    "Training",
    "Conference",
    "Workshop",
    "Special Event",
    "Maintenance",
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

/**
 * Lock special holidays for different levels using deterministic selection
 * - Institution holiday: random day for all classes
 * - Department holiday (CSE): different random day for CSE classes only
 * - Class holiday (AIDS-A): another random day for AIDS-A class only
 */
async function seedSpecialHolidays() {
  try {
    console.log("Seeding special holidays (Institution, Department, Class)...");

    // Get all classes with department info
    const allClasses = await prisma.class.findMany({
      include: { department: true },
    });

    if (allClasses.length === 0) {
      console.log("No classes found");
      return;
    }

    // Get or create system admin user for locking
    let adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    if (!adminUser) {
      console.log("Creating system admin for holiday locking...");
      adminUser = await prisma.user.create({
        data: {
          name: "System Holiday Manager",
          mobile: "system-holiday-mgr-" + Date.now(),
          role: "admin",
          passwordHash: "auto-locked",
        },
      });
    }

    // Use local date (YYYY-MM-DD) for attendance
    const now = new Date();
    const utcDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const yyyy = utcDate.getUTCFullYear();
    const mm = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(utcDate.getUTCDate()).padStart(2, "0");
    const todayString = `${yyyy}-${mm}-${dd}`;

    // Get all weekdays (not Sunday) in the 7-day range
    const weekdaysInRange = [];
    for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
      const checkDate = new Date(
        Date.UTC(yyyy, utcDate.getUTCMonth(), utcDate.getUTCDate() + dayOffset),
      );

      if (checkDate.getUTCDay() !== 0) {
        // Not Sunday
        const checkYYYY = checkDate.getUTCFullYear();
        const checkMM = String(checkDate.getUTCMonth() + 1).padStart(2, "0");
        const checkDD = String(checkDate.getUTCDate()).padStart(2, "0");
        const dateString = `${checkYYYY}-${checkMM}-${checkDD}`;
        weekdaysInRange.push({
          offset: dayOffset,
          dateString: dateString,
          date: new Date(dateString + "T00:00:00.000Z"),
        });
      }
    }

    // Select 3 different weekdays deterministically using day of month as seed
    const dayOfMonth = utcDate.getUTCDate();
    const institutionIdx = dayOfMonth % weekdaysInRange.length;
    const deptIdx =
      (dayOfMonth + 1) % weekdaysInRange.length === institutionIdx
        ? (dayOfMonth + 2) % weekdaysInRange.length
        : (dayOfMonth + 1) % weekdaysInRange.length;
    const classIdx = [institutionIdx, deptIdx].includes(
      (dayOfMonth + 3) % weekdaysInRange.length,
    )
      ? (dayOfMonth + 4) % weekdaysInRange.length
      : (dayOfMonth + 3) % weekdaysInRange.length;

    const institutionHoliday = weekdaysInRange[institutionIdx];
    const deptHoliday = weekdaysInRange[deptIdx];
    const classHoliday = weekdaysInRange[classIdx];

    const institutionReason = randomHolidayReason();
    const deptReason = randomHolidayReason();
    const classReason = randomHolidayReason();

    console.log(
      `Institution holiday: ${institutionHoliday.dateString} - ${institutionReason}`,
    );
    console.log(
      `Department (CSE) holiday: ${deptHoliday.dateString} - ${deptReason}`,
    );
    console.log(
      `Class (AIDS-A) holiday: ${classHoliday.dateString} - ${classReason}`,
    );

    let lockedCount = 0;

    // First lock all Sundays for all classes
    const sundaysToLock = [];
    for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
      const dateToCheck = new Date(
        Date.UTC(yyyy, utcDate.getUTCMonth(), utcDate.getUTCDate() + dayOffset),
      );
      if (dateToCheck.getUTCDay() === 0) {
        sundaysToLock.push(dateToCheck);
      }
    }

    console.log(`Found ${sundaysToLock.length} Sundays to lock in the range`);

    for (const sundayDate of sundaysToLock) {
      for (const classObj of allClasses) {
        try {
          const result = await prisma.holidayLock.upsert({
            where: {
              classId_date: {
                classId: classObj.id,
                date: sundayDate,
              },
            },
            update: {
              reason: "Sunday",
              lockedBy: adminUser.id,
            },
            create: {
              classId: classObj.id,
              date: sundayDate,
              reason: "Sunday",
              lockedBy: adminUser.id,
            },
          });

          if (result) {
            lockedCount++;
          }
        } catch (error) {
          console.error(
            `Failed to lock Sunday ${sundayDate.toDateString()} for class ${classObj.id}:`,
            error.message,
          );
        }
      }
    }

    console.log(`✓ Successfully locked ${lockedCount} Sundays`);

    let institutionLockedCount = 0;

    // Lock institution holiday for ALL classes
    for (const classObj of allClasses) {
      try {
        const result = await prisma.holidayLock.upsert({
          where: {
            classId_date: {
              classId: classObj.id,
              date: institutionHoliday.date,
            },
          },
          update: {
            reason: institutionReason,
            lockedBy: adminUser.id,
          },
          create: {
            classId: classObj.id,
            date: institutionHoliday.date,
            reason: institutionReason,
            lockedBy: adminUser.id,
          },
        });

        if (result) {
          institutionLockedCount++;
        }
      } catch (error) {
        console.error(
          `Failed to lock institution holiday ${institutionHoliday.dateString} for class ${classObj.id}:`,
          error.message,
        );
      }
    }

    console.log(
      `✓ Successfully locked institution holiday for ${institutionLockedCount} classes`,
    );

    // Lock department (CSE) holiday for CSE classes only
    let deptLockedCount = 0;
    const cseClasses = allClasses.filter(
      (c) => c.department?.name?.toUpperCase() === "CSE",
    );

    for (const classObj of cseClasses) {
      try {
        const result = await prisma.holidayLock.upsert({
          where: {
            classId_date: {
              classId: classObj.id,
              date: deptHoliday.date,
            },
          },
          update: {
            reason: deptReason,
            lockedBy: adminUser.id,
          },
          create: {
            classId: classObj.id,
            date: deptHoliday.date,
            reason: deptReason,
            lockedBy: adminUser.id,
          },
        });

        if (result) {
          deptLockedCount++;
        }
      } catch (error) {
        console.error(
          `Failed to lock department holiday ${deptHoliday.dateString} for class ${classObj.id}:`,
          error.message,
        );
      }
    }

    console.log(
      `✓ Successfully locked department holiday for ${deptLockedCount} CSE classes`,
    );

    // Lock class (AIDS-A) holiday for AIDS-A class only
    let classLockedCount = 0;
    const aidsAClasses = allClasses.filter(
      (c) => c.name?.toUpperCase() === "AIDS-A",
    );

    for (const classObj of aidsAClasses) {
      try {
        const result = await prisma.holidayLock.upsert({
          where: {
            classId_date: {
              classId: classObj.id,
              date: classHoliday.date,
            },
          },
          update: {
            reason: classReason,
            lockedBy: adminUser.id,
          },
          create: {
            classId: classObj.id,
            date: classHoliday.date,
            reason: classReason,
            lockedBy: adminUser.id,
          },
        });

        if (result) {
          classLockedCount++;
        }
      } catch (error) {
        console.error(
          `Failed to lock class holiday ${classHoliday.dateString} for class ${classObj.id}:`,
          error.message,
        );
      }
    }

    console.log(
      `✓ Successfully locked class holiday for ${classLockedCount} AIDS-A class(es)`,
    );

    console.log("Special holidays seeding complete!");
  } catch (error) {
    console.error("Error seeding special holidays:", error);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = seedSpecialHolidays;
