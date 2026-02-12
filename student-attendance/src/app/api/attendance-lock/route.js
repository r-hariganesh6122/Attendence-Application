import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/authMiddleware";

const prisma = new PrismaClient();

// GET: Check if attendance is locked for a specific date and class
// or list all locked dates for a class if listAll=true
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const date = searchParams.get("date");
    const listAll = searchParams.get("listAll");

    if (!classId) {
      return NextResponse.json(
        { success: false, message: "classId is required" },
        { status: 400 },
      );
    }

    if (listAll === "true") {
      // Fetch all locked dates for the class
      const locks = await prisma.attendanceLock.findMany({
        where: {
          classId: parseInt(classId),
          isLocked: true,
        },
        include: {
          lockedByUser: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      const formattedLocks = locks.map((lock) => ({
        date: lock.date.toISOString().split("T")[0],
        reason: lock.reason || "No reason provided",
        lockedBy: lock.lockedByUser?.name || "Unknown",
      }));

      return NextResponse.json({
        success: true,
        locks: formattedLocks,
      });
    }

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "date is required when listAll is not true",
        },
        { status: 400 },
      );
    }

    const lock = await prisma.attendanceLock.findUnique({
      where: {
        classId_date: {
          classId: parseInt(classId),
          date: new Date(date + "T00:00:00.000Z"),
        },
      },
    });

    return NextResponse.json({
      success: true,
      isLocked: lock?.isLocked || false,
      lock: lock || null,
    });
  } catch (error) {
    console.error("GET /api/attendance-lock error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// POST: Create or update attendance lock
export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { classId, date, isLocked, reason } = body;

    if (!classId || !date) {
      return NextResponse.json(
        { success: false, message: "classId and date are required" },
        { status: 400 },
      );
    }

    const dateObj = new Date(date + "T00:00:00.000Z");

    const lock = await prisma.attendanceLock.upsert({
      where: {
        classId_date: {
          classId: parseInt(classId),
          date: dateObj,
        },
      },
      update: {
        isLocked,
        lockedAt: isLocked ? new Date() : null,
        lockedBy: isLocked ? user.id : null,
        reason: isLocked ? reason : null,
      },
      create: {
        classId: parseInt(classId),
        date: dateObj,
        isLocked,
        lockedAt: isLocked ? new Date() : null,
        lockedBy: isLocked ? user.id : null,
        reason: isLocked ? reason : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: isLocked ? "Attendance locked" : "Attendance unlocked",
      lock,
    });
  } catch (error) {
    console.error("POST /api/attendance-lock error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
