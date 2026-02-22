import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Calculate dashboard statistics for a date range
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to"); // YYYY-MM-DD
    const type = searchParams.get("type") || "whole"; // whole, program, department, class
    const program = searchParams.get("program");
    const department = searchParams.get("department");
    const classId = searchParams.get("classId");

    if (!from || !to) {
      return NextResponse.json(
        { success: false, message: "from and to dates are required" },
        { status: 400 },
      );
    }

    const startDate = new Date(from + "T00:00:00.000Z");
    const endDate = new Date(to + "T23:59:59.999Z");

    // Determine which classes to fetch based on type
    let classesToFetch = [];
    if (type === "whole") {
      const res = await prisma.class.findMany();
      classesToFetch = res;
    } else if (type === "program" && program) {
      const res = await prisma.class.findMany({
        where: {
          department: {
            programName: program,
          },
        },
      });
      classesToFetch = res;
    } else if (type === "department" && department) {
      const res = await prisma.class.findMany({
        where: {
          departmentId: parseInt(department),
        },
      });
      classesToFetch = res;
    } else if (type === "class" && classId) {
      classesToFetch = [
        await prisma.class.findUnique({
          where: { id: parseInt(classId) },
        }),
      ].filter((c) => c);
    }

    if (classesToFetch.length === 0) {
      return NextResponse.json({
        success: true,
        totalStudents: 0,
        avgPresent: 0,
        avgAbsent: 0,
        avgAttendancePercent: 0,
        daysCount: 0,
        message: "No classes found for the selected criteria",
      });
    }

    // Build holiday dates set (Sundays + Holiday locks)
    const sundayDates = new Set();

    // Add all Sundays
    let current = new Date(startDate);
    while (current <= endDate) {
      if (current.getUTCDay() === 0) {
        const sundayStr = current.toISOString().split("T")[0];
        sundayDates.add(sundayStr);
      }
      current.setDate(current.getDate() + 1);
    }

    // Fetch attendance data for all classes
    const globalDailyStats = {};
    let totalStudents = new Set();
    let totalRecords = 0;

    for (const classItem of classesToFetch) {
      // Get all students in this class
      const students = await prisma.student.findMany({
        where: { classId: classItem.id },
      });
      students.forEach((s) => totalStudents.add(s.id));

      // Build class-specific holidays (Sundays + class locks)
      const classHolidayDates = new Set(sundayDates);
      const locks = await prisma.holidayLock.findMany({
        where: {
          classId: classItem.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      locks.forEach((lock) => {
        const lockDateStr = lock.date.toISOString().split("T")[0];
        classHolidayDates.add(lockDateStr);
      });

      // Get attendance records
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          classId: classItem.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Accumulate daily stats (skip this class's holidays)
      attendanceRecords.forEach((record) => {
        const dateStr = record.date.toISOString().split("T")[0];

        // Skip this class's holidays/Sundays
        if (classHolidayDates.has(dateStr)) {
          return;
        }

        if (!globalDailyStats[dateStr]) {
          globalDailyStats[dateStr] = { present: 0, absent: 0 };
        }

        totalRecords++;
        if (record.status === "absent") {
          globalDailyStats[dateStr].absent++;
        } else if (record.status === "present") {
          globalDailyStats[dateStr].present++;
        }
      });
    }

    // Calculate averages
    const dailyValues = Object.values(globalDailyStats);
    const daysCount = dailyValues.length;

    let avgPresent = 0;
    let avgAbsent = 0;
    let avgAttendancePercent = 0;

    if (daysCount > 0) {
      const totalPresent = dailyValues.reduce(
        (sum, day) => sum + day.present,
        0,
      );
      const totalAbsent = dailyValues.reduce((sum, day) => sum + day.absent, 0);

      avgPresent = totalPresent / daysCount;
      avgAbsent = totalAbsent / daysCount;

      if (totalRecords > 0) {
        avgAttendancePercent = (totalPresent / totalRecords) * 100;
      }
    }

    return NextResponse.json({
      success: true,
      totalStudents: totalStudents.size,
      avgPresent: parseFloat(avgPresent.toFixed(2)),
      avgAbsent: parseFloat(avgAbsent.toFixed(2)),
      avgAttendancePercent: parseFloat(avgAttendancePercent.toFixed(2)),
      daysCount,
      dateRange: { from, to },
      classesCount: classesToFetch.length,
      totalRecords,
      sundayDatesCount: sundayDates.size,
    });
  } catch (error) {
    console.error("Failed to calculate dashboard stats:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to calculate stats",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
