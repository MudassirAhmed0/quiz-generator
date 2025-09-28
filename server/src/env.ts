// server/src/env.ts
import "dotenv/config";
import { z } from "zod";

const EnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : 4000))
      .pipe(z.number().int().positive()),
    OPENAI_API_KEY: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === "production" && !val.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OPENAI_API_KEY"],
        message: "OPENAI_API_KEY is required in production",
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;
export const env: Env = EnvSchema.parse(process.env);
