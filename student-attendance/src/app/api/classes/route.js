import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/classes?departmentId=1
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    if (!departmentId) {
      return NextResponse.json(
        { success: false, message: "Missing departmentId" },
        { status: 400 },
      );
    }
    const classes = await prisma.class.findMany({
      where: { departmentId: Number(departmentId) },
      select: { id: true, name: true },
    });
    return NextResponse.json({ success: true, classes });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch classes" },
      { status: 500 },
    );
  }
}
