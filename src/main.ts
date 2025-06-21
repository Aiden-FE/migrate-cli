import { Command } from 'commander';
import figlet from 'figlet';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import * as allCommands from './commands';
import { Logger } from './utils';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default () => {
  const program = new Command();

  // @ts-ignore
  Object.keys(allCommands).forEach((key) => allCommands[key](program));

  program
    .version(`v${pkg.version}`, '-v, --version')
    .description('Command line interfaces')
    .usage('<command> [option]')
    .on('--help', () => {
      Logger.log(`\r\n${figlet.textSync(pkg.name)}`);
      // 新增说明信息
      Logger.log(`\r\nRun ${chalk.cyan('migrate <command> --help')} show details\r\n`);
    })
    .parse(process.argv);
};
