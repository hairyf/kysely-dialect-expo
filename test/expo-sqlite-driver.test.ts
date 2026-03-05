import type { SQLiteDatabase } from 'expo-sqlite'
import type { ExpoSqliteDriver } from '../src/expo-sqlite-driver'
import { CompiledQuery } from 'kysely'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpoSqliteDialect } from '../src/expo-sqlite-dialect'

vi.mock('expo-sqlite', () => ({
  addDatabaseChangeListener: vi.fn(() => ({ remove: vi.fn() })),
}))

describe('expoSqliteDriver', () => {
  let mockDatabase: SQLiteDatabase
  let driver: ExpoSqliteDriver

  beforeEach(() => {
    mockDatabase = {
      closeAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi.fn().mockResolvedValue([{ id: 1, name: 'test' }]),
      runAsync: vi.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      getEachAsync: vi.fn(),
    } as unknown as SQLiteDatabase

    const dialect = new ExpoSqliteDialect({
      database: vi.fn().mockResolvedValue(mockDatabase),
      debug: false,
    })

    driver = dialect.createDriver() as ExpoSqliteDriver
  })

  describe('init', () => {
    it('should initialize the database', async () => {
      await driver.init()
      expect(mockDatabase.closeAsync).not.toHaveBeenCalled()
    })
  })

  describe('acquireConnection', () => {
    it('should return a connection', async () => {
      await driver.init()
      const connection = await driver.acquireConnection()
      expect(connection).toBeDefined()
    })
  })

  describe('beginTransaction', () => {
    it('should begin transaction', async () => {
      await driver.init()
      const connection = await driver.acquireConnection()
      await driver.beginTransaction(connection, {})
      await driver.releaseConnection()
    })

    it('should begin transaction with isolation level', async () => {
      await driver.init()
      const connection = await driver.acquireConnection()
      await driver.beginTransaction(connection, { isolationLevel: 'read committed' })
      await driver.releaseConnection()
    })
  })

  describe('commitTransaction', () => {
    it('should commit transaction', async () => {
      await driver.init()
      const connection = await driver.acquireConnection()
      await driver.commitTransaction(connection)
    })
  })

  describe('rollbackTransaction', () => {
    it('should rollback transaction', async () => {
      await driver.init()
      const connection = await driver.acquireConnection()
      await driver.rollbackTransaction(connection)
    })
  })

  describe('releaseConnection', () => {
    it('should release connection', async () => {
      await driver.init()
      const _connection = await driver.acquireConnection()
      await driver.releaseConnection()
    })
  })

  describe('destroy', () => {
    it('should close database on destroy', async () => {
      await driver.init()
      await driver.destroy()
      expect(mockDatabase.closeAsync).toHaveBeenCalled()
    })

    it('should not throw if init was not called', async () => {
      await driver.destroy()
    })
  })

  describe('addChangeListener', () => {
    it('should return event subscription', async () => {
      const subscription = driver.addChangeListener(() => {})
      expect(subscription).toBeDefined()
      expect(subscription.remove).toBeDefined()
    })
  })

  describe('executeQuery', () => {
    it('should execute select query', async () => {
      await driver.init()
      const connection = await driver.acquireConnection()
      const result = await connection.executeQuery(
        CompiledQuery.raw('SELECT * FROM users'),
      )
      expect(result.rows).toEqual([{ id: 1, name: 'test' }])
      await driver.releaseConnection()
    })

    it('should execute insert query', async () => {
      await driver.init()
      const connection = await driver.acquireConnection()
      const result = await connection.executeQuery(
        CompiledQuery.raw('INSERT INTO users (name) VALUES (?)', ['test']),
      )
      expect(result.insertId).toBe(BigInt(1))
      expect(result.numAffectedRows).toBe(BigInt(1))
      await driver.releaseConnection()
    })

    it('should execute update query', async () => {
      await driver.init()
      const connection = await driver.acquireConnection()
      const result = await connection.executeQuery(
        CompiledQuery.raw('UPDATE users SET name = ? WHERE id = ?', ['updated', 1]),
      )
      expect(result.numAffectedRows).toBe(BigInt(1))
      await driver.releaseConnection()
    })

    it('should execute delete query', async () => {
      await driver.init()
      const connection = await driver.acquireConnection()
      const result = await connection.executeQuery(
        CompiledQuery.raw('DELETE FROM users WHERE id = ?', [1]),
      )
      expect(result.numAffectedRows).toBe(BigInt(1))
      await driver.releaseConnection()
    })
  })

  describe('streamQuery', () => {
    it('should throw for non-select queries', async () => {
      await driver.init()
      const connection = await driver.acquireConnection()

      const streamPromise = connection.streamQuery(
        CompiledQuery.raw('INSERT INTO users (name) VALUES (?)', ['test']),
      ).next()

      await expect(streamPromise).rejects.toThrow('Expo SQLite only supports streaming of select queries')

      await driver.releaseConnection()
    })
  })

  describe('debug mode', () => {
    it('should log queries in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const debugMockDatabase = {
        closeAsync: vi.fn().mockResolvedValue(undefined),
        getAllAsync: vi.fn().mockResolvedValue([{ id: 1 }]),
        runAsync: vi.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
        getEachAsync: vi.fn(),
      } as unknown as SQLiteDatabase

      const debugDialect = new ExpoSqliteDialect({
        database: vi.fn().mockResolvedValue(debugMockDatabase),
        debug: true,
      })

      const debugDriver = debugDialect.createDriver() as ExpoSqliteDriver
      await debugDriver.init()
      const connection = await debugDriver.acquireConnection()

      await connection.executeQuery(CompiledQuery.raw('SELECT * FROM users'))

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
      await driver.releaseConnection()
    })
  })
})
