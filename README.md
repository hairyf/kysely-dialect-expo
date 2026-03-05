# kysely-dialect-expo

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

A [Kysely](https://github.com/koskimas/kysely) dialect for [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/), allowing you to use the powerful Kysely query builder with SQLite databases in React Native/Expo applications.

## Install

```bash
npm install kysely-dialect-expo kysely expo-sqlite
# or
pnpm add kysely-dialect-expo kysely expo-sqlite
# or
yarn add kysely-dialect-expo kysely expo-sqlite
```

## Usage

```typescript
import * as SQLite from 'expo-sqlite'
import { Kysely } from 'kysely'
import { ExpoSqliteDialect } from 'kysely-dialect-expo'

interface Database {
  users: {
    id: number
    name: string
    email: string
  }
}

const db = new Kysely<Database>({
  dialect: new ExpoSqliteDialect({
    database: () => SQLite.openDatabaseAsync('myapp.db'),
  }),
})

// Query
const users = await db.selectFrom('users').selectAll().execute()

// Insert
await db.insertInto('users').values({ name: 'John', email: 'john@example.com' }).execute()
```

### With Options

```typescript
const db = new Kysely<Database>({
  dialect: new ExpoSqliteDialect({
    database: async () => {
      const db = await SQLite.openDatabaseAsync('myapp.db')
      await db.execAsync('PRAGMA foreign_keys = ON')
      return db
    },
    debug: __DEV__,
  }),
})
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| `database` | `() => Promise<SQLiteDatabase>` | Function that returns an opened database |
| `debug` | `boolean` | Enable debug logging |

## Platforms

- ✅ iOS
- ✅ Android
- ✅ macOS (Expo SDK 46+)
- ✅ Windows (Expo SDK 51+)
- ⚠️ Web (Experimental)

## Requirements

- Expo SDK 48+
- Kysely 0.24.0+

## License

MIT

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/kysely-dialect-expo?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/kysely-dialect-expo
[npm-downloads-src]: https://img.shields.io/npm/dm/kysely-dialect-expo?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/kysely-dialect-expo
[license-src]: https://img.shields.io/github/license/antfu/kysely-dialect-expo.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/kysely-dialect-expo/blob/main/LICENSE
