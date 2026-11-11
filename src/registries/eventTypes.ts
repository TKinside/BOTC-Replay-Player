export interface EventTypeDef {
  id: string
  label: string
  /** Optional copy template for quick entry. */
  template?: string
}

/**
 * EventTypeRegistry stub.
 * New types = schema + copy template + optional form (later).
 */
const EVENT_TYPES: EventTypeDef[] = [
  { id: 'nomination', label: '提名', template: '{actor} 提名了 {target}' },
  { id: 'execution', label: '处决', template: '{target} 被处决' },
  { id: 'death', label: '死亡', template: '{target} 死亡' },
  { id: 'poison', label: '中毒', template: '{target} 中毒' },
  { id: 'drunk', label: '醉酒', template: '{target} 醉酒' },
  { id: 'revive', label: '复活', template: '{target} 复活' },
  { id: 'announce', label: '宣告' },
  { id: 'ability', label: '能力' },
  { id: 'custom', label: '自定义' },
]

export const EventTypeRegistry = {
  list(): EventTypeDef[] {
    return [...EVENT_TYPES]
  },
  get(id: string): EventTypeDef | undefined {
    return EVENT_TYPES.find((t) => t.id === id)
  },
}
