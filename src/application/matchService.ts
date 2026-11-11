import {
  addPlayer as domainAddPlayer,
  advancePhase as domainAdvancePhase,
  appendEvent,
  assignRole as domainAssignRole,
  removePlayer as domainRemovePlayer,
  setScript,
  touchMatch,
  updatePlayer as domainUpdatePlayer,
  type GameEvent,
  type Match,
  type ScriptSnapshot,
  type StatusPatch,
} from '@/domain'
import type { MatchRepository } from '@/ports'
import type { LongImageExporter } from '@/ports'
import {
  officialRoleLibrary,
  parseTownsquareScriptText,
  type TownsquareParseOutcome,
} from '@/adapters/script'
import { createEmptyMatch } from './createEmptyMatch'
import { newId, nowIso } from './ids'
import { EventTypeRegistry } from '@/registries'

/** Application façade — UI talks to this, not adapters directly. */
export class MatchService {
  constructor(
    private readonly repo: MatchRepository,
    private readonly exporter: LongImageExporter,
  ) {}

  list(): Promise<Match[]> {
    return this.repo.listMatches()
  }

  get(id: string): Promise<Match | undefined> {
    return this.repo.getMatch(id)
  }

  async createTroubleBrewing(title?: string): Promise<Match> {
    const match = createEmptyMatch({
      title,
      script: officialRoleLibrary.buildTroubleBrewingSnapshot(),
    })
    await this.repo.saveMatch(match)
    return match
  }

  async createFromScriptJson(
    text: string,
    title?: string,
  ): Promise<{ match?: Match; parse: TownsquareParseOutcome }> {
    const parse = parseTownsquareScriptText(text)
    if (!parse.ok) return { parse }
    const match = createEmptyMatch({ title, script: parse.snapshot })
    await this.repo.saveMatch(match)
    return { match, parse }
  }

  async save(match: Match): Promise<Match> {
    const next = touchMatch(match)
    await this.repo.saveMatch(next)
    return next
  }

  async delete(id: string): Promise<void> {
    await this.repo.deleteMatch(id)
  }

  async importScriptIntoMatch(
    match: Match,
    text: string,
  ): Promise<{ match?: Match; parse: TownsquareParseOutcome }> {
    const parse = parseTownsquareScriptText(text)
    if (!parse.ok) return { parse }
    const next = await this.save(setScript(match, parse.snapshot))
    return { match: next, parse }
  }

  async applyOfficialTroubleBrewing(match: Match): Promise<Match> {
    return this.save(
      setScript(match, officialRoleLibrary.buildTroubleBrewingSnapshot()),
    )
  }

  async setScriptSnapshot(match: Match, script: ScriptSnapshot): Promise<Match> {
    return this.save(setScript(match, script))
  }

  async addPlayer(match: Match, name: string): Promise<Match> {
    return this.save(domainAddPlayer(match, name))
  }

  async updatePlayer(
    match: Match,
    playerId: string,
    patch: Parameters<typeof domainUpdatePlayer>[2],
  ): Promise<Match> {
    return this.save(domainUpdatePlayer(match, playerId, patch))
  }

  async removePlayer(match: Match, playerId: string): Promise<Match> {
    return this.save(domainRemovePlayer(match, playerId))
  }

  async assignRole(
    match: Match,
    playerId: string,
    roleId: string | undefined,
  ): Promise<Match> {
    return this.save(domainAssignRole(match, playerId, roleId))
  }

  async advancePhase(match: Match): Promise<Match> {
    return this.save(domainAdvancePhase(match))
  }

  async recordEvent(
    match: Match,
    input: {
      typeId: string
      text?: string
      actorPlayerIds?: string[]
      targetPlayerIds?: string[]
      payload?: Record<string, unknown>
    },
  ): Promise<Match> {
    const phase = match.phases[match.phases.length - 1]
    if (!phase) throw new Error('对局没有阶段')

    const typeDef = EventTypeRegistry.get(input.typeId)
    const statusApply = buildStatusPatches(input.typeId, input.targetPlayerIds)

    const event: GameEvent = {
      id: newId('evt'),
      typeId: input.typeId,
      phaseId: phase.id,
      at: nowIso(),
      actorPlayerIds: input.actorPlayerIds,
      targetPlayerIds: input.targetPlayerIds,
      payload: input.payload ?? {},
      text:
        input.text?.trim() ||
        renderTemplate(typeDef?.template, match, input) ||
        typeDef?.label ||
        input.typeId,
      statusApply,
    }

    return this.save(appendEvent(match, event))
  }

  exportLongImage(match: Match): Promise<Blob> {
    return this.exporter.exportMatch(match)
  }
}

function renderTemplate(
  template: string | undefined,
  match: Match,
  input: {
    actorPlayerIds?: string[]
    targetPlayerIds?: string[]
  },
): string | undefined {
  if (!template) return undefined
  const nameOf = (id?: string) =>
    match.players.find((p) => p.id === id)?.name ?? '?'
  return template
    .replace('{actor}', nameOf(input.actorPlayerIds?.[0]))
    .replace('{target}', nameOf(input.targetPlayerIds?.[0]))
}

function buildStatusPatches(
  typeId: string,
  targetPlayerIds?: string[],
): StatusPatch[] | undefined {
  if (!targetPlayerIds?.length) return undefined
  const map: Record<string, string> = {
    poison: 'poisoned',
    drunk: 'drunk',
    death: 'dead',
    revive: 'alive',
  }
  const statusId = map[typeId]
  if (!statusId) return undefined

  return targetPlayerIds.map((playerId) => {
    if (typeId === 'revive') {
      return { playerId, statusId: 'dead', op: 'remove' as const }
    }
    return { playerId, statusId, op: 'add' as const }
  })
}
