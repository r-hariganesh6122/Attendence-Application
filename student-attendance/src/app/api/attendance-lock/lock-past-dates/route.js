import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/authMiddleware";

const prisma = new PrismaClient();

// POST: Auto-lock all past dates for a class
export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    // Verify user exists in database and get their ID
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { classId } = body;

    if (!classId) {
      return NextResponse.json(
        { success: false, message: "classId is required" },
        { status: 400 },
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all attendance records for this class that are before today
    const pastAttendance = await prisma.attendance.findMany({
      where: {
        classId: parseInt(classId),
        date: {
          lt: today,
        },
      },
      select: {
        date: true,
      },
      distinct: ["date"],
    });

    // Get unique past dates
    const pastDates = [...new Set(pastAttendance.map((a) => a.date))];

    let lockedCount = 0;

    // For each past date, create a lock record if it doesn't exist
    for (const dateObj of pastDates) {
      const dateStr = dateObj.toISOString().split("T")[0];
      const dateForDB = new Date(dateStr + "T00:00:00.000Z");

      try {
        await prisma.attendanceLock.upsert({
          where: {
            classId_date: {
              classId: parseInt(classId),
              date: dateForDB,
            },
          },
          update: {
            isLocked: true,
            lockedAt: new Date(),
            lockedBy: dbUser.id,
            reason: "Auto-locked (previous date)",
          },
          create: {
            classId: parseInt(classId),
            date: dateForDB,
            isLocked: true,
            lockedAt: new Date(),
            lockedBy: dbUser.id,
            reason: "Auto-locked (previous date)",
          },
        });
        lockedCount++;
      } catch (error) {
        console.error(`Failed to lock date ${dateStr}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-locked ${lockedCount} past dates`,
      lockedCount,
    });
  } catch (error) {
    console.error("POST /api/attendance-lock/lock-past-dates error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
