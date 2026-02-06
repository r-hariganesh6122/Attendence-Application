import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
