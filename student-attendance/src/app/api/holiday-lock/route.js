import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/authMiddleware";

const prisma = new PrismaClient();

// GET: Check if a date is holiday-locked for a class or list all holiday locks
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
      // Fetch all holiday locks for the class
      const locks = await prisma.holidayLock.findMany({
        where: {
          classId: parseInt(classId),
        },
        include: {
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

      const formattedLocks = locks.map((lock) => ({
        id: lock.id,
        classId: lock.classId,
        date: lock.date.toISOString().split("T")[0],
        reason: lock.reason || "No reason provided",
        lockedBy: lock.lockedByUser?.name || "Unknown",
        lockedAt: lock.lockedAt,
      }));

      console.log("GET /api/holiday-lock - Returning locks:", {
        classId,
        lockCount: locks.length,
        locks: locks.map((l) => ({
          date: l.date.toISOString().split("T")[0],
          reason: l.reason,
          lockedBy: l.lockedBy,
        })),
      });

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

    const lock = await prisma.holidayLock.findUnique({
      where: {
        classId_date: {
          classId: parseInt(classId),
          date: new Date(date + "T00:00:00.000Z"),
        },
      },
      include: {
        lockedByUser: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      isLocked: !!lock,
      lock: lock && {
        id: lock.id,
        date: lock.date.toISOString().split("T")[0],
        reason: lock.reason,
        lockedBy: lock.lockedByUser?.name,
      },
    });
  } catch (error) {
    console.error("GET /api/holiday-lock error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// POST: Create a holiday lock
export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { classId, date, reason } = body;

    if (!classId || !date || !reason) {
      return NextResponse.json(
        { success: false, message: "classId, date, and reason are required" },
        { status: 400 },
      );
    }

    const dateObj = new Date(date + "T00:00:00.000Z");

    const lock = await prisma.holidayLock.upsert({
      where: {
        classId_date: {
          classId: parseInt(classId),
          date: dateObj,
        },
      },
      update: {
        reason,
        lockedAt: new Date(),
        lockedBy: user.id,
      },
      create: {
        classId: parseInt(classId),
        date: dateObj,
        reason,
        lockedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Holiday locked successfully",
      lock,
    });
  } catch (error) {
    console.error("POST /api/holiday-lock error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// PUT: Update holiday lock reason
export async function PUT(request) {
  try {
    const user = await authenticateRequest(request);
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { classId, date, reason } = body;

    if (!classId || !date || !reason) {
      return NextResponse.json(
        { success: false, message: "classId, date, and reason are required" },
        { status: 400 },
      );
    }

    const dateObj = new Date(date + "T00:00:00.000Z");

    const lock = await prisma.holidayLock.update({
      where: {
        classId_date: {
          classId: parseInt(classId),
          date: dateObj,
        },
      },
      data: {
        reason,
        lockedAt: new Date(),
        lockedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Holiday lock updated successfully",
      lock,
    });
  } catch (error) {
    console.error("PUT /api/holiday-lock error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// DELETE: Remove a holiday lock
export async function DELETE(request) {
  try {
    const user = await authenticateRequest(request);
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const date = searchParams.get("date");

    if (!classId || !date) {
      return NextResponse.json(
        { success: false, message: "classId and date are required" },
        { status: 400 },
      );
    }

    const dateObj = new Date(date + "T00:00:00.000Z");

    await prisma.holidayLock.delete({
      where: {
        classId_date: {
          classId: parseInt(classId),
          date: dateObj,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Holiday lock removed successfully",
    });
  } catch (error) {
    console.error("DELETE /api/holiday-lock error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
