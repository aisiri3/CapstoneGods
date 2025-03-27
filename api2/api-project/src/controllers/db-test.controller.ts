import {inject} from '@loopback/core';
import {get} from '@loopback/rest';
import {PostgresDataSource} from '../datasources/postgres-db.datasource';

export class DbTestController {
  constructor(
    @inject('datasources.postgres') private dataSource: PostgresDataSource,
  ) {}

  @get('/test-db-connection')
  async testConnection(): Promise<object> {
    try {
      // Execute a simple query to test the connection
      const result = await this.dataSource.execute('SELECT NOW() as current_time');
      return {
        success: true,
        message: 'Database connection successful',
        timestamp: result[0].current_time,
        dbConfig: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_DATABASE,
          user: process.env.DB_USER,
          // Don't expose password
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Database connection failed',
        error: error.message,
      };
    }
  }
}