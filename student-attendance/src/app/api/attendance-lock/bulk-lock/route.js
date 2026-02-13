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

    const body = await request.json();
    const { lockType, departmentId, classId, date, isLocked, reason } = body;

    if (!lockType || !date) {
      return NextResponse.json(
        { success: false, message: "lockType and date are required" },
        { status: 400 },
      );
    }

    const dateObj = new Date(date + "T00:00:00.000Z");
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

    // Lock all target classes for the specified date
    let lockedCount = 0;

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
            lockedBy: isLocked ? user.id : null,
            reason: isLocked ? reason : null,
          },
          create: {
            classId: cId,
            date: dateObj,
            isLocked,
            lockedAt: isLocked ? new Date() : null,
            lockedBy: isLocked ? user.id : null,
            reason: isLocked ? reason : null,
          },
        });
        lockedCount++;
      } catch (error) {
        console.error(`Failed to lock class ${cId}:`, error);
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
