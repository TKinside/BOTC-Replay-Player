# 《血染钟楼复盘器》

Blood on the Clocktower 说书人复盘 / 对局日志 Web 应用（mobile-first 静态站）。

仓库：[`TKinside/BOTC-Replay-Player`](https://github.com/TKinside/BOTC-Replay-Player)

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS
- Vitest（领域层 / JSON 适配器 / 图标路径，不依赖 DOM）
- IndexedDB（`idb`）本地对局持久化

## 本地运行

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm test
pnpm build
pnpm preview
```

## 怎么用（最短路径）

1. **新建 · 官方脚本「暗流涌动」**，或首页直接 **导入 townsquare Script JSON**
2. 圆桌加人 / 指派角色（角色池来自本局脚本）
3. 日志：夜/昼阶段 + 结构化事件
4. 导出长图（昵称明文）

样例 JSON：[`public/samples/custom-script.sample.json`](public/samples/custom-script.sample.json)

## 角色图标

优先使用 Script JSON 的 `image` URL（**默认开启**）；失败则试 [`public/icons/roles/`](public/icons/roles/) 本地包（文件名 = role id，如 `washerwoman.webp`），再回退阵营色占位。说明见该目录 README。**请先确认美术许可再分发官方资源包。**

## 目录结构

```
src/
  domain/ application/ ports/ registries/
  adapters/
    script/        # townsquare JSON + OfficialRoleLibrary（TB + 旅人目录）
    icons/         # placeholder → local pack → (opt-in) remote
    persistence/ export/
  ui/
public/
  icons/roles/     # 用户自备官方图标包
  samples/         # Script JSON 样例
docs/deploy.md     # GitHub Pages / Cloudflare Pages
```

## 部署

见 [`docs/deploy.md`](docs/deploy.md)。已含 GitHub Actions Pages workflow；Cloudflare 用 `pnpm build` → `dist` + `_redirects`。

## 尚未做

PWA、统计、真实官方图标包（许可）、云同步。
