import { Command } from 'commander';
import figlet from 'figlet';
import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import * as allCommands from './commands';
import { Logger } from './utils';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const filename = fileURLToPath(import.meta.url);
const currentDirname = dirname(filename);
const pkg = JSON.parse(readFileSync(path.resolve(currentDirname, '../package.json'), 'utf8'));
export default () => {
  const program = new Command();

  // @ts-ignore
  Object.keys(allCommands).forEach((key) => allCommands[key](program));

  program
    .version(`v${pkg.version}`, '-v, --version')
    .description('数据库迁移工具 - 支持多种数据库的版本管理CLI工具')
    .usage('<command> [option]')
    .on('--help', () => {
      Logger.log(`\r\n${figlet.textSync(pkg.name)}`);
      // 新增说明信息
      Logger.log(`\r\nRun ${chalk.cyan('migrate <command> --help')} show details\r\n`);
    })
    .parse(process.argv);
};
