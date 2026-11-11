import type { Match, ScriptSnapshot } from '@/domain'
import { newId, nowIso } from './ids'

const EMPTY_SCRIPT: ScriptSnapshot = {
  origin: { kind: 'official-library' },
  id: 'unset',
  name: '未选择脚本',
  roles: [],
}

/** Application helper: create a blank match shell for the editor. */
export function createEmptyMatch(partial?: {
  title?: string
  script?: ScriptSnapshot
}): Match {
  const at = nowIso()
  return {
    schemaVersion: 1,
    id: newId('match'),
    createdAt: at,
    updatedAt: at,
    title: partial?.title,
    script: partial?.script ?? EMPTY_SCRIPT,
    settings: {
      showPrepPhase: false,
      showSeatNumbers: true,
      allowAliases: false,
    },
    players: [],
    phases: [{ id: newId('phase'), kind: 'setup', index: 0, label: '准备' }],
    events: [],
    perspective: 'storyteller-omniscient',
  }
}
