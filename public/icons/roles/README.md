# 官方角色图标资源包（用户自备）

《血染钟楼复盘器》**默认不捆绑** Blood on the Clocktower 官方美术。  
版权归 The Pandemonium Institute / 集石等权利方；请在确认许可后再放入本目录并部署。

## 怎么放

1. 将角色图标文件放到本目录（与本 README 同级）。
2. 文件名必须是 **townsquare / 官方 id**（小写、无空格），例如：

   | 文件名 | 角色 |
   | --- | --- |
   | `washerwoman.webp` | 洗衣妇 |
   | `fortuneteller.png` | 占卜师 |
   | `scarletwoman.svg` | 红唇女郎 |
   | `imp.webp` | 小恶魔 |

3. 支持扩展名（按优先级尝试）：`.webp` → `.png` → `.svg` → `.jpg`
4. 建议正方形、透明底，边长 ≥ 128px。
5. 重新 `pnpm build` / 部署后即可；无需改代码。`IconResolver` 会优先读这里的资源，缺失时回退阵营色占位。

## 自制角色

Script JSON 里的 `image` URL **默认不自动加载**（防跟踪 / CORS）。  
需要时在后续版本打开远程图标开关；当前请把自制图也按 id 丢进本目录。

## 清单对照

暗流涌动（TB）常用 id 见仓库 `src/adapters/script/officialRoles/troubleBrewing.ts`。  
也可在应用「脚本」页查看本局角色池 id。
