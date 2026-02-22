import { PrismaClient } from "@prisma/client";
import schedule from "node-schedule";

const prisma = new PrismaClient();

/**
 * Automatically lock all Sundays for the institution
 * This function finds all classes and ensures all Sundays are locked
 */
export async function autoLockSundays() {
  try {
    console.log("[SundayLocker] Starting automatic Sunday locking...");

    // Get all classes
    const allClasses = await prisma.class.findMany({
      select: { id: true, name: true },
    });

    if (allClasses.length === 0) {
      console.log("[SundayLocker] No classes found");
      return;
    }

    // Get or create system admin user for locking
    let adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    if (!adminUser) {
      console.log("[SundayLocker] Creating system admin for Sunday locking...");
      adminUser = await prisma.user.create({
        data: {
          name: "System Auto-Locker",
          mobile: "system-auto-locker-" + Date.now(),
          role: "admin",
          passwordHash: "auto-locked",
        },
      });
    }

    // Calculate date range: today to 1 year in the future (using UTC)
    const today = new Date();
    // Set to start of day in UTC
    const startDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

    const endDate = new Date(startDate);
    endDate.setUTCFullYear(endDate.getUTCFullYear() + 1);

    console.log(
      `[SundayLocker] Locking Sundays from ${startDate.toDateString()} to ${endDate.toDateString()}`,
    );

    // Find all Sundays from today onwards
    const sundays = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      if (d.getUTCDay() === 0) {
        sundays.push(new Date(d));
      }
    }

    let lockedCount = 0;
    let skippedCount = 0;

    // Lock each Sunday for all classes
    for (const classObj of allClasses) {
      for (const sunday of sundays) {
        try {
          const result = await prisma.holidayLock.upsert({
            where: {
              classId_date: {
                classId: classObj.id,
                date: sunday,
              },
            },
            update: {
              reason: "Sunday", // Update if it exists with different reason
              lockedBy: adminUser.id,
            },
            create: {
              classId: classObj.id,
              date: sunday,
              reason: "Sunday",
              lockedBy: adminUser.id,
            },
          });

          if (result) {
            lockedCount++;
          }
        } catch (error) {
          console.error(
            `[SundayLocker] Failed to lock ${sunday.toDateString()} for class ${classObj.id}:`,
            error.message,
          );
        }
      }
    }

    console.log(
      `[SundayLocker] ✓ Successfully locked ${lockedCount} Sundays across ${allClasses.length} classes`,
    );
    return { success: true, lockedCount, classCount: allClasses.length };
  } catch (error) {
    console.error("[SundayLocker] Error:", error);
    throw error;
  }
}

// Track scheduled job to avoid duplicate scheduling
let sundayLockerJob = null;

/**
 * Initialize the Sunday locker scheduler using node-schedule
 * Runs immediately on startup and then every Sunday at 1 AM UTC
 * This should be called on app startup
 */
export async function initializeSundayLocker() {
  if (typeof window !== "undefined") {
    // Don't run on client side
    return;
  }

  try {
    // Run immediately on startup
    console.log("[SundayLocker] Running initial lock on startup...");
    await autoLockSundays();

    // Cancel any existing job to prevent duplicates
    if (sundayLockerJob) {
      sundayLockerJob.cancel();
      console.log("[SundayLocker] Cancelled previous scheduled job");
    }

    // Schedule to run every Sunday at 1:00 AM UTC
    // Cron: minute hour dayOfMonth month dayOfWeek
    // 0 1 * * 0 = Every Sunday at 1:00 AM UTC
    sundayLockerJob = schedule.scheduleJob("0 1 * * 0", async () => {
      console.log(
        "[SundayLocker] Scheduled task triggered (every Sunday at 1 AM UTC)",
      );
      try {
        await autoLockSundays();
      } catch (error) {
        console.error("[SundayLocker] Scheduled task failed:", error);
      }
    });

    console.log(
      "[SundayLocker] Scheduler initialized - locks all Sundays for next year on startup, then every Sunday at 1:00 AM UTC",
    );
  } catch (error) {
    console.error("[SundayLocker] Failed to initialize:", error);
  }
}
