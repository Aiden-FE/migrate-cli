import { execSync } from 'node:child_process';
import { Command } from 'commander';
import chalk from 'chalk';
import { confirm, select } from '@inquirer/prompts';
import { Logger, checkUpdate } from '@/utils';

/**
 * @description 检查Compass CLI是否存在新版本内容
 */
export default (program: Command) => {
  program
    .command('update')
    .description('检查是否存在新版本CLI')
    .action(async () => {
      const loading = Logger.createLoading();
      loading.start({
        text: chalk.cyan('正在检查版本信息'),
      });
      try {
        const packageName = '@compass-aiden/migrate-cli';
        const currentVersion = execSync('migrate -v', { encoding: 'utf-8' }).trim().replace('v', '');
        const latestVersion = await checkUpdate(packageName, currentVersion);
        if (!latestVersion) {
          loading.success({
            text: chalk.green('当前已是最新版本'),
          });
          return;
        }
        loading.update({
          text: chalk.yellow(`发现新版本: ${latestVersion}`),
        });
        const isUpdate = await confirm({
          message: '是否立即更新',
          default: true,
        });
        if (!isUpdate) {
          return;
        }
        const pkgManager = await select({
          message: '请选择包管理器',
          choices: [
            { name: 'npm', value: 'npm' },
            { name: 'yarn', value: 'yarn' },
            { name: 'pnpm', value: 'pnpm' },
          ],
        });
        loading.update({
          text: chalk.cyan('开始更新cli'),
        });
        execSync(`${pkgManager} add ${packageName} -g`, { stdio: 'inherit' });
        loading.success({
          text: chalk.green('更新成功,当前已是最新版本.'),
        });
      } catch (err) {
        Logger.log(err);
        loading.error({
          text: chalk.red('更新失败'),
        });
      }
    });
};
