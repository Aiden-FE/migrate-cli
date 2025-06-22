import { getConfig, Logger, getEnv, DBConnector, checkCliUpdate } from '@/utils';
import { Command } from 'commander';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

export default (program: Command) => {
  program
    .command('rollback')
    .description('回滚迁移任务')
    .option('-c, --config <config>', '配置文件路径')
    .option('-A, --all', '回滚所有任务')
    .action(async (options) => {
      // 检查版本更新
      await checkCliUpdate();

      const { dir = 'migrations', dbType = 'postgres', envFilePath = '.env' } = getConfig(options.config);
      if (!existsSync(dir)) {
        Logger.error('迁移任务文件夹不存在,没有可回滚任务');
        process.exit(1);
      }
      let dirs = readdirSync(dir)
        .filter((result) => {
          const stat = statSync(join(dir, result));
          return stat.isDirectory();
        })
        .sort((a, b) => {
          const timeA = Number(a.split('_')[0]);
          const timeB = Number(b.split('_')[0]);
          return timeB - timeA;
        });
      // 非全量回滚时，只回滚最后一个任务
      if (!options.all) {
        dirs = dirs.slice(0, 1);
      }

      const dbConnection = getEnv('MIGRATION_DB_CONNECTION', '', envFilePath);

      if (!dbConnection) {
        Logger.error('数据库连接字符串不存在,请在环境变量中配置 MIGRATION_DB_CONNECTION');
        process.exit(1);
      }
      const spinner = Logger.createLoading();
      spinner.start({
        text: '开始回滚迁移任务,准备连接到数据库...',
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
      await dbConnector.db.checkMigrationsTable();
      for (const taskName of dirs) {
        const sqlContent = readFileSync(join(dir, taskName, 'rollback.sql'), 'utf-8').trim();
        await dbConnector.db.transaction(async (client) => {
          await client.query(sqlContent);
          await dbConnector.db.updateTask(taskName, 'DELETE');
        });
        spinner.update({
          text: `回滚任务 ${taskName} 完成`,
          color: 'cyan',
        });
      }
      spinner.update({
        text: '回滚迁移任务完成，断开数据库连接...',
        color: 'cyan',
      });
      await dbConnector.db.disconnect();
      spinner.success({
        text: '回滚迁移任务完成',
      });
    });
};
