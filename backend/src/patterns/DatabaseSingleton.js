import { Pool } from 'pg';

/**
 * Patrón CREACIONAL: Singleton.
 * Mantiene una sola instancia del pool de conexión hacia Neon/PostgreSQL.
 * Evita crear múltiples pools en distintas rutas o servicios del backend.
 */
class DatabaseSingleton {
  static instance = null;

  static getInstance() {
    if (!DatabaseSingleton.instance) {
      DatabaseSingleton.instance = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false
      });
    }
    return DatabaseSingleton.instance;
  }
}

export { DatabaseSingleton };
