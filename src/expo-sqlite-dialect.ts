import type { SQLiteDatabase } from 'expo-sqlite'
import type { DatabaseIntrospector, Dialect, DialectAdapter, Driver, Kysely, QueryCompiler } from 'kysely'
import { SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from 'kysely'
import { ExpoSqliteDriver } from './expo-sqlite-driver'

export interface ExpoSqliteDialectConfig {
  /**
   * A function that returns an opened database.
   * Use `openDatabaseAsync` or `openDatabaseSync` from expo-sqlite.
   *
   * @example
   * import { openDatabaseAsync } from 'expo-sqlite'
   *
   * database: () => openDatabaseAsync('myapp.db')
   * // or
   * database: () => openDatabaseSync('myapp.db')
   */
  database: () => Promise<SQLiteDatabase>
  /**
   * Enable debug logging
   */
  debug?: boolean
}

export class ExpoSqliteDialect implements Dialect {
  readonly #config: ExpoSqliteDialectConfig

  constructor(config: ExpoSqliteDialectConfig) {
    this.#config = config
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter()
  }

  createDriver(): Driver {
    return new ExpoSqliteDriver(this.#config)
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db)
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler()
  }
}
