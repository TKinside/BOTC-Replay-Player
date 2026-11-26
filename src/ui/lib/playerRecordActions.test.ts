import { describe, expect, it } from 'vitest'
import { composeNominateExecuteSnippet } from './playerRecordActions'

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
