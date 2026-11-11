# 官方角色图标资源包（用户自备）

《血染钟楼复盘器》**默认不捆绑** Blood on the Clocktower 官方美术。  
版权归 The Pandemonium Institute / 集石等权利方；请在确认许可后再放入本目录并部署。

## 解析顺序（UX）

1. **Script JSON `image` URL — 默认开启**（导入脚本里的远程图标会直接加载；失败则继续下一步）
2. 本目录本地资源 `public/icons/roles/{id}.*`
3. 阵营色占位圆

可用 `CompositeIconResolver({ allowRemoteImages: false })` 关掉远程图（一般不需要）。

## 怎么放本地包

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
5. 重新 `pnpm build` / 部署后即可；无需改代码。

## 自制角色

Script JSON 的 `image` 字段**默认会加载**。若外链 CORS / 失效，可把同 id 文件丢进本目录作回退，或继续用阵营色占位。

## 清单对照

暗流涌动（TB）常用 id 见仓库 `src/adapters/script/officialRoles/troubleBrewing.ts`。  
也可在应用「脚本」页查看本局角色池 id。
