import type { SQLiteDatabase } from 'expo-sqlite'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExpoSqliteDialect } from '../src/expo-sqlite-dialect'

vi.mock('expo-sqlite', () => ({
  addDatabaseChangeListener: vi.fn(() => ({ remove: vi.fn() })),
}))

describe('expoSqliteDialect', () => {
  let mockDatabase: SQLiteDatabase
  let dialect: ExpoSqliteDialect

  beforeEach(() => {
    mockDatabase = {
      closeAsync: vi.fn().mockResolvedValue(undefined),
      getAllAsync: vi.fn().mockResolvedValue([]),
      runAsync: vi.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 0 }),
      getEachAsync: vi.fn(),
    } as unknown as SQLiteDatabase

    dialect = new ExpoSqliteDialect({
      database: vi.fn().mockResolvedValue(mockDatabase),
      debug: false,
    })
  })

  describe('constructor', () => {
    it('should create dialect with config', () => {
      expect(dialect).toBeInstanceOf(ExpoSqliteDialect)
    })
  })

  describe('createAdapter', () => {
    it('should return SqliteAdapter', () => {
      const adapter = dialect.createAdapter()
      expect(adapter).toBeDefined()
      expect(adapter.supportsTransactionalDdl).toBe(false)
    })
  })

  describe('createDriver', () => {
    it('should return ExpoSqliteDriver instance', () => {
      const driver = dialect.createDriver()
      expect(driver).toBeDefined()
    })
  })

  describe('createIntrospector', () => {
    it('should return SqliteIntrospector', () => {
      const introspector = dialect.createIntrospector({} as any)
      expect(introspector).toBeDefined()
    })
  })

  describe('createQueryCompiler', () => {
    it('should return SqliteQueryCompiler', () => {
      const compiler = dialect.createQueryCompiler()
      expect(compiler).toBeDefined()
    })
  })
})
