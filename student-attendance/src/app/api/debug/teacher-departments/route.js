import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/debug/teacher-departments?teacherId=413
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing teacherId",
          instructions: "Add ?teacherId=<id> to the URL",
        },
        { status: 400 },
      );
    }

    // Get the teacher first
    const teacher = await prisma.user.findUnique({
      where: { id: Number(teacherId) },
    });

    // Find all TeacherDepartment records
    const teacherDepartments = await prisma.teacherDepartment.findMany({
      where: { teacherId: Number(teacherId) },
      include: {
        department: {
          include: { program: true },
        },
        teacher: true,
      },
    });

    // Also check ClassTeacher records
    const classTeachers = await prisma.classTeacher.findMany({
      where: { teacherId: Number(teacherId) },
      include: {
        class: {
          include: { department: true },
        },
        teacher: true,
      },
    });

    return NextResponse.json({
      success: true,
      teacher: teacher
        ? { id: teacher.id, name: teacher.name, role: teacher.role }
        : null,
      teacherDepartmentCount: teacherDepartments.length,
      teacherDepartments,
      classTeacherCount: classTeachers.length,
      classTeachers: classTeachers.slice(0, 5), // Show first 5
      message: `Teacher ${teacher?.name} (ID: ${teacherId}) has ${teacherDepartments.length} department(s) and is assigned to ${classTeachers.length} classes`,
    });
  } catch (error) {
    console.error("Error fetching debug info:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
