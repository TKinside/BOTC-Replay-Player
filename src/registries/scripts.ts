import type { ScriptSnapshot } from '@/domain'

/**
 * Lightweight in-memory script registry (edition tags / loaded snapshots).
 * Not a substitute for ScriptSnapshot frozen on each Match.
 */
export class ScriptRegistry {
  private readonly byId = new Map<string, ScriptSnapshot>()

  register(snapshot: ScriptSnapshot): void {
    this.byId.set(snapshot.id, snapshot)
  }

  get(id: string): ScriptSnapshot | undefined {
    return this.byId.get(id)
  }

  list(): ScriptSnapshot[] {
    return [...this.byId.values()]
  }
}

export const scriptRegistry = new ScriptRegistry()
