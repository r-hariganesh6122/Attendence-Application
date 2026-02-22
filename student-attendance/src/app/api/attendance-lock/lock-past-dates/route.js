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
    // Ensure ID is a valid number
    const userId =
      typeof user.id === "string" ? parseInt(user.id, 10) : user.id;

    if (isNaN(userId)) {
      console.error("Invalid user ID in token:", user.id);
      return NextResponse.json(
        { success: false, message: "Invalid user ID in token" },
        { status: 400 },
      );
    }

    console.log("Lock past dates - User from token:", {
      id: user.id,
      parsedId: userId,
      name: user.name,
      role: user.role,
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, mobile: true },
    });

    console.log("Lock past dates - DB Lookup result:", {
      found: !!dbUser,
      searchedId: userId,
      result: dbUser,
    });

    if (!dbUser) {
      console.error(
        "User not found in database. ID searched:",
        userId,
        "Token user:",
        user,
      );
      return NextResponse.json(
        { success: false, message: "User not found in database" },
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
