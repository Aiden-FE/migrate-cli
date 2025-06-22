import { type ClientConfig as PGClientConfig } from 'pg';
import { type ConnectionOptions as MySQLConnectionOptions } from 'mysql2/promise';

export type PostgresConnectorOptions = {
  type: 'postgres';
  connection: PGClientConfig | string;
};

export type MySQLConnectorOptions = {
  type: 'mysql';
  connection: MySQLConnectionOptions | string;
};

export type DBConnectorOptions = PostgresConnectorOptions | MySQLConnectorOptions;

export abstract class BaseClient {
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract execute(sql: string, params?: any[]): Promise<any>;
  abstract transaction(callback: (client: unknown) => Promise<void>): Promise<void>;
  abstract checkMigrationsTable(): Promise<void>;
  abstract checkTaskExecuted(taskName: string): Promise<boolean>;
  abstract updateTask(taskName: string, type: 'INSERT' | 'DELETE'): Promise<void>;
}
