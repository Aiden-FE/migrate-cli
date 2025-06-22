import { DBConnectorOptions, PostgresConnectorOptions, MySQLConnectorOptions } from '@/interfaces';
import PostgresConnector from './postgres';
import MySQLConnector from './mysql';

// 条件类型：根据数据库类型返回对应的连接器类型
type ConnectorType<T extends DBConnectorOptions> = T extends PostgresConnectorOptions
  ? PostgresConnector
  : T extends MySQLConnectorOptions
    ? MySQLConnector
    : never;

export default class DBConnector<T extends DBConnectorOptions> {
  public db: ConnectorType<T>;

  constructor(options: T) {
    switch (options.type) {
      case 'postgres':
        this.db = new PostgresConnector(options.connection) as ConnectorType<T>;
        break;
      case 'mysql':
        this.db = new MySQLConnector(options.connection) as ConnectorType<T>;
        break;
      default:
        throw new Error(`Unsupported database type: ${(options as any).type}`);
    }
  }
}
