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
    // Find all classes taught by this teacher using ClassTeacher join table
    const classTeachers = await prisma.classTeacher.findMany({
      where: { teacherId: Number(teacherId) },
      include: { class: true },
    });
    const classes = classTeachers.map((ct) => ({
      id: ct.class.id,
      name: ct.class.name,
    }));
    return NextResponse.json({ success: true, departments: classes });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch departments" },
      { status: 500 },
    );
  }
}
