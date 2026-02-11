import { z } from "zod";

// Validator for creating or updating class-teacher assignments
export const classTeacherCreateSchema = z.object({
  classId: z.number().positive("classId must be a positive number"),
  courseId: z.number().positive("courseId must be a positive number"),
  teacherId: z.number().positive("teacherId must be a positive number"),
});

export const classTeacherUpdateSchema = z.object({
  assignmentId: z.number().positive("assignmentId must be a positive number"),
  courseId: z.number().positive("courseId must be a positive number"),
});

export const classTeacherDeleteSchema = z.object({
  assignmentId: z.number().positive("assignmentId must be a positive number"),
});

// Helper function to validate and parse request body
export function validateClassTeacherCreate(data) {
  try {
    return {
      success: true,
      data: classTeacherCreateSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Validation failed",
    };
  }
}

export function validateClassTeacherUpdate(data) {
  try {
    return {
      success: true,
      data: classTeacherUpdateSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Validation failed",
    };
  }
}

export function validateClassTeacherDelete(data) {
  try {
    return {
      success: true,
      data: classTeacherDeleteSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Validation failed",
    };
  }
}
