import { z } from "zod";

// Validator for holiday lock creation
export const holidayLockCreateSchema = z.object({
  classId: z.number().positive("classId must be a positive number"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason must not exceed 500 characters"),
});

// Validator for bulk holiday lock
export const holidayLockBulkSchema = z.object({
  lockType: z.enum(["whole", "department", "class"], {
    errorMap: () => ({
      message: 'lockType must be "whole", "department", or "class"',
    }),
  }),
  departmentId: z.number().positive().optional(),
  classId: z.number().positive().optional(),
  date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .optional(),
  dateFrom: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid dateFrom format",
    })
    .optional(),
  dateTo: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid dateTo format",
    })
    .optional(),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason must not exceed 500 characters"),
  action: z.enum(["lock", "unlock"], {
    errorMap: () => ({
      message: 'action must be "lock" or "unlock"',
    }),
  }),
});

// Validator for updating holiday lock reason
export const holidayLockUpdateSchema = z.object({
  classId: z.number().positive("classId must be a positive number"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason must not exceed 500 characters"),
});

// Validator for deleting holiday lock
export const holidayLockDeleteSchema = z.object({
  classId: z.number().positive("classId must be a positive number"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});
