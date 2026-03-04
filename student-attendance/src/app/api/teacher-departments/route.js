import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/teacher-departments?teacherId=123
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");
    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: "Missing teacherId" },
        { status: 400 },
      );
    }
    // Find all departments assigned to this teacher (Academic Coordinator)
    const teacherDepartments = await prisma.teacherDepartment.findMany({
      where: { teacherId: Number(teacherId) },
      include: {
        department: {
          include: { program: true },
        },
      },
    });

    console.log(
      `TeacherDepartment for teacherId ${teacherId}:`,
      teacherDepartments,
    );

    // Return departments
    const departments = teacherDepartments.map((td) => ({
      ...td,
      department: td.department,
    }));

    console.log(`Returning departments:`, departments);

    return NextResponse.json({ success: true, departments });
  } catch (error) {
    console.error("Error fetching teacher departments:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch departments" },
      { status: 500 },
    );
  }
}
