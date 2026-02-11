import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/authMiddleware";
import {
  validateClassTeacherCreate,
  validateClassTeacherUpdate,
  validateClassTeacherDelete,
} from "@/lib/validators/classTeacherValidator";

const prisma = new PrismaClient();

// POST /api/class-teachers
export async function POST(request) {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid or missing token" },
        { status: 401 },
      );
    }

    // Check authorization - only admin can assign teachers
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden - Only admins can assign teachers to courses",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate request body with Zod
    const validation = validateClassTeacherCreate(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 },
      );
    }

    const { classId, courseId, teacherId } = validation.data;

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
            mobile: true,
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
    console.error("POST /api/class-teachers error:", error);
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
    const teacherId = searchParams.get("teacherId");

    // If teacherId is provided, fetch all courses taught by this teacher across all classes
    if (teacherId) {
      const assignments = await prisma.classTeacher.findMany({
        where: { teacherId: Number(teacherId) },
        include: {
          course: {
            select: {
              id: true,
              courseCode: true,
              subject: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        assignments,
      });
    }

    // If classId is provided, fetch teachers for that class
    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          message: "classId or teacherId query parameter is required",
        },
        { status: 400 },
      );
    }

    // Validate classId is a number
    if (isNaN(Number(classId))) {
      return NextResponse.json(
        {
          success: false,
          message: "classId must be a valid number",
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
            mobile: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("GET /api/class-teachers error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch assignments" },
      { status: 500 },
    );
  }
}

// PUT /api/class-teachers
export async function PUT(request) {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid or missing token" },
        { status: 401 },
      );
    }

    // Check authorization - only admin can update assignments
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden - Only admins can update teacher assignments",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate request body with Zod
    const validation = validateClassTeacherUpdate(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 },
      );
    }

    const { assignmentId, courseId } = validation.data;

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
            mobile: true,
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
    console.error("PUT /api/class-teachers error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/class-teachers
export async function DELETE(request) {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid or missing token" },
        { status: 401 },
      );
    }

    // Check authorization - only admin can delete assignments
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden - Only admins can delete teacher assignments",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate request body with Zod
    const validation = validateClassTeacherDelete(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 },
      );
    }

    const { assignmentId } = validation.data;

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
    console.error("DELETE /api/class-teachers error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
