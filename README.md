# Nostalgia Duel Server · GOAT

`goat-rule1` 是面向 YGOPro 客户端的独立 GOAT 服务端分支。赛制采用 2005 年 4 月 TCG 禁限卡表 `2005.4.1 W/O Exarion`、大师规则 1、8000 LP 和三局两胜制，支持局间换备、观战、录像和可选的排位天梯。GOAT 卡池白名单包含 1,740 个卡号，其中 1,718 个可入组。详见 [GOAT 卡池与资源说明](./nostalgia-resources/ygopro/formats/goat/README.md)。

## 玩家接入

使用兼容协议版本 `0x1362` 的 YGOPro 客户端。主机地址与端口以服务器公告为准。自行部署时，默认决斗端口为 TCP `706` 或 WebSocket `4002`。

| 用途 | 客户端「主机密码」 | 玩家名 |
| --- | --- | --- |
| 好友约战 | `goat#1001` 等，`#` 后填十进制房间号 | 昵称 |
| 天梯排位 | 留空、`TT` 或 `goat#TT`，均进入 GOAT 排位队列 | `昵称$PIN`，例如 `玩家A$Ab123` |

好友约战时，双方填写相同房间号。观战者填写同一房间标识，满员后以观战身份加入。排位由服主启用，首次使用新昵称加入时注册账号，之后使用相同的昵称和 PIN 登录。PIN 支持 4–6 位英文字母或数字，区分大小写。`昵称$PIN` 的完整输入最多占 20 个 UTF-16 码元。双方提交合法卡组并准备后，由房主点击开始。

## 天梯、录像与卡组统计

在部署实例的网页地址下打开 `/leaderboards/goat?tab=ladder`，可查看赛季榜和总榜。完整排位比赛结束后，战绩和积分按 GOAT 赛制保存。

- 打开榜单页面的「录像下载」标签，可以按昵称或卡组类型筛选，再选择「观看录像」或「下载 .yrp」。该页面也公开排位双方第一局初始卡组的类型与可下载的 `.ydk`。网页回放由服务端 WASM 核心重演已保存的录像，GOAT 回放可使用仓库随附的历史核心。用客户端本地打开 `.yrp` 时，客户端核心需识别 GOAT 录像写入的规则位。详见 [GOAT 决斗核心](./vendor/goat-core/README.md)。
- 「使用率」和「卡组胜率」基于天梯每场比赛第一局的初始卡组。分类器按 YDK 模板核对主卡组、额外卡组和副卡组各自的卡号及张数，允许加入模板外的卡。命中多个模板时，选三组总张数最少的模板。总张数相同时按模板目录顺序选取。未命中归为「其他」。

## GOAT 规则与历史裁定

GOAT 房间使用独立的 [WASM 决斗核心](./vendor/goat-core/README.md)，支持召唤成功后的起动效果优先权。攻击卷回允许改选攻击怪兽，两只攻击力均为 0 的攻击表示怪兽交战时双方进入战斗破坏判定，战斗伤害为 0。回合玩家若在同回合取得对手刚在其场上召唤或特殊召唤的怪兽，可在主要阶段按通常限制手动变更其表示形式。

| 卡号 | 卡名 | GOAT 裁定 |
| --- | --- | --- |
| 31786629 | 雷龙 | 卡组没有同名卡时仍可丢弃发动。有可加入手牌的同名卡时，选择 1 至 2 张加入手牌并展示。 |
| 63519819 / 64631466 | 千眼纳祭神 / 纳祭之魔 | 吸收效果处理时，发动者已离场或变成里侧表示，原对象留在对方场上。 |
| 6733059 | 死灵之巢 | 翻开发动时只翻卡。表侧存在后，可在合法时点除外自己墓地的怪兽作为代价，处理时选 1 只等等级的表侧怪兽破坏。 |
| 80604091 | 血之代偿 | 表侧存在后，可在自己的主要阶段或对方战斗阶段的适用时点支付 500 LP，进行 1 次通常召唤或盖放。 |
| 93016201 | 王宫的弹压 | 翻开发动时只翻卡。表侧存在后，双方均可在合法时点支付 800 LP，无效不入连锁的特殊召唤，或连锁无效包含特殊召唤的效果。 |
| 45986603 | 强夺 | 被夺取的怪兽翻为里侧表示后，仍由夺取方控制。 |

