/* eslint-disable no-useless-catch */
import type { EventSubscription } from 'expo-modules-core'
import type { DatabaseChangeEvent, SQLiteDatabase } from 'expo-sqlite'
import type {
  DatabaseConnection,
  Driver,
  QueryResult,
  TransactionSettings,
} from 'kysely'
import type { ExpoSqliteDialectConfig } from './expo-sqlite-dialect'
import { addDatabaseChangeListener } from 'expo-sqlite'
import {
  CompiledQuery,
  SelectQueryNode,
} from 'kysely'

export class ExpoSqliteDriver implements Driver {
  readonly #config: ExpoSqliteDialectConfig
  #db?: SQLiteDatabase
  #connectionMutex = new ConnectionMutex()

  constructor(config: ExpoSqliteDialectConfig) {
    this.#config = config
  }

  async init(): Promise<void> {
    this.#db = await this.#config.database()
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    await this.#connectionMutex.lock()
    return new ExpoSqliteConnection(this.#db!, this.#config.debug || false)
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings,
  ): Promise<void> {
    await connection.executeQuery(
      CompiledQuery.raw(`begin${settings.isolationLevel ? ` ${settings.isolationLevel}` : ''}`),
    )
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'))
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'))
  }

  async releaseConnection(): Promise<void> {
    this.#connectionMutex.unlock()
  }

  async destroy(): Promise<void> {
    if (this.#db) {
      await this.#db.closeAsync()
    }
  }

  addChangeListener(
    listener: (event: DatabaseChangeEvent) => void,
  ): EventSubscription {
    return addDatabaseChangeListener(listener)
  }
}

class ExpoSqliteConnection implements DatabaseConnection {
  readonly #db: SQLiteDatabase
  readonly #debug: boolean

  constructor(db: SQLiteDatabase, debug = false) {
    this.#db = db
    this.#debug = debug
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const { sql, parameters } = compiledQuery

    this.#logQuery(sql, parameters)

    try {
      const startTime = this.#debug ? Date.now() : 0

      const isSelect = sql.trim().toLowerCase().startsWith('select')
        || sql.toLowerCase().includes('returning')

      if (isSelect) {
        const rows = await this.#db.getAllAsync<O>(sql, parameters as any[])
        this.#logQueryComplete(startTime, { rows })
        return { rows }
      }
      else {
        const result = await this.#db.runAsync(sql, parameters as any[])
        this.#logQueryComplete(startTime, result)
        return {
          rows: [],
          insertId: BigInt(result.lastInsertRowId),
          numAffectedRows: BigInt(result.changes),
        }
      }
    }
    catch (error) {
      throw error
    }
  }

  #logQuery(sql: string, parameters: any): void {
    if (!this.#debug)
      return

    console.log('[expo-sqlite] Executing query:', sql)
    if (parameters && (Array.isArray(parameters) ? parameters.length > 0 : Object.keys(parameters).length > 0)) {
      console.log('[expo-sqlite] Parameters:', parameters)
    }
  }

  #logQueryComplete(startTime: number, result: any): void {
    if (!this.#debug)
      return

    const duration = Date.now() - startTime
    const rowCount = result.rows?.length || 0

    console.log(`[expo-sqlite] Query completed in ${duration}ms, returned ${rowCount} rows`)
  }

  async* streamQuery<O>(
    compiledQuery: CompiledQuery,
    _chunkSize?: number,
  ): AsyncIterableIterator<QueryResult<O>> {
    const { sql, parameters, query } = compiledQuery

    if (!SelectQueryNode.is(query)) {
      throw new Error('Expo SQLite only supports streaming of select queries')
    }

    if (this.#debug) {
      console.log('[expo-sqlite] Streaming query:', sql)
      if (parameters) {
        console.log('[expo-sqlite] Parameters:', parameters)
      }
    }

    try {
      const iterator = this.#db.getEachAsync<O>(sql, parameters as any[])

      for await (const row of iterator) {
        yield { rows: [row] }
      }

      if (this.#debug) {
        console.log('[expo-sqlite] Streaming query completed')
      }
    }
    catch (error) {
      throw error
    }
  }
}

class ConnectionMutex {
  #promise?: Promise<void>
  #resolve?: () => void

  async lock(): Promise<void> {
    while (this.#promise) {
      await this.#promise
    }

    this.#promise = new Promise((resolve) => {
      this.#resolve = resolve
    })
  }

  unlock(): void {
    const resolve = this.#resolve
    this.#promise = undefined
    this.#resolve = undefined
    resolve?.()
  }
}
