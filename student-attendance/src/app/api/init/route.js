import { NextResponse } from "next/server";
import { initializeSundayLocker } from "@/lib/sundayLocker";

/**
 * Initialization endpoint - called on app startup
 * Starts the automated Sunday locking scheduler
 */
export async function GET(request) {
  try {
    console.log("[Init] Starting app initialization...");

    // Initialize the Sunday locker scheduler
    await initializeSundayLocker();

    return NextResponse.json({
      success: true,
      message: "App initialized - Sunday locker scheduler started",
    });
  } catch (error) {
    console.error("[Init] Initialization error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Initialization failed",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
