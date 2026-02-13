import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/classes?departmentId=1 (optional - if not provided, returns all classes)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    let classes;
    if (departmentId) {
      // Fetch classes for specific department
      classes = await prisma.class.findMany({
        where: { departmentId: Number(departmentId) },
        select: { id: true, name: true },
      });
    } else {
      // Fetch all classes
      classes = await prisma.class.findMany({
        select: { id: true, name: true },
      });
    }

    return NextResponse.json({ success: true, classes });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch classes" },
      { status: 500 },
    );
  }
}
