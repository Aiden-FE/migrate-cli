import { Command } from 'commander';
import { DBConnector, getConfig, getEnv, Logger } from '@/utils';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export default (program: Command) => {
  program
    .command('up')
    .description('执行迁移任务')
    .option('-c, --config <config>', '配置文件路径')
    .action(async (options) => {
      const { dir = 'migrations', dbType = 'postgres', envFilePath = '.env' } = getConfig(options.config);
      if (!existsSync(dir)) {
        Logger.error('迁移任务文件夹不存在,请先创建迁移任务');
        process.exit(1);
      }
      const dirs = readdirSync(dir)
        .filter((result) => {
          const stat = statSync(join(dir, result));
          return stat.isDirectory();
        })
        .sort((a, b) => {
          const timeA = Number(a.split('_')[0]);
          const timeB = Number(b.split('_')[0]);
          return timeA - timeB;
        });

      const dbConnection = getEnv('MIGRATION_DB_CONNECTION', '', envFilePath);

      if (!dbConnection) {
        Logger.error('数据库连接字符串不存在,请在环境变量中配置 MIGRATION_DB_CONNECTION');
        process.exit(1);
      }
      const spinner = Logger.createLoading();
      spinner.start({
        text: '开始执行迁移任务,准备连接到数据库...',
        color: 'cyan',
      });

      const dbConnector = new DBConnector({
        type: dbType,
        connection: dbConnection,
      });
      await dbConnector.db.connect();
      spinner.update({
        text: '数据库连接成功',
        color: 'cyan',
      });

      // 当数据库中不存在 migrations 表时，创建 migrations 表
      await dbConnector.db.checkMigrationsTable();

      // 检查任务是否已执行
      async function checkTaskExecuted(taskName: string) {
        return await dbConnector.db.checkTaskExecuted(taskName);
      }

      async function executeTask(taskName: string) {
        if (await checkTaskExecuted(taskName)) {
          return;
        }
        const sqlContent = readFileSync(join(dir, taskName, 'main.sql'), 'utf-8').trim();
        spinner.update({
          text: `准备执行任务 ${taskName}`,
          color: 'cyan',
        });
        await dbConnector.db.transaction(async (client) => {
          await client.query(sqlContent);
          await dbConnector.db.updateTask(taskName, 'INSERT');
        });
        spinner.update({
          text: `执行任务 ${taskName} 完成`,
          color: 'cyan',
        });
      }
      for (const taskName of dirs) {
        await executeTask(taskName);
      }
      spinner.update({
        text: '任务执行完成，断开数据库连接...',
        color: 'cyan',
      });
      await dbConnector.db.disconnect();
      spinner.success({
        text: '迁移任务执行完成',
      });
    });
};
