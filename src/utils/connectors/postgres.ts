import { Client as PGClient } from 'pg';
import { promiseTask } from '@compass-aiden/helpers/cjs';
import { BaseClient as Client, PostgresConnectorOptions } from '@/interfaces';
import Logger from '../logger';

export default class PostgresConnector extends Client {
  private client: PGClient;

  constructor(private options: PostgresConnectorOptions['connection']) {
    super();
    this.client = new PGClient(this.options);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  async execute(sql: string, params?: any[]): Promise<any> {
    return this.client.query(sql, params);
  }

  async transaction(callback: (client: PGClient) => Promise<void>): Promise<void> {
    try {
      await this.client.query('BEGIN');
      await callback(this.client);
      await this.client.query('COMMIT');
    } catch (error) {
      await this.client.query('ROLLBACK');
      throw error;
    }
  }

  // 当数据库中不存在 migrations 表时，创建 migrations 表
  async checkMigrationsTable(): Promise<void> {
    const checkSQL = `
        SELECT COUNT(*) FROM migrations;
      `;
    const [err, result] = await promiseTask(this.client.query(checkSQL));
    if (err || result?.rows[0]?.count === 0) {
      const createTableSQL = `
          CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `;
      await this.client.query(createTableSQL);
      Logger.info('创建 migrations 表成功');
    }
  }

  async checkTaskExecuted(taskName: string): Promise<boolean> {
    const checkSQL = `
        SELECT COUNT(*) FROM migrations WHERE name = $1;
      `;
    const result = await this.client.query(checkSQL, [taskName]);
    return result.rows[0].count > 0;
  }

  async updateTask(taskName: string, type: 'INSERT' | 'DELETE'): Promise<void> {
    const updateSQL = `
        ${type === 'INSERT' ? 'INSERT INTO migrations (name) VALUES ($1)' : 'DELETE FROM migrations WHERE name = $1'}
      `;
    await this.client.query(updateSQL, [taskName]);
  }
}
