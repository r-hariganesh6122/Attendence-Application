import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/attendance?classId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const classId = parseInt(searchParams.get("classId"));
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!classId) {
    return NextResponse.json(
      { success: false, message: "classId required" },
      { status: 400 },
    );
  }

  // Fetch students in the class
  const students = await prisma.student.findMany({
    where: { classId },
    select: {
      id: true,
      rollNo: true,
      regNo: true,
      studentName: true,
      residence: true,
    },
  });

  // Fetch attendance records for students in the class and date range
  let attendanceRecords = [];
  if (from && to) {
    // Filter by date only (YYYY-MM-DD)
    attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId,
        AND: [
          {
            date: {
              gte: new Date(from + "T00:00:00.000Z"),
              lte: new Date(to + "T23:59:59.999Z"),
            },
          },
        ],
      },
      select: {
        id: true,
        date: true,
        studentId: true,
        status: true,
        absenceReason: true,
        informed: true,
      },
    });
  } else {
    attendanceRecords = await prisma.attendance.findMany({
      where: { classId },
      select: {
        id: true,
        date: true,
        studentId: true,
        status: true,
        absenceReason: true,
        informed: true,
      },
    });
  }

  return NextResponse.json({
    success: true,
    students,
    attendanceRecords,
  });
}
