import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/authMiddleware";

const prisma = new PrismaClient();

// POST: Bulk lock attendance for institution, department, or class
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

    console.log("Bulk lock - User from token:", {
      id: user.id,
      parsedId: userId,
      role: user.role,
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, mobile: true },
    });

    console.log("Bulk lock - DB Lookup result:", {
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
    const {
      lockType,
      departmentId,
      classId,
      date,
      dateFrom,
      dateTo,
      isLocked,
      reason,
    } = body;

    if (!lockType) {
      return NextResponse.json(
        { success: false, message: "lockType is required" },
        { status: 400 },
      );
    }

    // Validate date inputs
    if (!date && (!dateFrom || !dateTo)) {
      return NextResponse.json(
        {
          success: false,
          message: "Either date or both dateFrom and dateTo are required",
        },
        { status: 400 },
      );
    }

    // Build array of dates to lock
    let datesToLock = [];

    if (date) {
      // Single date
      datesToLock = [new Date(date + "T00:00:00.000Z")];
    } else {
      // Date range
      const startDate = new Date(dateFrom + "T00:00:00.000Z");
      const endDate = new Date(dateTo + "T00:00:00.000Z");

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        datesToLock.push(new Date(d));
      }
    }
    let targetClassIds = [];

    // Determine which classes to lock based on lock type
    if (lockType === "whole") {
      // Get all classes in the institution
      const allClasses = await prisma.class.findMany({
        select: { id: true },
      });
      targetClassIds = allClasses.map((c) => c.id);
    } else if (lockType === "department") {
      if (!departmentId) {
        return NextResponse.json(
          {
            success: false,
            message: "departmentId is required for department lock",
          },
          { status: 400 },
        );
      }
      // Get all classes in the department
      const deptClasses = await prisma.class.findMany({
        where: { departmentId: parseInt(departmentId) },
        select: { id: true },
      });
      targetClassIds = deptClasses.map((c) => c.id);
    } else if (lockType === "class") {
      if (!classId) {
        return NextResponse.json(
          { success: false, message: "classId is required for class lock" },
          { status: 400 },
        );
      }
      targetClassIds = [parseInt(classId)];
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid lockType" },
        { status: 400 },
      );
    }

    // Lock all target classes for the specified dates
    let lockedCount = 0;

    for (const dateObj of datesToLock) {
      for (const cId of targetClassIds) {
        try {
          await prisma.attendanceLock.upsert({
            where: {
              classId_date: {
                classId: cId,
                date: dateObj,
              },
            },
            update: {
              isLocked,
              lockedAt: isLocked ? new Date() : null,
              lockedBy: isLocked ? dbUser.id : null,
              reason: isLocked ? reason : null,
            },
            create: {
              classId: cId,
              date: dateObj,
              isLocked,
              lockedAt: isLocked ? new Date() : null,
              lockedBy: isLocked ? dbUser.id : null,
              reason: isLocked ? reason : null,
            },
          });
          lockedCount++;
        } catch (error) {
          console.error(`Failed to lock class ${cId} on ${dateObj}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: isLocked
        ? `Attendance locked for ${lockedCount} class(es)`
        : `Attendance unlocked for ${lockedCount} class(es)`,
      lockedCount,
    });
  } catch (error) {
    console.error("POST /api/attendance-lock/bulk-lock error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
