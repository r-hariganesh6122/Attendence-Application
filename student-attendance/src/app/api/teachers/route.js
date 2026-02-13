import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authenticateRequest } from "@/lib/authMiddleware";
import {
  validateTeacherCreate,
  validateTeacherUpdate,
  validateTeacherDelete,
} from "@/lib/validators/teacherValidator";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid or missing token" },
        { status: 401 },
      );
    }

    // Check authorization - only admin can create teachers
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden - Only admins can create teachers",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate request body with Zod
    const validation = validateTeacherCreate(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 },
      );
    }

    const { name, mobile, password } = validation.data;

    // Check if teacher with this mobile already exists
    const existingTeacher = await prisma.user.findUnique({
      where: { mobile },
    });

    if (existingTeacher) {
      return NextResponse.json(
        {
          success: false,
          message: "Teacher with this mobile number already exists",
        },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new teacher
    const teacher = await prisma.user.create({
      data: {
        name,
        mobile,
        passwordHash: hashedPassword,
        password: password, // Keep plaintext for migration period
        role: "teacher",
      },
      select: {
        id: true,
        name: true,
        mobile: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher added successfully",
      teacher,
    });
  } catch (error) {
    console.error("POST /api/teachers error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid or missing token" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Check if this is a password change request (has oldPassword field)
    if (body.oldPassword) {
      // Password change request
      const { mobile, oldPassword, password } = body;

      // Validate password field exists
      if (!password || password.length < 6) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 6 characters" },
          { status: 400 },
        );
      }

      // Find teacher by mobile
      const teacher = await prisma.user.findUnique({
        where: { mobile },
        select: { id: true, passwordHash: true, password: true },
      });

      if (!teacher) {
        return NextResponse.json(
          { success: false, message: "Teacher not found" },
          { status: 404 },
        );
      }

      // Verify old password
      const isPasswordValid = await bcrypt.compare(
        oldPassword,
        teacher.passwordHash || teacher.password,
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: "Current password is incorrect" },
          { status: 401 },
        );
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedTeacher = await prisma.user.update({
        where: { id: teacher.id },
        data: {
          passwordHash: hashedPassword,
          password: password, // Keep plaintext for migration period
        },
        select: {
          id: true,
          name: true,
          mobile: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
        teacher: updatedTeacher,
      });
    }

    // Regular update (admin only) - for updating name, mobile, etc.
    // Check authorization - only admin can update teachers
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden - Only admins can update teachers",
        },
        { status: 403 },
      );
    }

    // Validate request body with Zod
    const validation = validateTeacherUpdate(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 },
      );
    }

    const { teacherId: id, name, mobile, password } = validation.data;

    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.passwordHash = hashedPassword;
      updateData.password = password; // Keep plaintext for migration period
    }

    // Find and update teacher
    const teacher = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        mobile: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher updated successfully",
      teacher,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 },
      );
    }
    console.error("PUT /api/teachers error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid or missing token" },
        { status: 401 },
      );
    }

    // Check authorization - only admin can delete teachers
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden - Only admins can delete teachers",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");

    // Validate teacherId with Zod
    const validation = validateTeacherDelete({
      teacherId: parseInt(teacherId),
    });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 },
      );
    }

    const id = parseInt(teacherId);

    // Delete teacher
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 },
      );
    }
    console.error("DELETE /api/teachers error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (classId) {
      // Fetch teachers for a specific class with course details
      const classTeachers = await prisma.classTeacher.findMany({
        where: { classId: parseInt(classId) },
        select: {
          id: true,
          teacher: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },
          course: {
            select: {
              id: true,
              courseCode: true,
              subject: true,
            },
          },
        },
      });

      // Transform data to match expected format
      const teachers = classTeachers.map((ct) => ({
        classTeacherId: ct.id,
        id: ct.teacher.id,
        name: ct.teacher.name,
        mobile: ct.teacher.mobile,
        courseCode: ct.course.courseCode,
        courseName: ct.course.subject,
      }));

      return NextResponse.json({ success: true, teachers });
    } else {
      // Fetch all teachers
      const teachers = await prisma.user.findMany({
        where: { role: "teacher" },
        select: {
          id: true,
          name: true,
          mobile: true,
        },
      });
      return NextResponse.json({ success: true, teachers });
    }
  } catch (error) {
    console.error("GET /api/teachers error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch teachers" },
      { status: 500 },
    );
  }
}
