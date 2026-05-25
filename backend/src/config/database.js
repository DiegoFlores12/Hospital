import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

class ConnectionPool {
  static instance;

  static getInstance() {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new Pool({ connectionString: env.databaseUrl });
    }
    return ConnectionPool.instance;
  }
}

export const db = ConnectionPool.getInstance();
