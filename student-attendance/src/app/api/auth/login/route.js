import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, password } = body; // identifier = mobile
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Missing credentials" },
        { status: 400 },
      );
    }
    // Find user by mobile
    const user = await prisma.user.findFirst({
      where: {
        mobile: identifier,
      },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 401 },
      );
    }
    // Plaintext password check (for dev only)
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 },
      );
    }
    // Only allow admin/teacher login
    if (user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Login not allowed for this user" },
        { status: 403 },
      );
    }
    // Return user info (omit password)
    const { password: _, ...userInfo } = user;
    return NextResponse.json({ success: true, user: userInfo });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
