import { describe, expect, it } from 'vitest'
import {
  composeNominateExecuteSnippet,
  composeStatusAnomalySnippet,
  PLAYER_RECORD_ACTIONS,
  STATUS_ANOMALY_OPTIONS,
} from './playerRecordActions'

describe('composeNominateExecuteSnippet', () => {
  it('nominates a player with vote count', () => {
    expect(
      composeNominateExecuteSnippet({
        actorName: '兼葭',
        optionId: 'nominate-player-with-votes',
        targetName: '凉下',
        votes: 8,
      }),
    ).toBe('兼葭提名了凉下（8票）')
  })

  it('nominates a player without votes', () => {
    expect(
      composeNominateExecuteSnippet({
        actorName: '兼葭',
        optionId: 'nominate-player-no-votes',
        targetName: '凉下',
      }),
    ).toBe('兼葭提名了凉下')
  })

  it('handles storyteller / voted / executed', () => {
    expect(
      composeNominateExecuteSnippet({
        actorName: '兼葭',
        optionId: 'nominate-storyteller',
      }),
    ).toBe('兼葭提名了说书人')
    expect(
      composeNominateExecuteSnippet({
        actorName: '小黑',
        optionId: 'voted',
      }),
    ).toBe('小黑投了票')
    expect(
      composeNominateExecuteSnippet({
        actorName: '满城雪',
        optionId: 'executed-simple',
      }),
    ).toBe('满城雪被处决')
  })
})

describe('STATUS_ANOMALY_OPTIONS', () => {
  it('renames the main menu entry to 状态异常', () => {
    expect(
      PLAYER_RECORD_ACTIONS.find((a) => a.id === 'poison-drunk')?.label,
    ).toBe('状态异常')
  })

  it('lists fixed statuses plus custom', () => {
    expect(STATUS_ANOMALY_OPTIONS.map((o) => o.id)).toEqual([
      'poisoned',
      'drunk',
      'recover-poison',
      'recover-drunk',
      'custom-status',
    ])
    expect(
      STATUS_ANOMALY_OPTIONS.find((o) => o.id === 'custom-status')
        ?.needsCustomText,
    ).toBe(true)
  })
})

describe('composeStatusAnomalySnippet', () => {
  it('writes fixed status phrases', () => {
    expect(
      composeStatusAnomalySnippet({
        actorName: '小黑',
        optionId: 'poisoned',
      }),
    ).toBe('小黑中毒了')
    expect(
      composeStatusAnomalySnippet({
        actorName: '小黑',
        optionId: 'drunk',
      }),
    ).toBe('小黑醉酒了')
    expect(
      composeStatusAnomalySnippet({
        actorName: '小黑',
        optionId: 'recover-poison',
      }),
    ).toBe('小黑恢复健康了(不再中毒)')
    expect(
      composeStatusAnomalySnippet({
        actorName: '小黑',
        optionId: 'recover-drunk',
      }),
    ).toBe('小黑恢复清醒了(不再醉酒)')
  })

  it('appends free-text custom status', () => {
    expect(
      composeStatusAnomalySnippet({
        actorName: '满城雪',
        optionId: 'custom-status',
        customText: '被迷住了',
      }),
    ).toBe('满城雪被迷住了')
  })
})
