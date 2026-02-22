import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/authMiddleware";

const prisma = new PrismaClient();

// POST: Bulk lock/unlock holidays for institution, department, or class
export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 },
      );
    }

    // Verify user exists in database
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

    console.log("Holiday bulk lock - User from token:", {
      id: user.id,
      parsedId: userId,
      role: user.role,
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, mobile: true },
    });

    console.log("Holiday bulk lock - DB Lookup result:", {
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
      reason,
      action, // "lock" or "unlock"
    } = body;

    if (!lockType) {
      return NextResponse.json(
        { success: false, message: "lockType is required" },
        { status: 400 },
      );
    }

    if (!action || !["lock", "unlock"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "action must be 'lock' or 'unlock'" },
        { status: 400 },
      );
    }

    // For lock action, reason is required
    if (action === "lock" && !reason) {
      return NextResponse.json(
        { success: false, message: "reason is required for lock action" },
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

    // Build array of dates
    let datesToProcess = [];

    if (date) {
      // Single date
      datesToProcess = [new Date(date + "T00:00:00.000Z")];
    } else {
      // Date range
      const startDate = new Date(dateFrom + "T00:00:00.000Z");
      const endDate = new Date(dateTo + "T00:00:00.000Z");

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        datesToProcess.push(new Date(d));
      }
    }

    let targetClassIds = [];

    // Determine which classes to process based on lock type
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

    let processedCount = 0;

    // Process all target classes for the specified dates
    for (const cId of targetClassIds) {
      for (const dateObj of datesToProcess) {
        try {
          if (action === "lock") {
            // Create or update holiday lock
            await prisma.holidayLock.upsert({
              where: {
                classId_date: {
                  classId: cId,
                  date: dateObj,
                },
              },
              update: {
                reason,
                lockedAt: new Date(),
                lockedBy: dbUser.id,
              },
              create: {
                classId: cId,
                date: dateObj,
                reason,
                lockedBy: dbUser.id,
              },
            });
          } else {
            // Delete holiday lock
            await prisma.holidayLock.delete({
              where: {
                classId_date: {
                  classId: cId,
                  date: dateObj,
                },
              },
            });
          }
          processedCount++;
        } catch (error) {
          if (action === "unlock" && error.code === "P2025") {
            // Record not found when trying to delete - that's OK for unlock
            processedCount++;
          } else {
            console.error(
              `Failed to ${action} holiday lock for class ${cId} on ${dateObj}:`,
              error,
            );
          }
        }
      }
    }

    const studentCount = await prisma.student.count({
      where: {
        classId: {
          in: targetClassIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Holiday ${action === "lock" ? "locked" : "unlocked"} successfully`,
      processedCount,
      affectedClasses: targetClassIds.length,
      affectedStudents: studentCount,
    });
  } catch (error) {
    console.error("POST /api/holiday-lock/bulk-lock error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
