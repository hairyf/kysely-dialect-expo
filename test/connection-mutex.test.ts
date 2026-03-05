import type { SQLiteDatabase } from 'expo-sqlite'
import type { ExpoSqliteDriver } from '../src/expo-sqlite-driver'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpoSqliteDialect } from '../src/expo-sqlite-dialect'

vi.mock('expo-sqlite', () => ({
  addDatabaseChangeListener: vi.fn(() => ({ remove: vi.fn() })),
}))

describe('connectionMutex', () => {
  let mockDatabase: SQLiteDatabase

  beforeEach(() => {
    mockDatabase = {
      closeAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi.fn().mockResolvedValue([]),
      runAsync: vi.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      getEachAsync: vi.fn(),
    } as unknown as SQLiteDatabase
  })

  it('should acquire and release connection sequentially', async () => {
    const dialect = new ExpoSqliteDialect({
      database: vi.fn().mockResolvedValue(mockDatabase),
      debug: false,
    })

    const driver = dialect.createDriver() as ExpoSqliteDriver
    await driver.init()

    const conn1 = await driver.acquireConnection()
    await driver.releaseConnection()

    const conn2 = await driver.acquireConnection()
    await driver.releaseConnection()

    expect(conn1).toBeDefined()
    expect(conn2).toBeDefined()
  })

  it('should wait for connection to be released', async () => {
    const dialect = new ExpoSqliteDialect({
      database: vi.fn().mockResolvedValue(mockDatabase),
      debug: false,
    })

    const driver = dialect.createDriver() as ExpoSqliteDriver
    await driver.init()

    const conn1 = await driver.acquireConnection()

    const conn2Promise = driver.acquireConnection()

    setTimeout(() => {
      driver.releaseConnection()
    }, 50)

    const conn2 = await conn2Promise

    expect(conn1).toBeDefined()
    expect(conn2).toBeDefined()

    await driver.releaseConnection()
  })

  it('should handle multiple rapid acquire/release', async () => {
    const dialect = new ExpoSqliteDialect({
      database: vi.fn().mockResolvedValue(mockDatabase),
      debug: false,
    })

    const driver = dialect.createDriver() as ExpoSqliteDriver
    await driver.init()

    const connections = []
    for (let i = 0; i < 5; i++) {
      const conn = await driver.acquireConnection()
      connections.push(conn)
      await driver.releaseConnection()
    }

    expect(connections).toHaveLength(5)
  })
})
