import { Request, Response } from "express";

import { listGoatEngineVersions } from "@shared/stats/replay-playback/application/SimulateReplayPlayback";
import { config } from "src/config";

const PAGE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>播放 · 录像回放</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
body { background: #090c12; color: #d8dee9; font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; overflow: hidden; font-size: 12px; }
.app { display: flex; height: 100vh; }

/* ---------- 左侧控制栏 ---------- */
.sidebar { width: 188px; flex-shrink: 0; background: #10141c; border-right: 1px solid #222a38; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.player-infos { display: flex; gap: 4px; padding: 6px 6px 2px; }
.pinfo { flex: 1; min-width: 0; background: #171d28; border: 1px solid #2a3444; border-radius: 3px; padding: 5px 6px; }
.pinfo .nm { font-weight: 600; color: #eef2f8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
.pinfo .lp { font-size: 18px; font-weight: 700; color: #e8edf5; line-height: 1.1; }
.pinfo .hc { color: #7f8a9e; font-size: 10px; }
.pinfo.turn { border-color: #b23a72; box-shadow: inset 0 0 0 1px rgba(178,58,114,.4); }
.duel-meta { padding: 4px 8px 6px; color: #7f8a9e; font-size: 10px; line-height: 1.45; word-break: break-all; }
.duel-meta .hl { color: #c8d1e0; }
.duel-meta .act { color: #9fb0cc; }

/* 阶段按钮 */
.phasebar { display: flex; gap: 2px; padding: 0 6px 6px; }
.phase { flex: 1; text-align: center; padding: 3px 0; font-size: 10px; color: #6f7a8e; background: #171d28; border: 1px solid #2a3444; border-radius: 2px; user-select: none; }
.phase.active { background: #b23a72; color: #fff; border-color: #d14b88; font-weight: 700; }

/* 控制按钮两列网格 */
.ctrl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 0 6px 6px; }
.ctrl-grid button, .ctrl-grid select { width: 100%; min-width: 0; background: #171d28; color: #b9c3d4; border: 1px solid #2a3444; border-radius: 3px; padding: 4px 2px; font-size: 10px; cursor: pointer; text-align: center; }
.ctrl-grid button:hover { background: #202a3a; }
.ctrl-grid button.on { border-color: #d14b88; color: #ffd0e4; }
.ctrl-grid button:disabled { opacity: .4; cursor: default; }
.ctrl-grid .wide { grid-column: span 2; }
.jump-row { grid-column: span 2; display: flex; gap: 3px; align-items: stretch; }
.jump-row input { width: 42px; min-width: 0; background: #0d1119; color: #e8edf5; border: 1px solid #2a3444; border-radius: 3px; padding: 4px; font-size: 11px; }
.jump-row .total { flex: 1; background: #0d1119; border: 1px solid #2a3444; border-radius: 3px; padding: 4px 6px; color: #7f8a9e; font-size: 11px; display: flex; align-items: center; }
.jump-row button { width: auto; flex-shrink: 0; padding: 4px 8px; white-space: nowrap; }

/* 操作记录 */
.log-header { padding: 5px 8px; font-weight: 600; color: #eaf1fb; background: #2f6db0; border-top: 1px solid #3a7cc4; border-bottom: 1px solid #245590; }
.loglist { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 0; font-size: 10px; }
.logitem { display: flex; align-items: center; gap: 5px; padding: 3px 7px; color: #9aa6bb; cursor: pointer; border-left: 2px solid transparent; line-height: 1.3; }
.logitem:hover { background: #182031; }
.logitem.current { background: #1f2c44; border-left-color: #d14b88; color: #eaf1fb; }
.logitem .thumb { width: 26px; height: 36px; flex-shrink: 0; border-radius: 2px; object-fit: cover; background: #1a2230; border: 1px solid #2a3444; }
.logitem .thumb-ph { width: 26px; height: 36px; flex-shrink: 0; }
.logitem .txt { min-width: 0; }
.logitem .idx { color: #5a6578; margin-right: 5px; }
.log-empty { padding: 10px; color: #5a6578; text-align: center; }

/* ---------- 右侧决斗场地 ---------- */
.board { flex: 1; min-width: 0; position: relative; overflow: auto; background: radial-gradient(ellipse at 50% 35%, #1b2540 0%, #131a2b 45%, #0b1019 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 18px; gap: 0; }
.board.zoomed .card, .board.zoomed .slot, .board.zoomed .pile { transform: scale(1.18); }
.half { width: 100%; max-width: 760px; }
.edge-row { display: grid; grid-template-columns: 95px 1fr 95px; align-items: end; gap: 8px; margin: 5px 0; }
.edge-row.empty-edge { grid-template-columns: 95px 1fr 95px; }
.hand-row { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; min-height: 112px; align-items: flex-end; }
.pile { position: relative; width: 95px; height: 110px; justify-self: center; }
.card-back { width: 100%; height: 100%; border-radius: 5px; border: 1px solid #6b3b2a; background: repeating-linear-gradient(45deg, #5a1e14, #5a1e14 5px, #7a2a1c 5px, #7a2a1c 10px); box-shadow: inset 0 0 0 3px #41150e, inset 0 0 0 4px #8a4a34; }
.pile-badge { position: absolute; top: -7px; left: -7px; min-width: 22px; height: 22px; padding: 0 4px; background: #0d1626; border: 1px solid #4a6fa5; border-radius: 4px; color: #cfe0f7; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.zone-row { display: grid; grid-template-columns: 34px repeat(5, 95px) 34px; gap: 6px; align-items: center; justify-content: center; margin: 4px 0; }
.zone-row.spell { margin-bottom: 6px; }
.zone-badge { height: 110px; border: 1px solid #2a3444; background: #0e1420; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #8a97ad; font-size: 12px; font-weight: 700; }
.slot { position: relative; width: 95px; height: 110px; border: 1px solid #232d3d; background: rgba(18,26,40,.75); border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.slot .num { position: absolute; top: 2px; left: 4px; color: #5f6c82; font-size: 10px; z-index: 2; text-shadow: 0 1px 2px #000; }
.mono .slot .num { left: auto; right: 4px; }
.hand-row .card { width: 95px; height: 110px; flex-shrink: 0; }
.card { position: relative; width: 95px; height: 110px; border-radius: 5px; overflow: hidden; border: 1px solid #3a4a60; background: #141b29; display: flex; flex-direction: column; align-items: center; }
.card .card-img { width: 90px; height: 90px; object-fit: cover; display: block; flex-shrink: 0; margin-top: 1px; border-radius: 3px; }
.card .card-name-fallback { display: none; position: absolute; top: 1px; left: 50%; transform: translateX(-50%); width: 90px; height: 90px; align-items: center; justify-content: center; text-align: center; padding: 3px; font-size: 10px; line-height: 1.2; color: #eef2f8; word-break: break-all; background: #1c2638; border-radius: 3px; }
.card .card-name-label { width: 100%; height: 18px; min-height: 18px; display: flex; align-items: center; justify-content: center; padding: 0 3px; font-size: 10px; line-height: 1; color: #e6ecf5; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: rgba(8,12,20,.55); }
.card.facedown .card-back { width: 90px; height: 90px; margin-top: 1px; flex-shrink: 0; }
.card.facedown.translucent { opacity: .5; }
.card.atk-pos { border-color: #5fa85f; }
.card.def-pos { border-color: #5f7fb0; }
.card .stat { position: absolute; bottom: 18px; left: 1px; right: 1px; background: rgba(6,12,22,.88); color: #d8ffe0; font-size: 10px; font-weight: 700; text-align: center; z-index: 3; }
.card.hl { box-shadow: 0 0 0 2px #d14b88, 0 0 12px rgba(209,75,136,.7); }
/* 卡牌类型配色：通常怪兽 / 效果怪兽 / 仪式怪兽 / 融合怪兽 / 魔法 / 陷阱 */
.card.ct-normal  { background: #2a2415; border-color: #a98b3f; }
.card.ct-normal  .card-name-label { background: rgba(120,96,36,.55); }
.card.ct-effect  { background: #301a10; border-color: #cf6a2c; }
.card.ct-effect  .card-name-label { background: rgba(150,70,28,.6); }
.card.ct-ritual  { background: #161f36; border-color: #6f8ee0; }
.card.ct-ritual  .card-name-label { background: rgba(70,100,190,.6); }
.card.ct-fusion  { background: #281836; border-color: #a878d8; }
.card.ct-fusion  .card-name-label { background: rgba(140,86,190,.6); }
.card.ct-spell   { background: #12291b; border-color: #3fa562; }
.card.ct-spell   .card-name-label { background: rgba(46,140,80,.6); }
.card.ct-trap    { background: #301527; border-color: #cf5a9e; }
.card.ct-trap    .card-name-label { background: rgba(170,64,132,.6); }
.field-divider { height: 1px; background: linear-gradient(90deg, transparent, #2a3444, transparent); margin: 8px 0; }
.win-banner { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: rgba(12,18,30,.94); border: 2px solid #d14b88; border-radius: 8px; padding: 18px 32px; font-size: 20px; font-weight: 700; color: #ffd0e4; display: none; z-index: 10; text-align: center; }
.loading, .errbox { color: #8b93a7; font-size: 14px; text-align: center; }
.errbox { color: #ff7b72; }
select { font-family: inherit; }

/* ---------- 卡牌详情弹窗 ---------- */
.card-modal { position: fixed; inset: 0; background: rgba(3,6,12,.82); z-index: 100; display: none; align-items: center; justify-content: center; padding: 24px; }
.card-modal.open { display: flex; }
.cm-panel { position: relative; width: min(760px, 96vw); max-height: 92vh; overflow-y: auto; background: #121824; border: 1px solid #33415a; border-radius: 8px; box-shadow: 0 18px 60px rgba(0,0,0,.65); padding: 18px 20px 22px; }
.cm-close { position: absolute; top: 10px; right: 12px; background: #1c2534; color: #b9c3d4; border: 1px solid #2a3444; border-radius: 4px; font-size: 18px; line-height: 1; width: 28px; height: 28px; cursor: pointer; }
.cm-close:hover { background: #2a3547; color: #fff; }
.cm-head { display: flex; gap: 18px; }
.cm-img { width: 200px; height: 280px; flex-shrink: 0; object-fit: contain; background: #0c121d; border: 1px solid #2a3444; border-radius: 6px; }
.cm-img-ph { width: 200px; height: 280px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #0c121d; border: 1px solid #2a3444; border-radius: 6px; color: #5a6578; font-size: 12px; text-align: center; padding: 8px; }
.cm-info { min-width: 0; flex: 1; }
.cm-name { font-size: 20px; font-weight: 700; color: #f0f4fb; margin-bottom: 2px; }
.cm-alt { font-size: 11px; color: #8a97ad; line-height: 1.5; margin-bottom: 10px; word-break: break-word; }
.cm-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 12px; }
.cm-tag { background: #1c2740; border: 1px solid #2f4066; border-radius: 3px; padding: 2px 7px; color: #bcd0ef; font-size: 11px; }
.cm-tag.stat { background: #1b3326; border-color: #2f5a40; color: #a8e6c0; }
.cm-grid { display: grid; grid-template-columns: 68px 1fr; gap: 4px 8px; font-size: 12px; line-height: 1.45; }
.cm-grid .k { color: #7f8a9e; }
.cm-grid .v { color: #d5deec; word-break: break-word; }
.cm-sec { margin-top: 16px; border-top: 1px solid #263044; padding-top: 10px; }
.cm-sec h4 { font-size: 12px; color: #9fb0cc; margin-bottom: 5px; font-weight: 600; }
.cm-sec .txt { font-size: 12px; color: #c2ccdc; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.cm-loading { color: #8b93a7; padding: 24px; text-align: center; }
.card, .logitem .thumb { cursor: pointer; }
.card:hover { border-color: #d14b88; }
.logitem .thumb:hover { border-color: #d14b88; }
</style>
</head>
<body>
<div class="app">
  <aside class="sidebar">
    <div class="player-infos" id="player-infos"></div>
    <div class="duel-meta" id="duel-meta"></div>
    <div class="phasebar" id="phase-bar">
      <div class="phase" data-phase-label="D">D</div>
      <div class="phase" data-phase-label="P">P</div>
      <div class="phase" data-phase-label="SP">SP</div>
      <div class="phase" data-phase-label="MP1">MP1</div>
      <div class="phase" data-phase-label="BP">BP</div>
      <div class="phase" data-phase-label="MP2">MP2</div>
      <div class="phase" data-phase-label="EP">EP</div>
    </div>
    <div class="ctrl-grid" id="controls" style="display:none">
      <button id="btn-play">▶ 继续播放</button>
      <button id="btn-step">单步 ▶</button>
      <select id="speed">
        <option value="1200">0.5×</option>
        <option value="600" selected>1×</option>
        <option value="300">2×</option>
        <option value="120">5×</option>
        <option value="40">16×</option>
      </select>
      <button id="btn-restart">○ 重新开始</button>
      <button id="btn-toggle-view">⇄ 切换视角</button>
      <button id="btn-toggle-sound">♪ 音效:关</button>
      <button id="btn-toggle-facedown">◐ 里侧卡半透明</button>
      <button id="btn-toggle-hands">☑ 显示双方手牌</button>
      <button id="btn-zoom">⊕ 放大场地</button>
      <button id="btn-exit">⏻ 退出播放</button>
      <button id="btn-more" class="wide">⋯ 更多</button>
      <div class="jump-row">
        <input id="jump-input" type="number" min="1" value="1">
        <span class="total" id="jump-total">/ 1</span>
        <button id="btn-jump">跳到回合</button>
      </div>
    </div>
    <div class="log-header">操作记录</div>
    <div class="loglist" id="loglist"></div>
  </aside>
  <main class="board" id="board">
    <div class="loading" id="loading">正在加载并解析录像…</div>
    <div class="half" id="half-1" style="display:none">
      <div class="edge-row">
        <div class="pile" id="deck-1"><div class="card-back"></div><span class="pile-badge">0</span></div>
        <div class="hand-row" id="hand-1"></div>
        <div class="pile" id="extra-1"><div class="card-back"></div><span class="pile-badge">0</span></div>
      </div>
      <div class="zone-row" id="mzone-1"></div>
      <div class="zone-row spell" id="szone-1"></div>
    </div>
    <div class="field-divider" id="divider" style="display:none"></div>
    <div class="half mono" id="half-0" style="display:none">
      <div class="zone-row" id="mzone-0"></div>
      <div class="zone-row spell" id="szone-0"></div>
      <div class="edge-row">
        <div class="pile" id="extra-0"><div class="card-back"></div><span class="pile-badge">0</span></div>
        <div class="hand-row" id="hand-0"></div>
        <div class="pile" id="deck-0"><div class="card-back"></div><span class="pile-badge">0</span></div>
      </div>
    </div>
    <div class="win-banner" id="winbanner"></div>
  </main>
</div>
<div class="card-modal" id="card-modal">
  <div class="cm-panel" id="cm-panel">
    <button class="cm-close" id="cm-close" title="关闭">×</button>
    <div id="cm-content"><div class="cm-loading">正在加载卡牌信息…</div></div>
  </div>
</div>
<script>
var FORMAT = "__FORMAT__";
var REPLAY_ID = "__REPLAY_ID__";
var CARD_IMG_VERSION = "__CARD_IMG_VERSION__";
var ENGINE_VERSIONS = __ENGINE_VERSIONS__;
var urlParams = new URLSearchParams(location.search);
var ENGINE = urlParams.get("engine") || "";
var API_URL = "/api/replays/" + encodeURIComponent(FORMAT) + "/" + encodeURIComponent(REPLAY_ID) + "/playback";
if (ENGINE) { API_URL += "?engine=" + encodeURIComponent(ENGINE); }
document.getElementById("btn-exit").onclick = function () { location.href = "/leaderboards/" + encodeURIComponent(FORMAT) + "?tab=replays"; };

(function initEnginePicker() {
  if (!ENGINE_VERSIONS.length) return;
  var picker = document.createElement("div");
  picker.className = "engine-picker";
  picker.style.cssText = "padding:0 6px 6px;color:#7f8a9e;font-size:10px";
  picker.textContent = "引擎版本 ";
  var select = document.createElement("select");
  select.id = "engine-select";
  select.style.cssText = "background:#171d28;color:#b9c3d4;border:1px solid #2a3444;font-size:10px;max-width:150px";
  var auto = document.createElement("option");
  auto.value = ""; auto.textContent = "自动";
  select.appendChild(auto);
  ENGINE_VERSIONS.forEach(function (v) {
    var opt = document.createElement("option");
    opt.value = v.id; opt.textContent = v.label;
    select.appendChild(opt);
  });
  select.value = ENGINE;
  select.addEventListener("change", function () {
    location.href = location.pathname + (select.value ? "?engine=" + encodeURIComponent(select.value) : "");
  });
  picker.appendChild(select);
  document.querySelector(".sidebar").insertBefore(picker, document.getElementById("controls"));
})();

var LOC = { DECK: 1, HAND: 2, MZONE: 4, SZONE: 8, GRAVE: 16, REMOVED: 32, EXTRA: 64, OVERLAY: 128 };
var PHASES = { 1: "抽卡阶段", 2: "准备阶段", 4: "主要阶段 1", 8: "战斗阶段·开始", 16: "战斗阶段", 32: "伤害步骤", 64: "伤害计算", 128: "战斗阶段", 256: "主要阶段 2", 512: "结束阶段" };
var WIN_REASONS = { 0: "对方生命值归零", 1: "对方认输", 2: "规则胜利", 16: "效果胜利", 17: "对方无卡可抽" };

var data = null;
var cardNames = {};
var step = -1;
var playing = false;
var timer = null;
var state = null;
var logEntries = [];
var turnMarks = [];
var viewFlipped = false;
var soundOn = false;
var facedownTranslucent = false;
var showBothHands = true;
var zoomed = false;

function freshState() {
  var players = [];
  for (var i = 0; i < 2; i++) {
    players.push({ lp: 8000, mzone: [null, null, null, null, null], szone: [null, null, null, null, null, null], hand: [], deckCount: 0, extraCount: 0, graveCount: 0, removedCount: 0 });
  }
  return { players: players, turn: 0, turnPlayer: 0, phase: 0, winner: null, winType: null, recent: "" };
}
function cname(code) { if (!code) return "?"; return cardNames[String(code)] || ("#" + code); }
function padCode8(code) { var s = String(code || ""); return /^\d{1,8}$/.test(s) ? s.padStart(8, "0") : s; }
function isFacedown(pos) { return pos === 2 || pos === 8 || pos === 10; }
function posText(pos) { if (pos === 1) return "表侧攻击"; if (pos === 4) return "表侧守备"; if (pos === 2) return "里侧攻击"; if (pos === 8) return "里侧守备"; return ""; }

function removeFrom(player, location, sequence) {
  var p = state.players[player];
  if (!p) return null;
  if (location === LOC.MZONE) { var c = p.mzone[sequence]; p.mzone[sequence] = null; return c; }
  if (location === LOC.SZONE) { var c2 = p.szone[sequence]; p.szone[sequence] = null; return c2; }
  if (location === LOC.HAND) { if (sequence >= 0 && sequence < p.hand.length) { return p.hand.splice(sequence, 1)[0]; } return null; }
  if (location === LOC.DECK) { if (p.deckCount > 0) p.deckCount--; return null; }
  if (location === LOC.EXTRA) { if (p.extraCount > 0) p.extraCount--; return null; }
  if (location === LOC.GRAVE) { if (p.graveCount > 0) p.graveCount--; return null; }
  if (location === LOC.REMOVED) { if (p.removedCount > 0) p.removedCount--; return null; }
  return null;
}
function placeTo(player, location, sequence, code, position) {
  var p = state.players[player];
  if (!p) return;
  var card = { code: code, position: position };
  if (location === LOC.MZONE) { p.mzone[sequence] = card; }
  else if (location === LOC.SZONE) { p.szone[sequence] = card; }
  else if (location === LOC.HAND) { if (sequence >= 0 && sequence <= p.hand.length) { p.hand.splice(sequence, 0, card); } else { p.hand.push(card); } }
  else if (location === LOC.DECK) { p.deckCount++; }
  else if (location === LOC.EXTRA) { p.extraCount++; }
  else if (location === LOC.GRAVE) { p.graveCount++; }
  else if (location === LOC.REMOVED) { p.removedCount++; }
}
function removeFromHandByCode(player, code) {
  var hand = state.players[player].hand;
  for (var i = hand.length - 1; i >= 0; i--) { if (hand[i].code === code) { return hand.splice(i, 1)[0]; } }
  return null;
}
function addLog(text, code) { logEntries.push({ text: text, code: code || 0 }); state.recent = text; }

function applyMessage(m) {
  var p, card, i;
  switch (m.msgType) {
    case "YGOProMsgStart":
      state.players[0].lp = m.startLp0; state.players[1].lp = m.startLp1;
      state.players[0].deckCount = m.player0.deckCount; state.players[0].extraCount = m.player0.extraCount;
      state.players[1].deckCount = m.player1.deckCount; state.players[1].extraCount = m.player1.extraCount;
      addLog("决斗开始，双方生命值 " + m.startLp0);
      break;
    case "YGOProMsgHandRes":
      var rps = ["?", "石头", "剪刀", "布"];
      addLog("猜拳结果：" + rps[m.result & 3] + " 对 " + rps[(m.result >> 2) & 3]);
      break;
    case "YGOProMsgNewTurn":
      state.turn++; state.turnPlayer = m.player;
      addLog("—— 回合 " + state.turn + " · " + data.playerNames[m.player] + " ——");
      break;
    case "YGOProMsgNewPhase":
      state.phase = m.phase;
      addLog("进入" + (PHASES[m.phase] || ("阶段 " + m.phase)));
      break;
    case "YGOProMsgDraw":
      p = state.players[m.player];
      p.deckCount = Math.max(0, p.deckCount - m.count);
      for (i = 0; i < m.count; i++) { p.hand.push({ code: (m.cards && m.cards[i]) || 0, position: 0 }); }
      addLog(data.playerNames[m.player] + " 抽了 " + m.count + " 张卡");
      break;
    case "YGOProMsgShuffleHand":
      if (m.cards && m.cards.length) { state.players[m.player].hand = m.cards.map(function (c) { return { code: c, position: 0 }; }); }
      addLog(data.playerNames[m.player] + " 洗了手牌");
      break;
    case "YGOProMsgShuffleDeck": addLog(data.playerNames[m.player] + " 洗了卡组"); break;
    case "YGOProMsgShuffleSetCard":
    case "YGOProMsgShuffleExtra": break;
    case "YGOProMsgSummoning":
      removeFromHandByCode(m.controller, m.code);
      placeTo(m.controller, m.location, m.sequence, m.code, m.position);
      addLog(data.playerNames[m.controller] + " 召唤「" + cname(m.code) + "」", m.code);
      break;
    case "YGOProMsgSummoned": addLog("「" + cname(m.code) + "」召唤成功", m.code); break;
    case "YGOProMsgSpSummoning":
      removeFromHandByCode(m.controller, m.code);
      placeTo(m.controller, m.location, m.sequence, m.code, m.position);
      addLog(data.playerNames[m.controller] + " 特殊召唤「" + cname(m.code) + "」", m.code);
      break;
    case "YGOProMsgSpSummoned": addLog("「" + cname(m.code) + "」特殊召唤成功", m.code); break;
    case "YGOProMsgFlipSummoning":
      removeFrom(m.controller, m.location, m.sequence);
      placeTo(m.controller, m.location, m.sequence, m.code, m.position);
      addLog(data.playerNames[m.controller] + " 反转召唤「" + cname(m.code) + "」", m.code);
      break;
    case "YGOProMsgFlipSummoned": break;
    case "YGOProMsgSet":
      removeFromHandByCode(m.controller, m.code);
      placeTo(m.controller, m.location, m.sequence, m.code, m.position);
      addLog(data.playerNames[m.controller] + " 盖放了「" + cname(m.code) + "」", m.code);
      break;
    case "YGOProMsgPosChange":
      card = state.players[m.card.controller] && (m.card.location === LOC.MZONE ? state.players[m.card.controller].mzone[m.card.sequence] : state.players[m.card.controller].szone[m.card.sequence]);
      if (card) { card.position = m.currentPosition; }
      addLog("「" + cname(m.code) + "」变为" + posText(m.currentPosition), m.code);
      break;
    case "YGOProMsgMove":
      removeFrom(m.previous.controller, m.previous.location, m.previous.sequence);
      placeTo(m.current.controller, m.current.location, m.current.sequence, m.code, m.current.position);
      break;
    case "YGOProMsgSwap": {
      var a = m.card1, b = m.card2;
      var getSlot = function (loc) { return loc.location === LOC.MZONE ? state.players[loc.controller].mzone : state.players[loc.controller].szone; };
      var za = getSlot(a), zb = getSlot(b);
      var tmp = za[a.sequence]; za[a.sequence] = zb[b.sequence]; zb[b.sequence] = tmp;
      break;
    }
    case "YGOProMsgAttack":
      addLog((m.defender && (m.defender.location || m.defender.controller)) ? "「" + cname(cardCodeAt(m.attacker)) + "」攻击「" + cname(cardCodeAt(m.defender)) + "」" : "「" + cname(cardCodeAt(m.attacker)) + "」直接攻击！");
      break;
    case "YGOProMsgBattle":
      addLog("战斗结算：攻方 ATK " + m.attacker.atk + " / 守方 " + (m.defender.atk !== undefined ? "ATK " + m.defender.atk + " DEF " + m.defender.def : "直接攻击"));
      break;
    case "YGOProMsgDamage":
      state.players[m.player].lp -= m.value;
      addLog(data.playerNames[m.player] + " 受到 " + m.value + " 点伤害（LP " + state.players[m.player].lp + "）");
      break;
    case "YGOProMsgRecover":
      state.players[m.player].lp += m.value;
      addLog(data.playerNames[m.player] + " 回复 " + m.value + " 点生命值（LP " + state.players[m.player].lp + "）");
      break;
    case "YGOProMsgPayLpCost":
      state.players[m.player].lp -= m.cost;
      addLog(data.playerNames[m.player] + " 支付 " + m.cost + " 点生命值");
      break;
    case "YGOProMsgLpUpdate": state.players[m.player].lp = m.lp; break;
    case "YGOProMsgChaining": addLog("连锁 " + m.chainCount + "：「" + cname(m.code) + "」发动", m.code); break;
    case "YGOProMsgChainSolving": addLog("连锁 " + m.chainCount + " 处理中"); break;
    case "YGOProMsgChainSolved": addLog("连锁处理完毕"); break;
    case "YGOProMsgEquip": addLog("「" + cname(cardCodeAt(m.equip)) + "」装备给「" + cname(cardCodeAt(m.target)) + "」"); break;
    case "YGOProMsgTossCoin": addLog(data.playerNames[m.player] + " 掷硬币：" + m.results.map(function (r) { return r ? "正面" : "反面"; }).join("、")); break;
    case "YGOProMsgTossDice": addLog(data.playerNames[m.player] + " 掷骰子：" + m.results.join("、")); break;
    case "YGOProMsgConfirmCards":
      if (m.cards && m.cards.length) { addLog("确认了 " + m.cards.map(function (c) { return "「" + cname(c.code) + "」"; }).join("、")); }
      break;
    case "YGOProMsgDeckTop": addLog("确认卡组顶端：「" + cname(m.code) + "」", m.code); break;
    case "YGOProMsgMissedEffect": addLog("「" + cname(m.code) + "」错过了发动时机", m.code); break;
    case "YGOProMsgBecomeTarget": addLog("「" + cname(cardCodeAt(m.targets && m.targets[0])) + "」成为效果对象"); break;
    case "YGOProMsgUpdateData": applyUpdateData(m); break;
    case "YGOProMsgUpdateCard": applyUpdateCard(m); break;
    case "YGOProMsgReloadField": applyReloadField(m); break;
    case "YGOProMsgWin":
      state.winner = m.player; state.winType = m.type;
      addLog("★ " + data.playerNames[m.player] + " 获胜（" + (WIN_REASONS[m.type] || "原因码 " + m.type) + "）");
      break;
    case "YGOProMsgWaiting":
    case "YGOProMsgHint":
    case "YGOProMsgPlayerHint":
    case "YGOProMsgCardHint":
    case "YGOProMsgDamageStepStart":
    case "YGOProMsgDamageStepEnd":
    default: break;
  }
}
function cardCodeAt(loc) {
  if (!loc) return 0;
  var p = state.players[loc.controller];
  if (!p) return 0;
  var card = null;
  if (loc.location === LOC.MZONE) card = p.mzone[loc.sequence];
  else if (loc.location === LOC.SZONE) card = p.szone[loc.sequence];
  else if (loc.location === LOC.HAND) card = p.hand[loc.sequence];
  return card ? card.code : 0;
}
function applyUpdateData(m) {
  var p = state.players[m.player];
  if (!p || !m.cards) return;
  if (m.location !== LOC.MZONE && m.location !== LOC.SZONE) return;
  var zone = m.location === LOC.MZONE ? p.mzone : p.szone;
  m.cards.forEach(function (q, idx) {
    if (idx >= zone.length) return;
    if (q.empty) { zone[idx] = null; return; }
    var existing = zone[idx];
    var code = q.code !== undefined ? q.code : (existing ? existing.code : 0);
    var position = q.position !== undefined ? q.position : (existing ? existing.position : 0);
    zone[idx] = { code: code, position: position, attack: q.attack, defense: q.defense };
  });
}
function applyUpdateCard(m) {
  var p = state.players[m.controller];
  if (!p || !m.card) return;
  var zone = m.location === LOC.MZONE ? p.mzone : (m.location === LOC.SZONE ? p.szone : null);
  if (!zone || m.sequence >= zone.length) return;
  var existing = zone[m.sequence];
  var q = m.card;
  zone[m.sequence] = {
    code: q.code !== undefined ? q.code : (existing ? existing.code : 0),
    position: q.position !== undefined ? q.position : (existing ? existing.position : 0),
    attack: q.attack !== undefined ? q.attack : (existing ? existing.attack : undefined),
    defense: q.defense !== undefined ? q.defense : (existing ? existing.defense : undefined),
  };
}
function applyReloadField(m) {
  if (!m.players || m.players.length < 2) return;
  for (var i = 0; i < 2; i++) {
    var info = m.players[i];
    var p = state.players[i];
    p.lp = info.lp;
    p.deckCount = info.deckCount; p.extraCount = info.extraCount;
    p.graveCount = info.graveCount; p.removedCount = info.removedCount;
    p.mzone = (info.mzone || []).slice(0, 5).map(function (z) { return z && z.occupied ? { code: 0, position: z.position || 0 } : null; });
    while (p.mzone.length < 5) p.mzone.push(null);
    p.szone = (info.szone || []).slice(0, 6).map(function (z) { return z && z.occupied ? { code: 0, position: z.position || 0 } : null; });
    while (p.szone.length < 6) p.szone.push(null);
    p.hand = [];
    for (var h = 0; h < info.handCount; h++) p.hand.push({ code: 0, position: 0 });
  }
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]; });
}
function imgFallback(img) {
  img.style.display = "none";
  var sibling = img.nextElementSibling;
  if (sibling) sibling.style.display = "flex";
}
function thumbFallback(img) { img.style.display = "none"; }
function cardUrl(code) {
  return "/api/cards/" + encodeURIComponent(FORMAT) + "/" + encodeURIComponent(code || 0) + "/image?v=" + encodeURIComponent(CARD_IMG_VERSION);
}

/* One in-flight/cache entry per card code. The HTTP response is immutable and
   long-cached too, so this map mainly avoids re-parsing JSON during seek. */
var cardCache = {};
function loadCard(code) {
  var key = String(code || 0);
  if (!cardCache[key]) {
    cardCache[key] = fetch(cardUrl(key))
      .then(function (res) { return res.status === 404 ? null : res.json().then(function (b) { return b && b.success ? b.data : null; }); })
      .catch(function () { return null; });
  }
  return cardCache[key];
}
/* Map a card's type text to one of the six frame colours. */
function cardTypeClass(typeText) {
  var t = String(typeText || "");
  if (t.indexOf("魔法") >= 0) return "ct-spell";
  if (t.indexOf("陷阱") >= 0) return "ct-trap";
  if (t.indexOf("怪兽") >= 0) {
    if (t.indexOf("仪式") >= 0) return "ct-ritual";
    if (t.indexOf("融合") >= 0) return "ct-fusion";
    if (t.indexOf("效果") >= 0 || t.indexOf("同调") >= 0 || t.indexOf("超量") >= 0 || t.indexOf("连接") >= 0) return "ct-effect";
    return "ct-normal";
  }
  return "";
}
/* Fill every placeholder img from the cache once its card data resolves. */
function hydrateCardImages() {
  var nodes = document.querySelectorAll("img[data-card-code]");
  for (var i = 0; i < nodes.length; i++) {
    (function (img) {
      var code = img.getAttribute("data-card-code");
      var kind = img.getAttribute("data-card-kind");
      img.setAttribute("data-hydrated", code);
      loadCard(code).then(function (info) {
        if (!img.isConnected) return;
        if (info && info.card && kind === "card") {
          var card = info.card;
          var wrapper = img.parentElement;
          var tc = cardTypeClass(card.typeText);
          if (wrapper && tc) { wrapper.classList.add(tc); }
          // Prefer the authoritative card name for the visible label.
          var label = wrapper && wrapper.querySelector(".card-name-label");
          if (label && card.name) label.textContent = card.name;
        }
        if (info && info.image) {
          img.src = info.image;
        } else if (kind === "thumb") {
          thumbFallback(img);
        } else {
          imgFallback(img);
        }
      });
    })(nodes[i]);
  }
}
/* ---------- 卡牌详情弹窗 ---------- */
function escapeAttr(s) { return escapeHtml(s); }
function renderCardDetail(code, info) {
  var card = (info && info.card) || {};
  var name = card.name || cname(code);
  var image = info && info.image;
  var imgHtml = image
    ? '<img class="cm-img" src="' + image + '" alt="' + escapeAttr(name) + '">'
    : '<div class="cm-img-ph">' + escapeHtml(name) + '<br>（暂无卡图）</div>';
  var tags = "";
  if (card.typeText) tags += '<span class="cm-tag">' + escapeHtml(card.typeText) + '</span>';
  if (card.level) tags += '<span class="cm-tag">★ ' + card.level + '</span>';
  if (card.attributeText) tags += '<span class="cm-tag">' + escapeHtml(card.attributeText) + '</span>';
  if (card.raceText) tags += '<span class="cm-tag">' + escapeHtml(card.raceText) + '</span>';
  if (card.attack !== undefined) tags += '<span class="cm-tag stat">ATK ' + card.attack + ' / DEF ' + (card.defense !== undefined ? card.defense : "?") + '</span>';
  var alt = [card.nameJa, card.nameEn].filter(Boolean).map(escapeHtml).join(" · ");
  var rows = [
    ["卡片密码", padCode8(card.code || code)],
    ["使用限制", card.limitation],
    ["罕见度", card.rarity],
    ["卡包", card.packs],
  ].filter(function (r) { return !!r[1]; })
    .map(function (r) { return '<div class="k">' + r[0] + '</div><div class="v">' + escapeHtml(r[1]) + '</div>'; }).join("");
  var sections = "";
  function addSection(title, value) {
    if (!value) return;
    sections += '<div class="cm-sec"><h4>' + title + '</h4><div class="txt">' + escapeHtml(value) + '</div></div>';
  }
  addSection("效果", card.desc);
  addSection("FAQ / 调整", [card.faq, card.ruling, card.qas].filter(Boolean).join("\\n\\n"));
  addSection("介绍", card.intro);
  if (card.errata) addSection("卡片勘误", card.errata);
  document.getElementById("cm-content").innerHTML =
    '<div class="cm-head">' + imgHtml +
    '<div class="cm-info">' +
      '<div class="cm-name">' + escapeHtml(name) + '</div>' +
      (alt ? '<div class="cm-alt">' + alt + '</div>' : "") +
      (tags ? '<div class="cm-tags">' + tags + '</div>' : "") +
      (rows ? '<div class="cm-grid">' + rows + '</div>' : "") +
    '</div></div>' + sections;
}
function openCardDetail(code) {
  code = Number(code) || 0;
  if (!code) return;
  var modal = document.getElementById("card-modal");
  modal.classList.add("open");
  document.getElementById("cm-content").innerHTML = '<div class="cm-loading">正在加载卡牌信息…</div>';
  loadCard(code).then(function (info) {
    if (!modal.classList.contains("open")) return;
    renderCardDetail(code, info);
  });
}
function closeCardDetail() { document.getElementById("card-modal").classList.remove("open"); }
document.getElementById("cm-close").onclick = closeCardDetail;
document.getElementById("card-modal").onclick = function (e) { if (e.target === this) closeCardDetail(); };
document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCardDetail(); });
/* Click a field card, hand card or log thumbnail to view its details. */
document.getElementById("board").addEventListener("click", function (e) {
  var target = e.target.closest ? e.target.closest("[data-card-code]") : null;
  if (target && target.getAttribute("data-card-kind") === "card") { openCardDetail(target.getAttribute("data-card-code")); }
});
function cardHtml(card, hideName) {
  if (!card) return "";
  var cls = "card";
  var facedown = isFacedown(card.position) || hideName;
  if (facedown) {
    cls += " facedown";
    if (facedownTranslucent) cls += " translucent";
    return '<div class="' + cls + '"><div class="card-back"></div></div>';
  }
  if (card.position === 1) cls += " atk-pos";
  else if (card.position === 4) cls += " def-pos";
  var code = card.code || 0;
  var stat = (card.attack !== undefined) ? '<div class="stat">' + card.attack + "/" + (card.defense !== undefined ? card.defense : "?") + "</div>" : "";
  return '<div class="' + cls + '" data-card-code="' + code + '" data-card-kind="card">' +
    '<img class="card-img" data-card-code="' + code + '" data-card-kind="card" alt="" onerror="imgFallback(this)">' +
    '<div class="card-name-fallback">' + escapeHtml(cname(code)) + '</div>' + stat +
    '<div class="card-name-label">' + escapeHtml(cname(code)) + '</div></div>';
}
function renderZone(player, loc, seqOrder, badgeValue, badgeAtStart) {
  var p = state.players[player];
  var zone = loc === LOC.MZONE ? p.mzone : p.szone;
  var cells = "";
  seqOrder.forEach(function (seq) {
    var card = zone[seq];
    var num = '<span class="num">' + (seq + 1) + '</span>';
    cells += '<div class="slot">' + num + (card ? cardHtml(card, false) : '') + '</div>';
  });
  var badge = '<div class="zone-badge">' + badgeValue + '</div>';
  var spacer = '<div></div>';
  return badgeAtStart ? badge + cells + spacer : spacer + cells + badge;
}
function renderHand(player) {
  var p = state.players[player];
  var hide = !showBothHands && player !== 0;
  var html = "";
  p.hand.forEach(function (c) { html += cardHtml(c, hide); });
  return html;
}
function setBadge(id, value) { var el = document.getElementById(id); if (el) el.querySelector(".pile-badge").textContent = value; }

function renderPlayerInfos() {
  var top = viewFlipped ? 0 : 1;
  var bottom = viewFlipped ? 1 : 0;
  var wrap = document.getElementById("player-infos");
  wrap.innerHTML = [top, bottom].map(function (i) {
    var p = state.players[i];
    var isTurn = state.turnPlayer === i;
    return '<div class="pinfo' + (isTurn ? " turn" : "") + '">' +
      '<div class="nm">' + escapeHtml(data.playerNames[i]) + '</div>' +
      '<div class="lp">' + p.lp + '</div>' +
      '<div class="hc">手牌 ' + p.hand.length + '</div></div>';
  }).join("");
}
function renderMeta() {
  var lines = [];
  if (data.startedAt) {
    var when = new Date(data.startedAt);
    lines.push(when.toLocaleString("zh-CN", { hour12: false }) + " " + escapeHtml(data.playerNames[0]) + " VS " + escapeHtml(data.playerNames[1]));
  }
  if (data.engineVersion) { lines.push("规则引擎 " + escapeHtml(data.engineVersion.label)); }
  var ph = PHASES[state.phase] || ("阶段 " + state.phase);
  lines.push('回合 <span class="hl">' + state.turn + '</span>，' + escapeHtml(ph) + '，' + escapeHtml(data.playerNames[state.turnPlayer]) + '，步骤 <span class="hl">' + (step + 1) + '</span> / ' + data.messages.length + '：');
  if (state.recent) { lines.push('<span class="act">' + escapeHtml(state.recent) + '</span>'); }
  if (data.truncated) { lines.push('<span class="act">录像到此中断</span>'); }
  document.getElementById("duel-meta").innerHTML = lines.join("<br>");
}
function activePhaseLabel() {
  switch (state.phase) {
    case 1: return "D";
    case 2: return "P";
    case 4: return "MP1";
    case 8: case 16: case 32: case 64: case 128: return "BP";
    case 256: return "MP2";
    case 512: return "EP";
    default: return "";
  }
}
function renderHalf(player, isTop) {
  var p = state.players[player];
  var mzId = isTop ? "mzone-1" : "mzone-0";
  var szId = isTop ? "szone-1" : "szone-0";
  var mseq = isTop ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
  var sseq = isTop ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
  document.getElementById(mzId).innerHTML = renderZone(player, LOC.MZONE, mseq, p.graveCount, isTop);
  document.getElementById(szId).innerHTML = renderZone(player, LOC.SZONE, sseq, p.removedCount, isTop);
  if (isTop) {
    document.getElementById("hand-1").innerHTML = renderHand(player);
    setBadge("deck-1", p.deckCount);
    setBadge("extra-1", p.extraCount);
  } else {
    document.getElementById("hand-0").innerHTML = renderHand(player);
    setBadge("deck-0", p.deckCount);
    setBadge("extra-0", p.extraCount);
  }
}
function render() {
  var top = viewFlipped ? 0 : 1;
  var bottom = viewFlipped ? 1 : 0;
  renderPlayerInfos();
  renderMeta();
  renderHalf(top, true);
  renderHalf(bottom, false);
  var active = activePhaseLabel();
  var phaseEls = document.querySelectorAll("[data-phase-label]");
  for (var j = 0; j < phaseEls.length; j++) {
    phaseEls[j].className = "phase" + (phaseEls[j].getAttribute("data-phase-label") === active ? " active" : "");
  }
  var banner = document.getElementById("winbanner");
  if (state.winner !== null && state.winner !== undefined) {
    banner.style.display = "block";
    banner.textContent = "★ " + data.playerNames[state.winner] + " 获胜（" + (WIN_REASONS[state.winType] || "") + "）";
  } else { banner.style.display = "none"; }
  document.getElementById("jump-input").value = String(Math.max(1, turnMarks.length ? activeTurnIndex() + 1 : 1));
  document.getElementById("jump-total").textContent = "/ " + Math.max(1, turnMarks.length);
  var items = document.getElementById("loglist").children;
  for (var k = 0; k < items.length; k++) { items[k].className = "logitem" + (k === currentLogIndex() ? " current" : ""); }
  var cur = currentLogIndex();
  if (cur >= 0 && items[cur]) { items[cur].scrollIntoView({ block: "nearest" }); }
  hydrateCardImages();
}
function activeTurnIndex() {
  var idx = -1;
  for (var t = 0; t < turnMarks.length; t++) { if (turnMarks[t].step <= step) idx = t; }
  return idx;
}
function currentLogIndex() {
  var li = -1;
  for (var i = 0; i <= step && i < logIndexByStep.length; i++) { if (logIndexByStep[i] >= 0) li = logIndexByStep[i]; }
  return li;
}
var logIndexByStep = [];
function precompute() {
  var savedState = freshState();
  var realState = state;
  state = savedState;
  logEntries = [];
  logIndexByStep = [];
  turnMarks = [];
  var loglist = document.getElementById("loglist");
  loglist.innerHTML = "";
  var li = 0;
  for (var i = 0; i < data.messages.length; i++) {
    var m = data.messages[i];
    if (m.msgType === "YGOProMsgNewTurn") { turnMarks.push({ turn: state.turn + 1, step: i, player: m.player }); }
    var before = logEntries.length;
    applyMessage(m);
    if (logEntries.length > before) {
      logIndexByStep.push(li);
      for (var k = before; k < logEntries.length; k++) {
        var entry = logEntries[k];
        var div = document.createElement("div");
        div.className = "logitem";
        var thumb = entry.code ? '<img class="thumb" data-card-code="' + entry.code + '" data-card-kind="thumb" alt="" onerror="thumbFallback(this)">' : '<span class="thumb-ph"></span>';
        div.innerHTML = thumb + '<span class="txt"><span class="idx">' + (li + 1) + '</span>' + escapeHtml(entry.text) + '</span>';
        (function (stepIdx) {
          div.onclick = function (e) {
            var thumb = e.target && e.target.closest ? e.target.closest("img.thumb[data-card-code]") : null;
            if (thumb) { openCardDetail(thumb.getAttribute("data-card-code")); return; }
            pause(); seekTo(stepIdx);
          };
        })(i);
        loglist.appendChild(div);
        li++;
      }
    } else { logIndexByStep.push(-1); }
  }
  if (logEntries.length === 0) {
    var empty = document.createElement("div");
    empty.className = "log-empty";
    empty.textContent = "暂无操作记录";
    loglist.appendChild(empty);
  }
  state = realState;
  hydrateCardImages();
}
function beep() {
  if (!soundOn) return;
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!beep.ctx) beep.ctx = new Ctx();
    var ctx = beep.ctx;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.frequency.value = 520; gain.gain.value = 0.03;
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.04);
  } catch (e) { /* best-effort */ }
}
function seekTo(target) {
  state = freshState();
  logEntries = [];
  for (var i = 0; i <= target && i < data.messages.length; i++) { applyMessage(data.messages[i]); }
  step = Math.min(target, data.messages.length - 1);
  render();
}
function nextStep() {
  if (step + 1 >= data.messages.length) { pause(); return; }
  step++;
  applyMessage(data.messages[step]);
  beep();
  render();
}
function pause() {
  playing = false;
  if (timer) { clearInterval(timer); timer = null; }
  document.getElementById("btn-play").textContent = "▶ 继续播放";
}
function play() {
  playing = true;
  document.getElementById("btn-play").textContent = "⏸ 暂停";
  var interval = parseInt(document.getElementById("speed").value, 10);
  timer = setInterval(function () { if (playing) nextStep(); }, interval);
}
document.getElementById("btn-play").onclick = function () { playing ? pause() : play(); };
document.getElementById("btn-step").onclick = function () { pause(); nextStep(); };
document.getElementById("btn-restart").onclick = function () { pause(); seekTo(-1); };
document.getElementById("speed").onchange = function () { if (playing) { pause(); play(); } };
document.getElementById("btn-toggle-view").onclick = function () { viewFlipped = !viewFlipped; render(); };
document.getElementById("btn-toggle-sound").onclick = function () {
  soundOn = !soundOn;
  this.textContent = soundOn ? "♪ 音效:开" : "♪ 音效:关";
  this.className = soundOn ? "on" : "";
};
document.getElementById("btn-toggle-facedown").onclick = function () {
  facedownTranslucent = !facedownTranslucent;
  this.className = facedownTranslucent ? "on" : "";
  render();
};
document.getElementById("btn-toggle-hands").onclick = function () {
  showBothHands = !showBothHands;
  this.textContent = showBothHands ? "☑ 显示双方手牌" : "☐ 隐藏对方手牌";
  this.className = showBothHands ? "" : "on";
  render();
};
document.getElementById("btn-zoom").onclick = function () {
  zoomed = !zoomed;
  this.textContent = zoomed ? "⊕ 还原场地" : "⊕ 放大场地";
  this.className = zoomed ? "on" : "";
  document.getElementById("board").className = "board" + (zoomed ? " zoomed" : "");
};
document.getElementById("btn-more").onclick = function () {
  var detail = "赛制 " + FORMAT + " · 录像 ID " + REPLAY_ID + " · 共 " + data.messages.length + " 步";
  if (data.engineVersion) detail += " · 引擎 " + data.engineVersion.label;
  if (data.truncated) detail += " · 录像已中断";
  alert(detail);
};
document.getElementById("btn-jump").onclick = function () {
  var turnNo = parseInt(document.getElementById("jump-input").value, 10);
  if (!turnNo || turnNo < 1) return;
  var idx = turnNo - 1;
  if (idx >= turnMarks.length) idx = turnMarks.length - 1;
  if (idx < 0) return;
  pause();
  seekTo(turnMarks[idx].step);
};

fetch(API_URL)
  .then(function (res) { return res.json().then(function (body) { return { status: res.status, body: body }; }); })
  .then(function (r) {
    if (!r.body.success) { throw new Error(r.body.error || ("HTTP " + r.status)); }
    data = r.body.data;
    cardNames = data.cardNames || {};
    document.title = data.playerNames[0] + " VS " + data.playerNames[1] + " · 播放";
    state = freshState();
    precompute();
    seekTo(-1);
    document.getElementById("loading").style.display = "none";
    document.getElementById("half-0").style.display = "block";
    document.getElementById("half-1").style.display = "block";
    document.getElementById("divider").style.display = "block";
    document.getElementById("controls").style.display = "grid";
  })
  .catch(function (err) {
    document.getElementById("loading").className = "errbox";
    document.getElementById("loading").textContent = "加载失败：" + err.message;
  });
</script>
</body>
</html>
`;

export function renderReplayPlayPage(format: string, replayId: string, engineVersions: unknown[], cardImageVersion = "1"): string {
	return PAGE_HTML.replaceAll("__FORMAT__", format)
		.replaceAll("__REPLAY_ID__", replayId)
		.replaceAll("__CARD_IMG_VERSION__", cardImageVersion)
		.replaceAll("__ENGINE_VERSIONS__", JSON.stringify(engineVersions));
}

export class ReplayPlayPageController {
	run(req: Request, res: Response): void {
		if (!config.ranking.enabled) {
			res.status(503).send("录像回放当前不可用（排位系统未启用）。");
			return;
		}
		const formatParam = req.params.format;
		const format = Array.isArray(formatParam) ? formatParam[0] : (formatParam ?? "");
		const replayIdParam = req.params.replayId;
		const replayId = Array.isArray(replayIdParam) ? replayIdParam[0] : (replayIdParam ?? "");

		if (!/^[0-9A-Za-z_-]+$/.test(format) || !/^[0-9A-Za-z_-]+$/.test(replayId)) {
			res.status(400).send("无效的录像地址。");
			return;
		}

		res.setHeader("Content-Type", "text/html; charset=utf-8");
		res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
		res.send(renderReplayPlayPage(format, replayId, listGoatEngineVersions(), process.env.CARD_IMAGE_VERSION ?? "1"));
	}
}
