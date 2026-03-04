import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/authMiddleware";

const prisma = new PrismaClient();

// GET /api/classes?departmentId=1 (optional - if not provided, returns all classes)
export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid or missing token" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    let departmentId = searchParams.get("departmentId");

    // Academic coordinators: if no departmentId specified, allow access to all their departments
    // If departmentId is specified, verify it's one of their assigned departments
    if (user.role === "academic_coordinator") {
      if (departmentId) {
        // Verify coordinator has access to this department
        const hasAccess = await prisma.teacherDepartment.findUnique({
          where: {
            teacherId_departmentId: {
              teacherId: user.id,
              departmentId: Number(departmentId),
            },
          },
        });

        if (!hasAccess) {
          return NextResponse.json(
            {
              success: false,
              message: "Unauthorized - Not assigned to this department",
            },
            { status: 403 },
          );
        }
      } else if (user.coordinatorDepartmentId) {
        // Fallback to coordinatorDepartmentId if no specific department requested
        departmentId = user.coordinatorDepartmentId.toString();
      }
    }

    let classes;
    if (departmentId) {
      // Fetch classes for specific department
      classes = await prisma.class.findMany({
        where: { departmentId: Number(departmentId) },
        select: { id: true, name: true, departmentId: true },
      });
    } else {
      // Fetch all classes (only for admin/teacher)
      classes = await prisma.class.findMany({
        select: { id: true, name: true, departmentId: true },
      });
    }

    return NextResponse.json({ success: true, classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch classes" },
      { status: 500 },
    );
  }
}
