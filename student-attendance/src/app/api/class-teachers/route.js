import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/class-teachers
export async function POST(request) {
  try {
    const body = await request.json();
    const { classId, courseId, teacherId } = body;

    if (!classId || !courseId || !teacherId) {
      return NextResponse.json(
        {
          success: false,
          message: "classId, courseId, and teacherId are required",
        },
        { status: 400 },
      );
    }

    // Check if this assignment already exists
    const existingAssignment = await prisma.classTeacher.findFirst({
      where: {
        classId: Number(classId),
        courseId: Number(courseId),
        teacherId: Number(teacherId),
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This teacher is already assigned to this course in this class",
        },
        { status: 400 },
      );
    }

    // Create new class teacher assignment
    const assignment = await prisma.classTeacher.create({
      data: {
        classId: Number(classId),
        courseId: Number(courseId),
        teacherId: Number(teacherId),
      },
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            subject: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            mobileNo: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher assigned to course successfully",
      assignment,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// GET /api/class-teachers
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          message: "classId query parameter is required",
        },
        { status: 400 },
      );
    }

    const assignments = await prisma.classTeacher.findMany({
      where: { classId: Number(classId) },
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            subject: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            mobileNo: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch assignments" },
      { status: 500 },
    );
  }
}

// PUT /api/class-teachers
export async function PUT(request) {
  try {
    const body = await request.json();
    const { assignmentId, courseId } = body;

    if (!assignmentId || !courseId) {
      return NextResponse.json(
        {
          success: false,
          message: "assignmentId and courseId are required",
        },
        { status: 400 },
      );
    }

    const updatedAssignment = await prisma.classTeacher.update({
      where: { id: Number(assignmentId) },
      data: { courseId: Number(courseId) },
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            subject: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            mobileNo: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Assignment updated successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/class-teachers
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, message: "assignmentId is required" },
        { status: 400 },
      );
    }

    await prisma.classTeacher.delete({
      where: { id: Number(assignmentId) },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher assignment removed successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
