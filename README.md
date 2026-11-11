# 《血染钟楼复盘器》

Blood on the Clocktower 说书人复盘 / 对局日志 Web 应用（mobile-first 静态站）。

仓库：[`TKinside/BOTC-Replay-Player`](https://github.com/TKinside/BOTC-Replay-Player)

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS
- Vitest（领域层 / JSON 适配器单测，不依赖 DOM）
- IndexedDB（`idb`）本地对局持久化

## 本地运行

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm test     # 领域 + townsquare 适配器单测
pnpm build    # 生产构建
pnpm preview  # 预览构建产物
```

也可用 `npm install` / `npm run …`。

## 目录结构（解耦分层）

```
src/
  domain/          # 纯领域模型与 reduce（无 DOM）
  registries/      # 事件类型 / 状态 / 角色 / 脚本注册表
  application/     # 用例 / MatchService（UI 不直连适配器）
  ports/           # 仓储、脚本源、导出等接口
  adapters/
    persistence/   # IndexedDB MatchRepository
    script/        # townsquare JSON + OfficialRoleLibrary（暗流涌动）
    icons/         # 占位图标
    export/        # 长图导出（昵称明文）
  ui/              # 页面与组件（mobile-first）
```

## 当前可用（MVP 切片）

- 对局列表 ↔ IndexedDB：创建 / 打开 / 删除 / 自动保存
- 新建「暗流涌动」或导入 townsquare 兼容 Script JSON（含自制角色）
- 圆桌座位：加人、昵称、从本局脚本角色池指派
- 夜/昼阶段轴 + 结构化事件（提名/处决/死亡/毒/醉/复活/自定义）
- 长图 PNG 导出（昵称原样保留）

## 尚未做

完整事件录入打磨、圆桌动画精修、真实官方图标、PWA、统计、后端同步。
