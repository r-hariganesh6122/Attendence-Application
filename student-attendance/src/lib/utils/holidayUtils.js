import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get all holidays that apply to a specific class (checks all hierarchy levels)
 * Returns holidays from class, department, and institution levels
 */
export async function getApplicableHolidays(classId, dateFrom, dateTo) {
  try {
    const classObj = await prisma.class.findUnique({
      where: { id: classId },
      select: { departmentId: true },
    });

    if (!classObj) {
      return [];
    }

    // Fetch holidays at all levels
    const [classHolidays, deptHolidays, institutionHolidays] =
      await Promise.all([
        // Class-level holidays
        prisma.holidayLock.findMany({
          where: {
            classId,
            date: {
              gte: new Date(dateFrom + "T00:00:00.000Z"),
              lte: new Date(dateTo + "T23:59:59.999Z"),
            },
          },
        }),
        // Department-level holidays
        prisma.holidayLock.findMany({
          where: {
            class: {
              departmentId: classObj.departmentId,
            },
            date: {
              gte: new Date(dateFrom + "T00:00:00.000Z"),
              lte: new Date(dateTo + "T23:59:59.999Z"),
            },
          },
          select: {
            id: true,
            date: true,
            reason: true,
            lockedAt: true,
            lockedBy: true,
          },
        }),
        // Institution-level holidays
        prisma.holidayLock.findMany({
          where: {
            class: {
              department: {
                programId: {
                  not: undefined,
                },
              },
            },
            date: {
              gte: new Date(dateFrom + "T00:00:00.000Z"),
              lte: new Date(dateTo + "T23:59:59.999Z"),
            },
          },
          select: {
            date: true,
            reason: true,
          },
        }),
      ]);

    // Combine and mark hierarchy level
    const holidays = [
      ...classHolidays.map((h) => ({ ...h, level: "class" })),
      ...deptHolidays.map((h) => ({ ...h, level: "department" })),
      ...institutionHolidays.map((h) => ({ ...h, level: "institution" })),
    ];

    return holidays;
  } catch (error) {
    console.error("Error fetching applicable holidays:", error);
    return [];
  }
}

/**
 * Get all Sundays between two dates
 */
export function getAllSundays(dateFrom, dateTo) {
  const sundays = [];
  const startDate = new Date(dateFrom + "T00:00:00.000Z");
  const endDate = new Date(dateTo + "T23:59:59.999Z");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getUTCDay() === 0) {
      // 0 = Sunday
      sundays.push(new Date(d));
    }
  }

  return sundays;
}

/**
 * Calculate total working days for a class
 * Working days = calendar days - holidays - Sundays
 */
export async function calculateWorkingDays(classId, dateFrom, dateTo) {
  try {
    const startDate = new Date(dateFrom + "T00:00:00.000Z");
    const endDate = new Date(dateTo + "T23:59:59.999Z");

    // Count total calendar days
    const totalDays =
      Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Get applicable holidays
    const holidays = await getApplicableHolidays(classId, dateFrom, dateTo);

    // Get all Sundays
    const sundays = getAllSundays(dateFrom, dateTo);

    // Count unique dates that are holidays or Sundays
    const lockedDates = new Set();

    holidays.forEach((h) => {
      lockedDates.add(h.date.toISOString().split("T")[0]);
    });

    sundays.forEach((s) => {
      lockedDates.add(s.toISOString().split("T")[0]);
    });

    const workingDays = totalDays - lockedDates.size;
    return Math.max(0, workingDays);
  } catch (error) {
    console.error("Error calculating working days:", error);
    return 0;
  }
}

/**
 * Calculate absence count for a student
 * Counts only attendance records with status="absent"
 */
export async function calculateAbsentCount(studentId, dateFrom, dateTo) {
  try {
    const absentCount = await prisma.attendance.count({
      where: {
        studentId,
        status: "absent",
        date: {
          gte: new Date(dateFrom + "T00:00:00.000Z"),
          lte: new Date(dateTo + "T23:59:59.999Z"),
        },
      },
    });

    return absentCount;
  } catch (error) {
    console.error("Error calculating absent count:", error);
    return 0;
  }
}

/**
 * Flatten holidays by hierarchy level
 * Returns only the highest applicable level to avoid duplicate display in reports
 */
export function flattenHolidaysByHierarchy(holidays) {
  const dateMap = new Map();

  // For each date, keep only the highest level (institution > department > class)
  holidays.forEach((holiday) => {
    const dateStr = holiday.date.toISOString().split("T")[0];
    const levelPriority = { institution: 3, department: 2, class: 1 };

    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, holiday);
    } else {
      const existing = dateMap.get(dateStr);
      if (levelPriority[holiday.level] > levelPriority[existing.level]) {
        dateMap.set(dateStr, holiday);
      }
    }
  });

  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
}

/**
 * Check if a date is a Sunday
 */
export function isSunday(date) {
  const dateObj = new Date(
    typeof date === "string" ? date + "T00:00:00.000Z" : date,
  );
  return dateObj.getUTCDay() === 0;
}

/**
 * Fetch all holiday locks for a department (all classes in the department)
 */
export async function getDepartmentHolidays(departmentId, dateFrom, dateTo) {
  try {
    const holidays = await prisma.holidayLock.findMany({
      where: {
        class: {
          departmentId,
        },
        date: {
          gte: new Date(dateFrom + "T00:00:00.000Z"),
          lte: new Date(dateTo + "T23:59:59.999Z"),
        },
      },
      include: {
        class: {
          select: {
            name: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        lockedByUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return holidays;
  } catch (error) {
    console.error("Error fetching department holidays:", error);
    return [];
  }
}

/**
 * Fetch all holiday locks for the institution
 */
export async function getInstitutionHolidays(dateFrom, dateTo) {
  try {
    const holidays = await prisma.holidayLock.findMany({
      where: {
        date: {
          gte: new Date(dateFrom + "T00:00:00.000Z"),
          lte: new Date(dateTo + "T23:59:59.999Z"),
        },
      },
      include: {
        class: {
          select: {
            name: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        lockedByUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return holidays;
  } catch (error) {
    console.error("Error fetching institution holidays:", error);
    return [];
  }
}