永续陷阱的最新修正已纳入分支提交 [`d7b0141`](https://github.com/sakurays120/Nostalgia-duel-server/commit/d7b0141c0ab6e1d7036cd28afd590dd68b3290dd)。现有实例需部署包含该提交的构建后才会应用修正。裁定来源及早期脚本记录见 [GOAT 历史裁定台账](./docs/goat/historical-card-rulings.md)。

## 本地启动

需要 Node.js **24.11.0 或更高版本**。默认启动 GOAT 约战，关闭排位和 Redis，无需部署数据库。

```bash
git clone --branch goat-rule1 --single-branch https://github.com/sakurays120/Nostalgia-duel-server.git
cd Nostalgia-duel-server
npm ci
cp .env.example .env
npm start
```

在兼容客户端连接 `127.0.0.1:706`，主机密码填 `goat#1001`。开发时可用 `npm run dev` 启动。配置项见 [.env.example](./.env.example)。

| 默认端口 | 配置变量 | 用途 |
| --- | --- | --- |
| `706` | `YGOPRO_PORT` | YGOPro TCP 决斗 |
| `4002` | `YGOPRO_WEBSOCKET_PORT` | YGOPro WebSocket 决斗 |
| `7922` | `HTTP_PORT` | 网页榜单、录像与 HTTP API |
| `4000` | `WEBSOCKET_PORT` | 实时 API 的 WebSocket |

## Docker 部署

首次部署时运行 `cp .env.example .env`。将 `.env` 中的 `SERVER_IMAGE` 指向由本分支构建的镜像，填写 `ADMIN_API_KEY`。也可在本机构建镜像并将其标签填入 `SERVER_IMAGE`。

```bash
docker build -t nostalgia-duel-server:goat .
```

### 仅约战

保持 `RANK_ENABLED=false` 和 `USE_REDIS=false`，使用单服务 Compose 配置。

```bash
docker compose -f docker-compose.cloud.yaml up -d
```

### 开启排位

使用 [排位 Compose 配置](./docker-compose.cloud.ranked.yaml)，同目录保留 [init.sql](./init.sql)。在 `.env` 中填写 `POSTGRES_PASSWORD` 与持久化目录绝对路径 `POSTGRES_DATA_DIR`，并核对 `POSTGRES_USER`、`POSTGRES_DB` 与现有数据库配置。该配置启用排位，使用 PostgreSQL 16，数据库端口仅绑定宿主回环地址。

```bash
docker compose -f docker-compose.cloud.ranked.yaml up -d postgres
docker compose -f docker-compose.cloud.ranked.yaml run --rm nostalgia-duel-server npm run migration:run:prod
docker compose -f docker-compose.cloud.ranked.yaml up -d
```

使用默认端口时，在部署主机访问 `http://127.0.0.1:7922/leaderboards/goat?tab=ladder` 核对天梯。数据库迁移也会导入 GOAT 卡组类型。需要发布使用率和卡组胜率时，运行以下命令。

```bash
docker compose -f docker-compose.cloud.ranked.yaml exec -T nostalgia-duel-server npm run rebuild:usage
```

在可访问同一数据库的源码环境中，可用 `npm run backfill:replay-decks -- --format=goat --dry-run` 预览历史录像回填，再用 `--execute` 替换 `--dry-run` 执行，完成后重建统计。录像可恢复第一局的主卡组和额外卡组，副卡组标记为未知。

## 资源与验证

卡库、禁限卡表、Lua 脚本、资源锁和决斗核心随应用一起发布和回滚。GOAT 先读取本赛制的 Lua 覆盖脚本，再回退到共用基础脚本。服务启动前校验资源锁，部署后可通过 `GET /api/resources/version` 核对实际启用的赛制和资源摘要。1103/1109 的裁定记录见 [2011 OCG 历史裁定台账](./docs/historical-card-rulings.md)。

```bash
npm run lint
npm test
npm run check:nostalgia-resources
```

资源检查会先构建项目。对已启动的本地 GOAT 实例执行 `npm run smoke:duel -- 706`，可验证约战、观战、真实 WASM 开局与换备。开启排位后，可在本地测试数据库上执行 `npm run smoke:ranked -- 706 7922`。排位冒烟会创建临时账号并写入战绩。

## 许可证

本项目由 [EDOpro-server-ts](https://github.com/diangogav/EDOpro-server-ts) 派生，采用 [MIT 许可证](./LICENSE)。
