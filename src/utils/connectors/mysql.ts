import { BaseClient as Client, MySQLConnectorOptions } from '@/interfaces';
import { createConnection, Connection, ConnectionOptions } from 'mysql2/promise';

export default class MySQLConnector extends Client {
  private client!: Connection;

  constructor(private options: MySQLConnectorOptions['connection']) {
    super();

    let connectionOptions: ConnectionOptions | string;

    if (typeof this.options === 'string') {
      // 如果是连接字符串，需要添加 multipleStatements 参数
      const url = new URL(this.options);
      url.searchParams.set('multipleStatements', 'true');
      connectionOptions = url.toString();
    } else {
      // 如果是对象配置，直接添加 multipleStatements
      connectionOptions = {
        ...this.options,
        multipleStatements: true,
      };
    }

    createConnection(connectionOptions as ConnectionOptions).then((connection) => {
      this.client = connection;
    });
  }

  private async onReady() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.client) {
          resolve(true);
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  async connect(): Promise<void> {
    await this.onReady();
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return this.client.query(sql, params);
  }

  async transaction(callback: (connection: Connection) => Promise<void>) {
    try {
      await this.client.beginTransaction();
      await callback(this.client);
      await this.client.commit();
    } catch (e) {
      await this.client.rollback();
      throw e;
    }
  }

  // 当数据库中不存在 migrations 表时，创建 migrations 表
  async checkMigrationsTable(): Promise<void> {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;
    await this.client.query(createTableSQL);
  }

  async checkTaskExecuted(taskName: string): Promise<boolean> {
    const checkSQL = `
        SELECT COUNT(*) as count FROM migrations WHERE name = ?;
      `;
    const [result] = await this.client.query(checkSQL, [taskName]);
    return (result as any)?.[0]?.count > 0;
  }

  async updateTask(taskName: string, type: 'INSERT' | 'DELETE'): Promise<void> {
    const updateSQL = `
        ${type === 'INSERT' ? 'INSERT INTO migrations (name) VALUES (?)' : 'DELETE FROM migrations WHERE name = ?'}
      `;
    await this.client.query(updateSQL, [taskName]);
  }
}
