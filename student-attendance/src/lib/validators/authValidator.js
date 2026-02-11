import { z } from "zod";

// Validator for login credentials
export const loginSchema = z.object({
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .regex(/^[0-9\s\-\+\(\)]+$/, "Invalid mobile number format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Helper function to validate and parse request body
export function validateLogin(data) {
  try {
    return {
      success: true,
      data: loginSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors[0]?.message || "Login validation failed",
    };
  }
}
