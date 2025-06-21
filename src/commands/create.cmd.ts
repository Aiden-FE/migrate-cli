import { Command } from 'commander';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createFolder } from '@compass-aiden/helpers/cjs';
import { Logger, getConfig } from '@/utils';

// migrate create -n <name>
export default (program: Command) => {
  program
    .command('create')
    .description('创建迁移任务')
    .option('-n, --name <name>', '迁移任务名称')
    .option('-c, --config <config>', '配置文件路径')
    .action(async (options) => {
      if (!options.name || !/^[a-z]+(_[a-z]+)*$/.test(options.name)) {
        Logger.error('迁移名称错误,名称应该由小写字母组成,多个单词采用 _ 连接', 'Migration');
        process.exit(1);
      }
      const { dir = 'migrations' } = getConfig(options.config);

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const time = new Date().getTime();
      const dirPath = path.join(dir, `${time}_${options.name}.ts`);
      await createFolder(dirPath);
      Logger.success(`迁移任务创建成功: ${dirPath}`);
    });
};
