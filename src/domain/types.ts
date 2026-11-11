/** Schema version for persisted Match documents. */
export type SchemaVersion = 1

export type FactionId =
  | 'townsfolk'
  | 'outsider'
  | 'minion'
  | 'demon'
  | 'traveler'
  | 'fabled'
  | 'loric'
  | 'unknown'

export type PhaseKind = 'setup' | 'night' | 'day' | 'end'

export type ScriptOrigin =
  | { kind: 'townsquare-json'; rawHash?: string }
  | { kind: 'official-library'; editionId?: string }
  | { kind: 'mixed' }

export interface RoleDef {
  id: string
  name: string
  faction: FactionId
  ability?: string
  iconKey?: string
  imageUrl?: string
  reminders?: string[]
  source: 'official' | 'script-json' | 'user'
  raw?: Record<string, unknown>
}

export interface ScriptSnapshot {
  origin: ScriptOrigin
  id: string
  name: string
  author?: string
  roles: RoleDef[]
  meta?: Record<string, unknown>
}

export interface MatchSettings {
  showPrepPhase: boolean
  showSeatNumbers: boolean
  allowAliases: boolean
}

export interface Player {
  id: string
  seatIndex: number
  name: string
  alias?: string
  roleId?: string
  tags?: string[]
}

export interface Phase {
  id: string
  kind: PhaseKind
  index: number
  label?: string
}

export interface StatusPatch {
  playerId: string
  statusId: string
  op: 'add' | 'remove' | 'replace'
  stacks?: number
  sourceEventId?: string
}

export interface GameEvent {
  id: string
  typeId: string
  phaseId: string
  at: string
  actorPlayerIds?: string[]
  targetPlayerIds?: string[]
  payload: Record<string, unknown>
  text?: string
  statusApply?: StatusPatch[]
}

export interface Match {
  schemaVersion: SchemaVersion
  id: string
  createdAt: string
  updatedAt: string
  title?: string
  script: ScriptSnapshot
  settings: MatchSettings
  players: Player[]
  phases: Phase[]
  events: GameEvent[]
  outcome?: {
    winner: 'good' | 'evil' | 'other' | 'unset'
    note?: string
  }
  perspective: 'storyteller-omniscient'
  meta?: Record<string, unknown>
}

/** Derived read model from append-only events. */
export interface MatchView {
  matchId: string
  playerCount: number
  eventCount: number
  currentPhase?: Phase
  winner?: Match['outcome'] extends infer O
    ? O extends { winner: infer W }
      ? W
      : undefined
    : undefined
}
