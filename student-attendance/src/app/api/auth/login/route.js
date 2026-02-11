import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/authMiddleware";
import { validateLogin } from "@/lib/validators/authValidator";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { mobile, password } = body;

    // Validate input with Zod
    const validation = validateLogin({ mobile, password });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 },
      );
    }

    // Find user by mobile
    const user = await prisma.user.findFirst({
      where: {
        mobile: mobile,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid mobile or password" },
        { status: 401 },
      );
    }

    // Only allow admin/teacher login
    if (user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Login not allowed for your role" },
        { status: 403 },
      );
    }

    // Check password using bcrypt (supports both hashed and plaintext for migration)
    let passwordMatch = false;

    // Try hashed password first (after migration)
    if (user.passwordHash) {
      passwordMatch = await bcrypt.compare(password, user.passwordHash);
    } else if (user.password) {
      // Fallback to plaintext comparison (during migration)
      passwordMatch = user.password === password;

      // If plaintext match succeeds, hash it immediately
      if (passwordMatch) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hashedPassword },
        });
      }
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid mobile or password" },
        { status: 401 },
      );
    }

    // Generate JWT token
    const token = createToken(user);

    // Return user info and token (omit password fields)
    const { password: _, passwordHash: __, ...userInfo } = user;
    return NextResponse.json({
      success: true,
      user: userInfo,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
