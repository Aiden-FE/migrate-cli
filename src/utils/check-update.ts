import { compareVersion } from '@compass-aiden/helpers/cjs';
import { getRepoInfoFromNpm } from '@/http';
import { execSync } from 'node:child_process';
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
    const currentVersion = execSync('migrate -v', { encoding: 'utf-8' }).trim().replace('v', '');
    const packageName = '@compass-aiden/migrate-cli';

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
      Logger.warn('建议更新到最新版本以获得最佳体验, 运行以下命令更新:\n\tmigrate update');
    } else {
      spinner.stop();
    }
  } catch (error) {
    Logger.error(error);
    Logger.warn('CLI版本检查失败，继续执行任务');
  }
}
