import * as z from 'zod';

const createEnv = () => {
  const EnvSchema = z.object({
    USER_API_URL: z.string(),
    THREAT_API_URL: z.string(),
    LOG_API_URL: z.string(),
    BULK_PROCESSOR_URL: z.string(),
    DEFAULT_PRIVATE_KEY_MIFOS: z.string(),
    APP_URL: z.string().optional().default('http://localhost:3000'),
  });

  const envVars = Object.entries(import.meta.env).reduce<Record<string, string>>((acc, curr) => {
    const [key, value] = curr;
    if (key.startsWith('VITE_APP_')) {
      acc[key.replace('VITE_APP_', '')] = value;
    }
    if (key === 'DEFAULT_PRIVATE_KEY_MIFOS') {
      acc[key] = value;
    }
    return acc;
  }, {});

  const parsedEnv = EnvSchema.safeParse(envVars);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided.
The following variables are missing or invalid:
${Object.entries(parsedEnv.error.flatten().fieldErrors)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}
`,
    );
  }

  return parsedEnv.data;
};

export const env = createEnv();
