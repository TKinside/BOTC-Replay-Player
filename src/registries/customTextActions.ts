/**
 * Actions available in「添加自定义文本」between 行动者 and 目标.
 * Add new rows here — UI reads this list; do not hard-code options in the modal.
 */
export interface CustomTextActionDef {
  id: string
  /** Chinese verb shown in the dropdown and composed into the log string. */
  label: string
}

export const CUSTOM_TEXT_ACTIONS: CustomTextActionDef[] = [
  { id: 'learn', label: '得知' },
  { id: 'choose', label: '选择' },
  { id: 'kill', label: '杀死' },
  { id: 'poison', label: '下毒' },
  { id: 'drunk', label: '醉酒' },
  { id: 'protect', label: '保护' },
  { id: 'check', label: '查看' },
  { id: 'guess', label: '猜测' },
  { id: 'wake', label: '唤醒' },
  { id: 'show', label: '展示' },
]

export const CustomTextActionRegistry = {
  list(): CustomTextActionDef[] {
    return [...CUSTOM_TEXT_ACTIONS]
  },
  get(id: string): CustomTextActionDef | undefined {
    return CUSTOM_TEXT_ACTIONS.find((a) => a.id === id)
  },
}
