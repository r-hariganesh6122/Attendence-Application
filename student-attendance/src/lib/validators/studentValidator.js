import { z } from "zod";

// Validator for student records
export const studentCreateSchema = z.object({
  classId: z.number().positive("classId must be a positive number"),
  studentName: z
    .string()
    .min(1, "Student name is required")
    .max(255, "Student name must be less than 255 characters"),
  rollNo: z
    .string()
    .min(1, "Roll number is required")
    .max(50, "Roll number must be less than 50 characters"),
  regNo: z
    .string()
    .min(1, "Registration number is required")
    .max(50, "Registration number must be less than 50 characters"),
  residence: z
    .string()
    .max(255, "Residence must be less than 255 characters")
    .optional(),
});

export const studentUpdateSchema = z.object({
  studentId: z.number().positive("studentId must be a positive number"),
  classId: z.number().positive("classId must be a positive number").optional(),
  studentName: z
    .string()
    .min(1, "Student name is required")
    .max(255, "Student name must be less than 255 characters")
    .optional(),
  rollNo: z
    .string()
    .min(1, "Roll number is required")
    .max(50, "Roll number must be less than 50 characters")
    .optional(),
  regNo: z
    .string()
    .min(1, "Registration number is required")
    .max(50, "Registration number must be less than 50 characters")
    .optional(),
  residence: z
    .string()
    .max(255, "Residence must be less than 255 characters")
    .optional(),
});

export const studentDeleteSchema = z.object({
  studentId: z.number().positive("studentId must be a positive number"),
});

// Helper functions to validate and parse request body
export function validateStudentCreate(data) {
  try {
    return {
      success: true,
      data: studentCreateSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Student validation failed",
    };
  }
}

export function validateStudentUpdate(data) {
  try {
    return {
      success: true,
      data: studentUpdateSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Student validation failed",
    };
  }
}

export function validateStudentDelete(data) {
  try {
    return {
      success: true,
      data: studentDeleteSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Student validation failed",
    };
  }
}
