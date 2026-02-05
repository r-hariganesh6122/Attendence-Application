import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/departments?program=BE
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const program = searchParams.get("program");
    if (!program) {
      return NextResponse.json(
        { success: false, message: "Missing program" },
        { status: 400 },
      );
    }
    const prog = await prisma.program.findUnique({ where: { name: program } });
    if (!prog) {
      return NextResponse.json({ success: true, departments: [] });
    }
    const departments = await prisma.department.findMany({
      where: { programId: prog.id },
      select: { id: true, name: true },
    });
    return NextResponse.json({ success: true, departments });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch departments" },
      { status: 500 },
    );
  }
}
