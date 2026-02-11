import { z } from "zod";

// Validator for creating teachers
export const teacherCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Teacher name is required")
    .max(255, "Teacher name must be less than 255 characters"),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .max(20, "Mobile number must be less than 20 characters")
    .regex(/^[0-9\s\-\+\(\)]+$/, "Invalid mobile number format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(255, "Password must be less than 255 characters"),
});

export const teacherUpdateSchema = z.object({
  teacherId: z.number().positive("teacherId must be a positive number"),
  name: z
    .string()
    .min(1, "Teacher name is required")
    .max(255, "Teacher name must be less than 255 characters")
    .optional(),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .max(20, "Mobile number must be less than 20 characters")
    .regex(/^[0-9\s\-\+\(\)]+$/, "Invalid mobile number format")
    .optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(255, "Password must be less than 255 characters")
    .optional(),
});

export const teacherDeleteSchema = z.object({
  teacherId: z.number().positive("teacherId must be a positive number"),
});

// Helper functions to validate and parse request body
export function validateTeacherCreate(data) {
  try {
    return {
      success: true,
      data: teacherCreateSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Teacher validation failed",
    };
  }
}

export function validateTeacherUpdate(data) {
  try {
    return {
      success: true,
      data: teacherUpdateSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Teacher validation failed",
    };
  }
}

export function validateTeacherDelete(data) {
  try {
    return {
      success: true,
      data: teacherDeleteSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Teacher validation failed",
    };
  }
}
