import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/attendance
export async function POST(request) {
  try {
    const body = await request.json();

    let { classId, date, records } = body;
    if (!classId || !date || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }
    classId = parseInt(classId, 10);
    if (isNaN(classId)) {
      return NextResponse.json(
        { success: false, message: "classId must be an integer" },
        { status: 400 },
      );
    }

    // Remove existing attendance records for this class and date
    await prisma.attendance.deleteMany({
      where: {
        classId,
        date: new Date(date + "T00:00:00.000Z"),
      },
    });

    // Normalize all record keys to correct Prisma field names (force only correct keys)
    const normalizedRecords = records.map((rec) => {
      let studentId = rec.studentId || rec.studentid || rec.studentld;
      return {
        classId: classId,
        studentId: studentId,
        date: new Date(date + "T00:00:00.000Z"),
        status: rec.absent ? "absent" : "present",
        absenceReason: rec.reason || rec.absenceReason || null,
        informed: !!rec.informed,
      };
    });

    const created = await prisma.attendance.createMany({
      data: normalizedRecords,
      skipDuplicates: false,
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// GET /api/attendance?classId=...&from=YYYY-MM-DD&to=YYYY-MM-DD OR ?studentId=...
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // If studentId is provided, fetch student's attendance
  if (studentId) {
    const numStudentId = parseInt(studentId);
    if (isNaN(numStudentId)) {
      return NextResponse.json(
        { success: false, message: "Invalid studentId" },
        { status: 400 },
      );
    }

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: numStudentId },
      select: {
        id: true,
        studentName: true,
        regNo: true,
        rollNo: true,
        classId: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 },
      );
    }

    // Get student's attendance records
    const attendance = await prisma.attendance.findMany({
      where: { studentId: numStudentId },
      select: {
        id: true,
        date: true,
        status: true,
        absenceReason: true,
        informed: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      success: true,
      student,
      attendance,
    });
  }

  // Original classId-based query
  if (!classId) {
    return NextResponse.json(
      { success: false, message: "classId or studentId required" },
      { status: 400 },
    );
  }

  const numClassId = parseInt(classId);
  if (isNaN(numClassId)) {
    return NextResponse.json(
      { success: false, message: "Invalid classId" },
      { status: 400 },
    );
  }

  // Fetch students in the class
  const students = await prisma.student.findMany({
    where: { classId: numClassId },
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
        classId: numClassId,
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
      where: { classId: numClassId },
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
