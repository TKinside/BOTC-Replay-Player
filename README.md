# 《血染钟楼复盘器》

Blood on the Clocktower 说书人复盘 / 对局日志 Web 应用（mobile-first 静态站）。

仓库：[`TKinside/BOTC-Replay-Player`](https://github.com/TKinside/BOTC-Replay-Player)

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS
- Vitest（领域层单测，不依赖 DOM）
- IndexedDB（本地对局持久化，适配器 stub）

## 本地运行

```bash
pnpm install
pnpm dev      # 开发服务器
pnpm test     # 领域单测
pnpm build    # 生产构建
pnpm preview  # 预览构建产物
```

也可用 `npm install` / `npm run …`。

## 目录结构（解耦分层）

```
src/
  domain/          # 纯领域模型与 reduce（无 DOM）
  registries/      # 事件类型 / 状态 / 角色 / 脚本注册表
  application/     # 用例 / 命令编排
  ports/           # 仓储、脚本源、导出等接口
  adapters/        # IndexedDB / townsquare JSON / 官方库 / 长图导出
  ui/              # 页面与组件（mobile-first）
```

## 当前阶段

**脚手架（阶段 A 骨架）**：路由壳、领域类型与 `reduce` 冒烟、适配器 / 注册表 stubs。  
尚未实现：完整事件录入、圆桌精修、真实图标、PWA、统计、后端。
