import { vi } from 'vitest'

vi.mock('expo-sqlite', () => {
  const db = {
    getAllAsync: vi.fn(async () => []),
    runAsync: vi.fn(async () => ({ lastInsertRowId: 0, changes: 0 })),
    // Async iterator stub for streaming queries
    getEachAsync: vi.fn(async function* () {
      // no rows
    }),
    closeAsync: vi.fn(async () => {}),
  }

  return {
    addDatabaseChangeListener: vi.fn((_listener: (event: unknown) => void) => {
      return {
        remove: () => {
          // no-op
        },
      }
    }),
    openDatabaseAsync: vi.fn(async () => db),
    openDatabaseSync: vi.fn(() => db),
  }
})
