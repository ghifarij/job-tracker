import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  // HS256 signs with this secret, so a short one could be guessed.
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.string().optional(),
});

export type Config = {
  databaseUrl: string;
  googleClientId: string;
  jwtSecret: string;
  // `Secure` cookies are only sent over HTTPS. Local development runs on
  // plain http://localhost, so the flag is on in production only.
  cookieSecure: boolean;
};

// Fails at startup with the names of the missing variables, instead of
// failing later on the first login.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join("."));
    throw new Error(`Missing or invalid environment variables: ${names.join(", ")}`);
  }

  return {
    databaseUrl: parsed.data.DATABASE_URL,
    googleClientId: parsed.data.GOOGLE_CLIENT_ID,
    jwtSecret: parsed.data.JWT_SECRET,
    cookieSecure: parsed.data.NODE_ENV === "production",
  };
}
