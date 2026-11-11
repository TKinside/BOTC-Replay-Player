import type { StatusDef } from './types'

/**
 * StatusEffectRegistry stub — poison / drunk / dead / revive, etc.
 */
const STATUSES: StatusDef[] = [
  { id: 'poisoned', label: '中毒', colorToken: 'poison' },
  { id: 'drunk', label: '醉酒', colorToken: 'drunk' },
  { id: 'dead', label: '死亡', colorToken: 'dead' },
  { id: 'alive', label: '存活', colorToken: 'alive' },
]

export const StatusEffectRegistry = {
  list(): StatusDef[] {
    return [...STATUSES]
  },
  get(id: string): StatusDef | undefined {
    return STATUSES.find((s) => s.id === id)
  },
}
