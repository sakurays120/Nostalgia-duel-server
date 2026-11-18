# 项目长期记忆

## 部署方式
- 用户生产环境为 **Linux 宝塔面板部署**（非 Docker）。此前讨论中曾按 docker-compose.cloud.ranked.yaml 给过容器内执行命令，已纠正：宝塔场景下应在项目根目录（通常 `/www/wwwroot/...`）直接用宿主 Node/npm 执行。
- 宝塔环境注意点：Node 需 >= 24.11.0（package.json engines）。**仅用绝对路径调 npm（如 `/www/server/nodejs/v24.21.0/bin/npm`）无效**——package.json 的 script 里写的是 `node ./dist/...`，脚本内的 `node` 仍从 PATH 解析，会落到系统旧版 Node。正确做法是先 `export PATH=/www/server/nodejs/v24.21.0/bin:$PATH`，再 `cd 项目根目录 && node -v && npm run rebuild:usage`。宝塔计划任务 PATH 更干净，同样需前置 PATH 或用 node 绝对路径直接跑 dist。

## 使用率统计
- `npm run rebuild:usage` 执行的是编译产物 `dist/src/shared/stats/usage/cli/rebuild-usage-cli.js`，运行前必须有 dist、项目根目录 `.env`（POSTGRES_*）、以及 `nostalgia-resources/ygopro/formats/goat/cards.cdb`。
- rebuild:usage 依赖 cwd：dotenv 读 cwd 的 .env，goat 卡池路径基于 process.cwd()。必须在项目根目录执行。
