const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function randomInformed() {
  return Math.random() < 0.6;
}

// Generate random hour absences - realistic scenario
// Most students are present, only ~15% have any absences
function generateRandomHourAbsences() {
  const hours = [false, false, false, false, false, false, false];

  // 85% chance student is fully present
  if (Math.random() < 0.85) {
    return hours; // All present
  }

  // 15% chance of having 1-2 absent hours
  const numAbsentHours = Math.floor(Math.random() * 2) + 1; // 1 or 2 hours absent

  // Randomly select which hours are absent
  const indices = new Set();
  while (indices.size < numAbsentHours) {
    indices.add(Math.floor(Math.random() * 7));
  }

  indices.forEach((i) => {
    hours[i] = true;
  });

  return hours;
}

// Calculate session status from hourly absences
function calculateSessionStatus(hours) {
  const morningAbsent = hours[0] || hours[1] || hours[2] || hours[3]; // Hours 1-4
  const afternoonAbsent = hours[4] || hours[5] || hours[6]; // Hours 5-7

  if (morningAbsent && afternoonAbsent) {
    return "bothAbsent";
  } else if (morningAbsent) {
    return "morningAbsent";
  } else if (afternoonAbsent) {
    return "afternoonAbsent";
  } else {
    return "present";
  }
}

function randomReason() {
  const reasons = [
    "Sick",
    "Family Emergency",
    "Personal Work",
    "Travel",
    "Other",
    null,
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

async function seedAttendance() {
  const students = await prisma.student.findMany();
  const classes = await prisma.class.findMany({
    include: { department: true },
  });

  // Get today's date in UTC
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
      weekdaysInRange.push({ dateString });
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

  const institutionHolidayDate =
    weekdaysInRange[institutionIdx]?.dateString || null;
  const deptHolidayDate = weekdaysInRange[deptIdx]?.dateString || null;
  const classHolidayDate = weekdaysInRange[classIdx]?.dateString || null;

  console.log(`Institution holiday: ${institutionHolidayDate}`);
  console.log(`Department (CSE) holiday: ${deptHolidayDate}`);
  console.log(`Class (AIDS-A) holiday: ${classHolidayDate}`);

  // Get CSE department and AIDS-A class for filtering
  const cseDept = classes.find(
    (c) =>
      c.department &&
      c.department.name.toLowerCase() === "cse" &&
      c.department.name,
  )?.department;
  const aidsAClass = classes.find((c) => c.name.toLowerCase() === "aids-a");

  // Generate attendance for a week (7 days past including today)
  for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
    const currentDateUTC = new Date(
      Date.UTC(yyyy, utcDate.getUTCMonth(), utcDate.getUTCDate() + dayOffset),
    );

    // Skip Sundays - they will be handled by the automated Sunday locker
    if (currentDateUTC.getUTCDay() === 0) {
      const dateStr = `${currentDateUTC.getUTCFullYear()}-${String(currentDateUTC.getUTCMonth() + 1).padStart(2, "0")}-${String(currentDateUTC.getUTCDate()).padStart(2, "0")}`;
      console.log(`Skipping Sunday ${dateStr} (will be locked automatically)`);
      continue;
    }

    const currentYYYY = currentDateUTC.getUTCFullYear();
    const currentMM = String(currentDateUTC.getUTCMonth() + 1).padStart(2, "0");
    const currentDD = String(currentDateUTC.getUTCDate()).padStart(2, "0");
    const currentDateString = `${currentYYYY}-${currentMM}-${currentDD}`;

    // Convert date string to Date object for database (UTC)
    const attendanceDate = new Date(currentDateString + "T00:00:00.000Z");

    for (const classItem of classes) {
      // Check which holidays apply to this class
      let skipThisClass = false;

      // All classes skip institution holiday
      if (currentDateString === institutionHolidayDate) {
        skipThisClass = true;
      }

      // Only CSE classes skip department holiday
      if (
        currentDateString === deptHolidayDate &&
        cseDept &&
        classItem.departmentId === cseDept.id
      ) {
        skipThisClass = true;
      }

      // Only AIDS-A class skips class holiday
      if (
        currentDateString === classHolidayDate &&
        aidsAClass &&
        classItem.id === aidsAClass.id
      ) {
        skipThisClass = true;
      }

      if (skipThisClass) {
        if (currentDateString === institutionHolidayDate) {
          console.log(
            `Skipping ${classItem.name} on institution holiday ${currentDateString}`,
          );
        } else if (currentDateString === deptHolidayDate) {
          console.log(
            `Skipping ${classItem.name} (CSE) on department holiday ${currentDateString}`,
          );
        } else if (currentDateString === classHolidayDate) {
          console.log(
            `Skipping ${classItem.name} (AIDS-A) on class holiday ${currentDateString}`,
          );
        }
        continue;
      }

      // Get students for this class
      const classStudents = students.filter((s) => s.classId === classItem.id);

      for (const student of classStudents) {
        // Generate random hourly absences
        const hourAbsences = generateRandomHourAbsences();
        const status = calculateSessionStatus(hourAbsences);

        let informed = null;
        let absenceReason = null;

        // If any hour is absent, possibly add a reason and informed flag
        const hasAnyAbsence = hourAbsences.some((h) => h === true);
        if (hasAnyAbsence) {
          informed = randomInformed();
          absenceReason = randomReason();
          // Validation: if informed is true, absenceReason must not be null
          if (informed && !absenceReason) {
            // Re-select a reason that is not null
            const nonNullReasons = [
              "Sick",
              "Family Emergency",
              "Personal Work",
              "Travel",
              "Other",
            ];
            absenceReason =
              nonNullReasons[Math.floor(Math.random() * nonNullReasons.length)];
          }
        }

        await prisma.attendance.create({
          data: {
            date: attendanceDate,
            studentId: student.id,
            classId: student.classId,
            status,
            hour1Absent: hourAbsences[0],
            hour2Absent: hourAbsences[1],
            hour3Absent: hourAbsences[2],
            hour4Absent: hourAbsences[3],
            hour5Absent: hourAbsences[4],
            hour6Absent: hourAbsences[5],
            hour7Absent: hourAbsences[6],
            absenceReason,
            informed,
          },
        });

        console.log(
          `Attendance for ${student.studentName} on ${currentDateString} (${status}${
            hasAnyAbsence
              ? ", Hours: " +
                hourAbsences
                  .map((h, i) => (h ? i + 1 : null))
                  .filter((h) => h !== null)
                  .join(",")
              : ""
          })`,
        );
      }
    }
  }

  await prisma.$disconnect();
  console.log("Attendance seeding complete for the week.");
}

module.exports = seedAttendance;
