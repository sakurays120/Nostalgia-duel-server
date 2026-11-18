#!/usr/bin/env bash
# 每日使用率统计重建（宝塔 / crontab 调用）
#
# 推荐 crontab（服务器本地时区为 Asia/Shanghai 时，北京时间每天 03:00，与运维手册一致）：
#   0 3 * * * /bin/bash /www/wwwroot/duel-server-goat/Nostalgia-duel-server-goat-rule1/scripts/rebuild-usage.sh
#
# 说明：
#   - CLI 依赖当前工作目录（读 cwd 下的 .env 与 nostalgia-resources），
#     因此脚本先 cd 到项目根目录，再用 node 绝对路径直接跑 dist 产物，
#     绕开宝塔 SSH/计划任务 PATH 里指向旧版系统 Node 的问题。
#   - 运行前提：已 npm run build 产出 dist，且项目根目录有 .env（POSTGRES_*）。

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

NODE_BIN="/www/server/nodejs/v24.21.0/bin/node"
CLI_REL="dist/src/shared/stats/usage/cli/rebuild-usage-cli.js"
LOG_DIR="/var/log/nostalgia"
LOG_FILE="${LOG_DIR}/usage-rebuild.log"

mkdir -p "${LOG_DIR}"

log() {
	printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %z')" "$*" >>"${LOG_FILE}"
}

log "===== rebuild:usage START ====="

if [[ ! -x "${NODE_BIN}" ]]; then
	log "ERROR: node not found or not executable at ${NODE_BIN}"
	exit 1
fi

cd "${PROJECT_ROOT}" || {
	log "ERROR: cannot cd to project root ${PROJECT_ROOT}"
	exit 1
}

if [[ ! -f "${CLI_REL}" ]]; then
	log "ERROR: ${PROJECT_ROOT}/${CLI_REL} not found. Run 'npm run build' first."
	exit 1
fi

"${NODE_BIN}" "./${CLI_REL}" >>"${LOG_FILE}" 2>&1
CODE=$?

log "===== rebuild:usage END (exit=${CODE}) ====="
exit "${CODE}"
