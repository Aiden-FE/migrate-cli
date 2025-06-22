import dotenv from 'dotenv';

export default function getEnv(key: string, defaultValue?: string, envPath?: string) {
  dotenv.config({ path: envPath });
  return process.env[key] ?? defaultValue ?? '';
}
