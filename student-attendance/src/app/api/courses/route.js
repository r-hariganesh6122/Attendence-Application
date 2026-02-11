import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/courses
export async function POST(request) {
  try {
    const body = await request.json();
    const { courseCode, subject } = body;

    if (!courseCode || !subject) {
      return NextResponse.json(
        { success: false, message: "Course Code and Subject are required" },
        { status: 400 },
      );
    }

    // Check if course with this code already exists
    const existingCourse = await prisma.course.findFirst({
      where: { courseCode },
    });

    if (existingCourse) {
      return NextResponse.json(
        {
          success: false,
          message: "Course with this code already exists",
        },
        { status: 400 },
      );
    }

    // Create new course
    const course = await prisma.course.create({
      data: {
        courseCode,
        subject,
      },
      select: {
        id: true,
        courseCode: true,
        subject: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Course added successfully",
      course,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

// GET /api/courses
export async function GET(request) {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        courseCode: true,
        subject: true,
      },
    });
    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}

// DELETE /api/courses
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { courseId, classId } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: "courseId is required" },
        { status: 400 },
      );
    }

    // Delete all class teacher assignments for this course in the specified class
    if (classId) {
      await prisma.classTeacher.deleteMany({
        where: {
          courseId: Number(courseId),
          classId: Number(classId),
        },
      });
    }

    // Delete the course if no other assignments exist
    const otherAssignments = await prisma.classTeacher.findMany({
      where: { courseId: Number(courseId) },
    });

    if (otherAssignments.length === 0) {
      await prisma.course.delete({
        where: { id: Number(courseId) },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Course and assignments removed successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Course not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
