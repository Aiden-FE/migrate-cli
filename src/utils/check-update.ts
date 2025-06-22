import { compareVersion } from '@compass-aiden/helpers/cjs';
import { getRepoInfoFromNpm } from '@/http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Logger from './logger';

/**
 * @description 检查新版本
 * @param npmLibName npm 包名
 * @param currentVersion 当前版本
 * @returns 存在新版本则返回新的版本号,否则返回undefined
 */
export default async function checkUpdate(npmLibName: string, currentVersion: string): Promise<string | undefined> {
  const releases = await getRepoInfoFromNpm(npmLibName);
  if (!releases?.['dist-tags']?.latest) {
    return undefined;
  }
  const latestVersion = releases['dist-tags'].latest;
  if (compareVersion(currentVersion, latestVersion) >= 0) {
    return undefined;
  }
  return latestVersion;
}

/**
 * @description 在命令执行前检查CLI版本更新
 */
export async function checkCliUpdate(): Promise<void> {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJsonPath = join(__dirname, '../../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const currentVersion = packageJson.version;
    const packageName = packageJson.name;

    const spinner = Logger.createLoading();
    spinner.start({
      text: '检查CLI版本更新...',
      color: 'cyan',
    });

    const latestVersion = await checkUpdate(packageName, currentVersion);

    if (latestVersion) {
      spinner.warn({
        text: `发现新版本 ${latestVersion}，当前版本 ${currentVersion}`,
      });
      Logger.warn('建议更新到最新版本以获得最佳体验');
      Logger.warn(`运行以下命令更新: npm install -g ${packageName}@latest`);
    } else {
      spinner.success({
        text: 'CLI已是最新版本',
      });
    }
  } catch (error) {
    Logger.warn('CLI版本检查失败，继续执行任务');
  }
}
