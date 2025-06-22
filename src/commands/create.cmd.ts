import { Command } from 'commander';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createFileSync, createFolder } from '@compass-aiden/helpers/cjs';
import { Logger, getConfig, checkCliUpdate } from '@/utils';

// migrate create -n <name>
export default (program: Command) => {
  program
    .command('create')
    .description('创建迁移任务')
    .option('-n, --name <name>', '迁移任务名称')
    .option('-c, --config <config>', '配置文件路径')
    .action(async (options) => {
      // 检查版本更新
      await checkCliUpdate();

      if (!options.name || !/^[a-z]+(-[a-z]+)*$/.test(options.name)) {
        Logger.error('迁移名称错误,名称应该由小写字母组成,多个单词采用 - 连接', 'Migration');
        process.exit(1);
      }
      const { dir = 'migrations' } = getConfig(options.config);

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const time = new Date().getTime();
      const dirPath = path.join(dir, `${time}_${options.name}`);
      await createFolder(dirPath);
      createFileSync(path.join(dirPath, 'main.sql'), '');
      createFileSync(path.join(dirPath, 'rollback.sql'), '');
      Logger.success(
        `迁移任务创建成功,文件夹路径: ${dirPath}\n接下来请在 main.sql 中编写迁移脚本,在 rollback.sql 中编写回滚脚本`,
      );
    });
};
