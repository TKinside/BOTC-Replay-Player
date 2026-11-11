import type { RoleDef } from '@/domain'

/** Trouble Brewing / 暗流涌动 — official Chinese wiki naming; icons are placeholders. */
export const TROUBLE_BREWING_ROLES: RoleDef[] = [
  // Townsfolk
  {
    id: 'washerwoman',
    name: '洗衣妇',
    faction: 'townsfolk',
    ability:
      '首个夜晚，你会得知两名玩家：其中一名是特定镇民角色。',
    reminders: ['镇民'],
    source: 'official',
    iconKey: 'washerwoman',
  },
  {
    id: 'librarian',
    name: '图书管理员',
    faction: 'townsfolk',
    ability:
      '首个夜晚，你会得知两名玩家：其中一名是特定外来者角色。若没有外来者，你会得知此信息。',
    reminders: ['外来者'],
    source: 'official',
    iconKey: 'librarian',
  },
  {
    id: 'investigator',
    name: '调查员',
    faction: 'townsfolk',
    ability:
      '首个夜晚，你会得知两名玩家：其中一名是特定爪牙角色。',
    reminders: ['爪牙'],
    source: 'official',
    iconKey: 'investigator',
  },
  {
    id: 'chef',
    name: '厨师',
    faction: 'townsfolk',
    ability: '首个夜晚，你会得知有多少对邪恶玩家相邻而坐。',
    source: 'official',
    iconKey: 'chef',
  },
  {
    id: 'empath',
    name: '共情者',
    faction: 'townsfolk',
    ability: '每个夜晚，你会得知你的活着的邻居中有多少名是邪恶的。',
    source: 'official',
    iconKey: 'empath',
  },
  {
    id: 'fortuneteller',
    name: '占卜师',
    faction: 'townsfolk',
    ability:
      '每个夜晚，选择两名玩家：你会得知其中是否有恶魔。有一名善良玩家会干扰你的能力。',
    reminders: ['红鲱鱼'],
    source: 'official',
    iconKey: 'fortuneteller',
  },
  {
    id: 'undertaker',
    name: '殡仪员',
    faction: 'townsfolk',
    ability: '每个夜晚*，你会得知今天白天被处决的玩家的角色。',
    reminders: ['死于今日'],
    source: 'official',
    iconKey: 'undertaker',
  },
  {
    id: 'monk',
    name: '僧侣',
    faction: 'townsfolk',
    ability:
      '每个夜晚*，选择一名除你以外的玩家：今晚恶魔的负面能力对该玩家无效。',
    reminders: ['保护'],
    source: 'official',
    iconKey: 'monk',
  },
  {
    id: 'ravenkeeper',
    name: '守鸦人',
    faction: 'townsfolk',
    ability: '如果你在夜晚死去，你会被唤醒，并选择一名玩家得知其角色。',
    source: 'official',
    iconKey: 'ravenkeeper',
  },
  {
    id: 'virgin',
    name: '贞洁者',
    faction: 'townsfolk',
    ability:
      '你第一次被提名时，如果提名者是镇民，则他立刻被处决。',
    reminders: ['禁止'],
    source: 'official',
    iconKey: 'virgin',
  },
  {
    id: 'slayer',
    name: '杀手',
    faction: 'townsfolk',
    ability: '每个游戏限一次，在白天时公开选择一名玩家：如果他是恶魔，他死亡。',
    source: 'official',
    iconKey: 'slayer',
  },
  {
    id: 'soldier',
    name: '士兵',
    faction: 'townsfolk',
    ability: '恶魔的负面能力对你无效。',
    source: 'official',
    iconKey: 'soldier',
  },
  {
    id: 'mayor',
    name: '市长',
    faction: 'townsfolk',
    ability:
      '如果只剩三名存活玩家且白天没有人被处决，则你的阵营获胜。如果你夜间将死于恶魔能力，可能会有另一名玩家替你死去。',
    source: 'official',
    iconKey: 'mayor',
  },
  // Outsiders
  {
    id: 'butler',
    name: '管家',
    faction: 'outsider',
    ability: '每个夜晚，选择一名玩家（不是你自己）：明天只有他在场时你才能投票。',
    reminders: ['主人'],
    source: 'official',
    iconKey: 'butler',
  },
  {
    id: 'drunk',
    name: '酒鬼',
    faction: 'outsider',
    ability: '你以为你是某个镇民角色，但其实不是。你喝醉了。',
    source: 'official',
    iconKey: 'drunk',
  },
  {
    id: 'recluse',
    name: '隐士',
    faction: 'outsider',
    ability: '你可能被当作邪恶阵营、爪牙或恶魔角色，即使已经死亡。',
    source: 'official',
    iconKey: 'recluse',
  },
  {
    id: 'saint',
    name: '圣徒',
    faction: 'outsider',
    ability: '如果你被处决，你的阵营落败。',
    source: 'official',
    iconKey: 'saint',
  },
  // Minions
  {
    id: 'poisoner',
    name: '投毒者',
    faction: 'minion',
    ability: '每个夜晚，选择一名玩家：他当晚及白天中毒。',
    reminders: ['中毒'],
    source: 'official',
    iconKey: 'poisoner',
  },
  {
    id: 'spy',
    name: '间谍',
    faction: 'minion',
    ability:
      '每个夜晚，你可以查看魔典。你可能被当作善良阵营、镇民或外来者角色，即使已经死亡。',
    source: 'official',
    iconKey: 'spy',
  },
  {
    id: 'scarletwoman',
    name: '红唇女郎',
    faction: 'minion',
    ability:
      '如果当天有五名或更多玩家存活，且恶魔死亡，你变成那个恶魔。',
    reminders: ['是恶魔'],
    source: 'official',
    iconKey: 'scarletwoman',
  },
  {
    id: 'baron',
    name: '男爵',
    faction: 'minion',
    ability: '会多出两名外来者。',
    source: 'official',
    iconKey: 'baron',
  },
  // Demon
  {
    id: 'imp',
    name: '小恶魔',
    faction: 'demon',
    ability:
      '每个夜晚*，选择一名玩家：他死亡。如果你因此自杀，一名爪牙会变成小恶魔。',
    reminders: ['死亡'],
    source: 'official',
    iconKey: 'imp',
  },
]

export const TROUBLE_BREWING_SCRIPT_IDS = TROUBLE_BREWING_ROLES.map((r) => r.id)
