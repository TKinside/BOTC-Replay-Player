import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Match } from '@/domain'
import type { MatchRepository } from '@/ports'

interface BotcDb extends DBSchema {
  matches: {
    key: string
    value: Match
    indexes: { 'by-updatedAt': string }
  }
}

const DB_NAME = 'botc-replay-player'
const DB_VERSION = 1

async function getDb(): Promise<IDBPDatabase<BotcDb>> {
  return openDB<BotcDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('matches')) {
        const store = db.createObjectStore('matches', { keyPath: 'id' })
        store.createIndex('by-updatedAt', 'updatedAt')
      }
    },
  })
}

/**
 * IndexedDB MatchRepository stub.
 * Migrations will live under adapters/persistence/migrations when schema evolves.
 */
export class IndexedDbMatchRepository implements MatchRepository {
  async listMatches(): Promise<Match[]> {
    const db = await getDb()
    const all = await db.getAllFromIndex('matches', 'by-updatedAt')
    return all.reverse()
  }

  async getMatch(id: string): Promise<Match | undefined> {
    const db = await getDb()
    return db.get('matches', id)
  }

  async saveMatch(match: Match): Promise<void> {
    const db = await getDb()
    await db.put('matches', match)
  }

  async deleteMatch(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('matches', id)
  }
}

export const indexedDbMatchRepository = new IndexedDbMatchRepository()
