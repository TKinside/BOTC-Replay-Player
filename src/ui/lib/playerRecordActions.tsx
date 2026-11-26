import type { ReactNode } from 'react'

export type PlayerRecordActionId =
  | 'nominate-execute'
  | 'poison-drunk'
  | 'death-revive'
  | 'role-change'
  | 'claim-role'
  | 'gain-ability'
  | 'custom'

export type PlayerRecordAction = {
  id: PlayerRecordActionId
  label: string
  tag: string
}

/** Mini-program player-action rows shown after tapping a seat in 添加记录. */
export const PLAYER_RECORD_ACTIONS: PlayerRecordAction[] = [
  { id: 'nominate-execute', label: '提名/处决', tag: '通用' },
  {
    id: 'poison-drunk',
    label: '中毒/醉酒/恢复健康/恢复清醒',
    tag: '通用',
  },
  { id: 'death-revive', label: '死亡/不会死亡/复活', tag: '通用' },
  { id: 'role-change', label: '角色/阵营发生变化', tag: '通用' },
  { id: 'claim-role', label: '声称自己的角色', tag: '通用' },
  { id: 'gain-ability', label: '获得了能力', tag: '通用' },
  { id: 'custom', label: '自定义', tag: '通用' },
]

/** Compact monochrome glyphs used in pickers and event log lines. */
export function PlayerActionIcon({
  id,
  className = 'size-4 shrink-0',
}: {
  id: PlayerRecordActionId | string
  className?: string
}): ReactNode {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (id) {
    case 'nominate-execute':
      return (
        <svg {...common}>
          <path d="M14 4 20 10" />
          <path d="m14 10 6-6" />
          <path d="M4 20c4-1 7-4 9-9" />
          <circle cx="9" cy="9" r="2.5" />
        </svg>
      )
    case 'poison-drunk':
      return (
        <svg {...common}>
          <path d="m9 3 9 9-3 3-9-9z" />
          <path d="m14 8 3 3" />
          <path d="M5 19h8" />
        </svg>
      )
    case 'death-revive':
      return (
        <svg {...common}>
          <path d="M8 21V9a4 4 0 0 1 8 0v12" />
          <path d="M8 13h8" />
          <path d="M12 9v12" />
        </svg>
      )
    case 'role-change':
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 0 0-15.5-6.4" />
          <path d="M3 4v5h5" />
          <path d="M3 12a9 9 0 0 0 15.5 6.4" />
          <path d="M21 20v-5h-5" />
        </svg>
      )
    case 'claim-role':
      return (
        <svg {...common}>
          <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" />
          <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
          <path d="M18.5 7a7 7 0 0 1 0 10" />
        </svg>
      )
    case 'gain-ability':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      )
    case 'custom':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

export function isPlayerRecordActionId(
  value: unknown,
): value is PlayerRecordActionId {
  return (
    typeof value === 'string' &&
    PLAYER_RECORD_ACTIONS.some((a) => a.id === value)
  )
}

/** Sub-options after tapping「提名/处决」(mini-program post-menu). */
export type NominateExecuteOptionId =
  | 'nominate-player-with-votes'
  | 'nominate-player-no-votes'
  | 'nominate-storyteller'
  | 'voted'
  | 'executed-simple'

export type NominateExecuteOption = {
  id: NominateExecuteOptionId
  label: string
  /** Pick a second player (the nominee). */
  needsTargetPlayer: boolean
  /** After the nominee, collect a vote count. */
  needsVoteCount?: boolean
}

/**
 * Central list for the 提名/处决 post-menu — add rows here, not in the modal.
 * Visible options match the WeChat mini-program reference screenshots.
 */
export const NOMINATE_EXECUTE_OPTIONS: NominateExecuteOption[] = [
  {
    id: 'nominate-player-with-votes',
    label: '提名玩家(记录票数)',
    needsTargetPlayer: true,
    needsVoteCount: true,
  },
  {
    id: 'nominate-player-no-votes',
    label: '提名玩家(不记录票数)',
    needsTargetPlayer: true,
  },
  {
    id: 'nominate-storyteller',
    label: '提名说书人(仅用于无神论者在场)',
    needsTargetPlayer: false,
  },
  { id: 'voted', label: '投了票', needsTargetPlayer: false },
  {
    id: 'executed-simple',
    label: '被处决(简单记录)',
    needsTargetPlayer: false,
  },
]

/** Build the draft snippet for a 提名/处决 sub-option. */
export function composeNominateExecuteSnippet(input: {
  actorName: string
  optionId: NominateExecuteOptionId
  targetName?: string
  votes?: number
}): string {
  const actor = input.actorName.trim()
  switch (input.optionId) {
    case 'nominate-player-with-votes': {
      const target = input.targetName?.trim() || '?'
      const votes =
        typeof input.votes === 'number' && Number.isFinite(input.votes)
          ? Math.max(0, Math.floor(input.votes))
          : 0
      return `${actor}提名了${target}（${votes}票）`
    }
    case 'nominate-player-no-votes': {
      const target = input.targetName?.trim() || '?'
      return `${actor}提名了${target}`
    }
    case 'nominate-storyteller':
      return `${actor}提名了说书人`
    case 'voted':
      return `${actor}投了票`
    case 'executed-simple':
      return `${actor}被处决`
  }
}
