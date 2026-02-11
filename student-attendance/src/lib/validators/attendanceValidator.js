import { z } from "zod";

// Validator for attendance records
export const attendanceCreateSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  studentId: z.number().positive("studentId must be a positive number"),
  classId: z.number().positive("classId must be a positive number"),
  status: z.enum(["present", "absent", "late"], {
    errorMap: () => ({
      message: 'status must be "present", "absent", or "late"',
    }),
  }),
  absenceReason: z.string().optional(),
  informed: z.boolean().optional(),
});

export const attendanceUpdateSchema = z.object({
  attendanceId: z.number().positive("attendanceId must be a positive number"),
  status: z.enum(["present", "absent", "late"], {
    errorMap: () => ({
      message: 'status must be "present", "absent", or "late"',
    }),
  }),
  absenceReason: z.string().optional(),
  informed: z.boolean().optional(),
});

export const attendanceDeleteSchema = z.object({
  attendanceId: z.number().positive("attendanceId must be a positive number"),
});

// Helper functions to validate and parse request body
export function validateAttendanceCreate(data) {
  try {
    return {
      success: true,
      data: attendanceCreateSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Attendance validation failed",
    };
  }
}

export function validateAttendanceUpdate(data) {
  try {
    return {
      success: true,
      data: attendanceUpdateSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Attendance validation failed",
    };
  }
}

export function validateAttendanceDelete(data) {
  try {
    return {
      success: true,
      data: attendanceDeleteSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Attendance validation failed",
    };
  }
}
