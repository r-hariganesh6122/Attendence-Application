import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: "teacher" },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        password: true,
      },
    });
    return NextResponse.json({ success: true, teachers });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch teachers" },
      { status: 500 },
    );
  }
}
