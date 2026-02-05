import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/students?departmentId=...&className=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const className = searchParams.get("className");
    const classId = searchParams.get("classId");

    let where = { role: "student" };
    if (classId) {
      // Find all students who have attended this class (or are enrolled)
      // For now, get all users who have attendance records for this class
      const attendance = await prisma.attendance.findMany({
        where: { classId: Number(classId) },
        include: { user: true },
      });
      // Remove duplicates by user id
      const seen = new Set();
      const students = attendance
        .map((a) => a.user)
        .filter((u) => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        });
      return NextResponse.json({ success: true, students });
    }
    if (departmentId) {
      // If you have departmentId in your schema, add it here
      // where.departmentId = Number(departmentId);
    }
    if (className) {
      // Find class by name, then get students in that class
      const classObj = await prisma.class.findFirst({
        where: { name: className },
      });
      if (!classObj) {
        return NextResponse.json({ success: true, students: [] });
      }
      const attendance = await prisma.attendance.findMany({
        where: { classId: classObj.id },
        include: { user: true },
      });
      const students = attendance.map((a) => a.user);
      return NextResponse.json({ success: true, students });
    }
    // Default: return all students
    const students = await prisma.user.findMany({ where });
    return NextResponse.json({ success: true, students });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch students" },
      { status: 500 },
    );
  }
}
