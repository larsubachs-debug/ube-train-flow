import { z } from "zod";

// Common validation messages (Dutch)
const messages = {
  required: "Dit veld is verplicht",
  email: "Voer een geldig e-mailadres in",
  minLength: (min: number) => `Minimaal ${min} karakters`,
  maxLength: (max: number) => `Maximaal ${max} karakters`,
  positiveNumber: "Moet een positief getal zijn",
  invalidDate: "Voer een geldige datum in",
  passwordMismatch: "Wachtwoorden komen niet overeen",
};

// Common field schemas
export const emailSchema = z
  .string()
  .trim()
  .min(1, messages.required)
  .email(messages.email)
  .max(255, messages.maxLength(255));

export const passwordSchema = z
  .string()
  .min(6, messages.minLength(6))
  .max(128, messages.maxLength(128));

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, messages.required)
  .max(100, messages.maxLength(100));

export const notesSchema = z
  .string()
  .trim()
  .max(1000, messages.maxLength(1000))
  .optional();

export const positiveNumberSchema = z
  .number({ invalid_type_error: messages.positiveNumber })
  .positive(messages.positiveNumber);

export const weightSchema = z
  .number({ invalid_type_error: "Voer een geldig gewicht in" })
  .min(0, "Gewicht moet minimaal 0 zijn")
  .max(500, "Gewicht lijkt te hoog");

export const repsSchema = z
  .number({ invalid_type_error: "Voer geldige reps in" })
  .int("Moet een geheel getal zijn")
  .min(1, "Minimaal 1 rep")
  .max(100, "Maximaal 100 reps");

export const setsSchema = z
  .number({ invalid_type_error: "Voer geldige sets in" })
  .int("Moet een geheel getal zijn")
  .min(1, "Minimaal 1 set")
  .max(20, "Maximaal 20 sets");

export const rpeSchema = z
  .number()
  .min(1, "RPE moet tussen 1-10 zijn")
  .max(10, "RPE moet tussen 1-10 zijn")
  .optional();

// Form schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const profileSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
});

export const workoutSetSchema = z.object({
  weight: weightSchema.optional(),
  reps: repsSchema.optional(),
  rpe: rpeSchema,
  completed: z.boolean().default(false),
});

export const bodyMetricsSchema = z.object({
  weight: weightSchema.optional(),
  bodyFatPercentage: z
    .number()
    .min(1, "Vetpercentage moet tussen 1-60 zijn")
    .max(60, "Vetpercentage moet tussen 1-60 zijn")
    .optional(),
  muscleMass: z
    .number()
    .min(0, "Spiermassa moet positief zijn")
    .max(200, "Spiermassa lijkt te hoog")
    .optional(),
  notes: notesSchema,
});

export const goalSchema = z.object({
  targetValue: positiveNumberSchema,
  targetDate: z.string().optional(),
  notes: notesSchema,
});

export const checkinSchema = z.object({
  responses: z.record(z.union([z.string(), z.number()])),
});

export const messageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, messages.required)
    .max(5000, messages.maxLength(5000)),
});

export const challengeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, messages.required)
    .max(100, messages.maxLength(100)),
  description: z.string().trim().max(500, messages.maxLength(500)).optional(),
  targetValue: positiveNumberSchema,
  startDate: z.string().min(1, messages.required),
  endDate: z.string().min(1, messages.required),
  challengeType: z.enum(["workouts", "volume", "streak"]),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type WorkoutSetFormData = z.infer<typeof workoutSetSchema>;
export type BodyMetricsFormData = z.infer<typeof bodyMetricsSchema>;
export type GoalFormData = z.infer<typeof goalSchema>;
export type CheckinFormData = z.infer<typeof checkinSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type ChallengeFormData = z.infer<typeof challengeSchema>;
