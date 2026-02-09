import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, mobile, password } = body;

    if (!name || !mobile || !password) {
      return NextResponse.json(
        { success: false, message: "Name, mobile, and password are required" },
        { status: 400 },
      );
    }

    // Check if teacher with this mobile already exists
    const existingTeacher = await prisma.user.findUnique({
      where: { mobile },
    });

    if (existingTeacher) {
      return NextResponse.json(
        {
          success: false,
          message: "Teacher with this mobile number already exists",
        },
        { status: 400 },
      );
    }

    // Create new teacher
    const teacher = await prisma.user.create({
      data: {
        name,
        mobile,
        password,
        role: "teacher",
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        password: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher added successfully",
      teacher,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: "teacherId is required" },
        { status: 400 },
      );
    }

    const id = parseInt(teacherId);

    // Delete teacher
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (classId) {
      // Fetch teachers for a specific class with course details
      const classTeachers = await prisma.classTeacher.findMany({
        where: { classId: parseInt(classId) },
        select: {
          id: true,
          teacher: {
            select: {
              id: true,
              name: true,
              mobile: true,
              password: true,
            },
          },
          course: {
            select: {
              id: true,
              courseCode: true,
              subject: true,
            },
          },
        },
      });

      // Transform data to match expected format
      const teachers = classTeachers.map((ct) => ({
        classTeacherId: ct.id,
        id: ct.teacher.id,
        name: ct.teacher.name,
        mobile: ct.teacher.mobile,
        password: ct.teacher.password,
        courseCode: ct.course.courseCode,
        courseName: ct.course.subject,
      }));

      return NextResponse.json({ success: true, teachers });
    } else {
      // Fetch all teachers
      const teachers = await prisma.user.findMany({
        where: { role: "teacher" },
        select: {
          id: true,
          name: true,
          mobile: true,
          password: true,
        },
      });
      return NextResponse.json({ success: true, teachers });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch teachers" },
      { status: 500 },
    );
  }
}
