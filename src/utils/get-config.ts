import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export default function getConfig(filePath?: string) {
  const configPath = filePath ? path.join(process.cwd(), filePath) : path.join(process.cwd(), '.migrate.json');
  if (!existsSync(configPath)) {
    return {};
  }
  const config = readFileSync(configPath, 'utf8');
  return JSON.parse(config);
}
