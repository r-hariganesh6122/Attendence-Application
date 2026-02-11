import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/students
export async function POST(request) {
  try {
    const body = await request.json();
    const { rollNo, regNo, studentName, residence, classId } = body;

    if (!rollNo || !regNo || !studentName || !classId) {
      return NextResponse.json(
        {
          success: false,
          message: "Roll No, Reg No, Student Name, and Class ID are required",
        },
        { status: 400 },
      );
    }

    // Check if student with this regNo already exists
    const existingStudent = await prisma.student.findFirst({
      where: { regNo },
    });

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message: "Student with this registration number already exists",
        },
        { status: 400 },
      );
    }

    // Create new student
    const student = await prisma.student.create({
      data: {
        rollNo,
        regNo,
        studentName,
        residence: residence || "",
        classId: Number(classId),
      },
      select: {
        id: true,
        rollNo: true,
        regNo: true,
        studentName: true,
        residence: true,
        classId: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Student added successfully",
      student,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// PUT /api/students
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, rollNo, regNo, studentName, residence } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Student ID is required" },
        { status: 400 },
      );
    }

    // Update student
    const student = await prisma.student.update({
      where: { id: Number(id) },
      data: {
        ...(rollNo && { rollNo }),
        ...(regNo && { regNo }),
        ...(studentName && { studentName }),
        ...(residence !== undefined && { residence }),
      },
      select: {
        id: true,
        rollNo: true,
        regNo: true,
        studentName: true,
        residence: true,
        classId: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/students
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "studentId is required" },
        { status: 400 },
      );
    }

    // Delete student
    await prisma.student.delete({
      where: { id: Number(studentId) },
    });

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// GET /api/students?classId=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (classId) {
      // Fetch students from Student table by classId
      const students = await prisma.student.findMany({
        where: { classId: Number(classId) },
        select: {
          id: true,
          rollNo: true,
          regNo: true,
          studentName: true,
          residence: true,
        },
      });
      return NextResponse.json({ success: true, students });
    }
    // Default: return all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        rollNo: true,
        regNo: true,
        studentName: true,
        residence: true,
      },
    });
    return NextResponse.json({ success: true, students });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch students" },
      { status: 500 },
    );
  }
}
