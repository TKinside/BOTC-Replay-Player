# 静态部署 — 《血染钟楼复盘器》

应用是纯静态站（Vite `dist/`）。无后端；对局存在用户浏览器 IndexedDB。

## GitHub Pages（已配 workflow）

仓库已含 [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)：

1. GitHub → **Settings → Pages → Source: GitHub Actions**
2. 推送到 `main`（或手动 **Actions → Deploy GitHub Pages → Run workflow**）
3. 默认按 **project site** 构建：`BASE_PATH=/BOTC-Replay-Player/`  
   站点：`https://<user>.github.io/BOTC-Replay-Player/`
4. 若使用自定义域名 / user site 根路径：在仓库 **Settings → Variables** 设 `BASE_PATH=/`

深链（`/matches/...`）通过 `public/404.html` + `sessionStorage` 回跳处理。

## Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Connect Git
2. Build：
   - **Build command:** `pnpm install && pnpm test && pnpm build`
   - **Output directory:** `dist`
   - **Root:** `/`（保持 `BASE_PATH` 默认 `/`）
3. `public/_redirects` 已提供 SPA：`/* /index.html 200`

也可：`npx wrangler pages deploy dist`（需先 `pnpm build`）。

## 本地预览生产包

```bash
pnpm build && pnpm preview
# 模拟 GitHub project base：
BASE_PATH=/BOTC-Replay-Player/ pnpm build && pnpm preview
```

## 角色图标资源包

见 [`public/icons/roles/README.md`](../public/icons/roles/README.md)。默认不捆绑官方美术。
