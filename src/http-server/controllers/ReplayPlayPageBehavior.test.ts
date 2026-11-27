import { renderReplayPlayPage } from "./ReplayPlayPageController";

describe("ReplayPlayPageBehavior", () => {
	const html = renderReplayPlayPage("goat", "rep-1", []);

	it("renders YGOPro-style phase bar with all seven phases", () => {
		for (const phase of ["D", "P", "SP", "MP1", "BP", "MP2", "EP"]) {
			expect(html).toContain(`data-phase-label="${phase}"`);
		}
		expect(html).toContain('id="phase-bar"');
	});

	it("renders full control bar with view, sound, facedown, hand and zoom controls", () => {
		for (const id of [
			"btn-play",
			"btn-step",
			"btn-restart",
			"btn-toggle-view",
			"btn-toggle-sound",
			"btn-toggle-facedown",
			"btn-toggle-hands",
			"btn-zoom",
			"btn-more",
			"btn-exit",
		]) {
			expect(html).toContain(`id="${id}"`);
		}
	});

	it("renders the left control panel with player info and jump-to-turn input", () => {
		expect(html).toContain('id="player-infos"');
		expect(html).toContain('id="duel-meta"');
		expect(html).toContain('id="jump-input"');
		expect(html).toContain("跳到回合");
		expect(html).toContain("操作记录");
	});

	it("renders the YGOPro board with two halves, hand rows and monster/spell zones", () => {
		for (const id of [
			"half-1", "half-0",
			"hand-1", "hand-0",
			"mzone-1", "mzone-0",
			"szone-1", "szone-0",
			"deck-1", "deck-0",
			"extra-1", "extra-0",
		]) {
			expect(html).toContain(`id="${id}"`);
		}
		expect(html).toContain("card-back");
		expect(html).toContain("pile-badge");
	});

	it("sizes field card frames at 95x110 with a 90x90 image and a name label", () => {
		expect(html).toContain(".slot { position: relative; width: 95px; height: 110px;");
		expect(html).toContain(".hand-row .card { width: 95px; height: 110px;");
		expect(html).toContain(".pile { position: relative; width: 95px; height: 110px;");
		expect(html).toContain(".card .card-img { width: 90px; height: 90px;");
		expect(html).toContain(".card .card-name-label");
		expect(html).toContain('class="card-name-label"');
	});

	it("colours the card frame by one of six card types", () => {
		for (const cls of ["ct-normal", "ct-effect", "ct-ritual", "ct-fusion", "ct-spell", "ct-trap"]) {
			expect(html).toContain(`.card.${cls}`);
		}
		expect(html).toContain("function cardTypeClass(typeText)");
		expect(html).toContain('t.indexOf("魔法")');
		expect(html).toContain('t.indexOf("陷阱")');
		expect(html).toContain('t.indexOf("仪式")');
		expect(html).toContain('t.indexOf("融合")');
		expect(html).toContain("wrapper.classList.add(tc)");
	});

	it("renders card image placeholders hydrated from the JSON image endpoint", () => {
		expect(html).toContain("/api/cards/");
		expect(html).toContain('data-card-code=');
		expect(html).toContain('data-card-kind="card"');
		expect(html).toContain('data-card-kind="thumb"');
		expect(html).toContain("hydrateCardImages");
		expect(html).toContain("function padCode8(code)");
		expect(html).toContain('padCode8(card.code || code)');
		expect(html).toContain("res.json()");
		expect(html).toContain("info.image");
		expect(html).toContain("cname");
	});

	it("renders a card detail modal that opens on card or thumbnail click", () => {
		expect(html).toContain('id="card-modal"');
		expect(html).toContain('id="cm-close"');
		expect(html).toContain("openCardDetail");
		expect(html).toContain("renderCardDetail");
		expect(html).toContain("closeCardDetail");
		expect(html).toContain('classList.add("open")');
		// rich card fields surfaced in the modal
		for (const field of ["cm-name", "cm-alt", "cm-tags", "cm-grid", "效果", "FAQ / 调整"]) {
			expect(html).toContain(field);
		}
		for (const field of ["card.typeText", "card.limitation", "card.rarity", "card.packs", "card.faq", "card.nameJa", "card.nameEn"]) {
			expect(html).toContain(field);
		}
		// click handlers wired from board and log thumbnails
		expect(html).toContain('getElementById("board").addEventListener("click"');
		expect(html).toContain('data-card-kind") === "card"');
		expect(html).toContain('img.thumb[data-card-code]');
		// close on backdrop and Escape
		expect(html).toContain('e.key !== "Escape"');
	});

	it("labels all zones and swaps the lower-half grave/removed badges", () => {
		// pile labels
		for (const id of ["deck-1", "extra-1", "deck-0", "extra-0"]) {
			expect(html).toContain(`id="${id}-label"`);
		}
		expect(html).toContain('卡组(0)');
		expect(html).toContain('额外区(0)');
		// side zone labels rendered dynamically
		expect(html).toContain('class="zone-label side ');
		expect(html).toContain('escapeHtml(zoneLabel)');
		// lower half swap: monster row -> removed, spell row -> grave
		expect(html).toContain('isTop ? p.graveCount : p.removedCount');
		expect(html).toContain('isTop ? "grave" : "removed"');
		expect(html).toContain('isTop ? "墓地" : "除外区"');
		expect(html).toContain('isTop ? p.removedCount : p.graveCount');
		expect(html).toContain('isTop ? "removed" : "grave"');
		expect(html).toContain('isTop ? "除外区" : "墓地"');
	});

	it("renders two middle field-spell slots", () => {
		expect(html).toContain('id="field-row"');
		expect(html).toContain('id="field-1"');
		expect(html).toContain('id="field-0"');
		expect(html).toContain('data-field-player="1"');
		expect(html).toContain('data-field-player="0"');
		expect(html).toContain("场地一");
		expect(html).toContain("场地二");
		expect(html).toContain("function renderFields()");
		expect(html).toContain("FIELD: 256");
		expect(html).toContain("field: null");
	});

	it("orders both opponent zones from 1 to 5", () => {
		expect(html).toContain("var mseq = [0, 1, 2, 3, 4];");
		expect(html).toContain("var sseq = [0, 1, 2, 3, 4];");
		expect(html).not.toContain("isTop ? [4, 3, 2, 1, 0]");
	});

	it("renders the opponent spell/trap row above the monster row", () => {
		const half1 = html.slice(html.indexOf('id="half-1"'), html.indexOf('id="half-0"'));
		const szone = half1.indexOf('id="szone-1"');
		const mzone = half1.indexOf('id="mzone-1"');
		expect(szone).toBeGreaterThan(-1);
		expect(mzone).toBeGreaterThan(szone);
		// lower (own) half keeps monster row above spell/trap row
		const half0 = html.slice(html.indexOf('id="half-0"'), html.indexOf('id="winbanner"'));
		expect(half0.indexOf('id="mzone-0"')).toBeLessThan(half0.indexOf('id="szone-0"'));
	});

	it("shows set cards by name instead of the card-back image", () => {
		// face-down field cards render a name plate, clickable for detail
		expect(html).toContain('class="face-name"');
		expect(html).toContain(".card.facedown .face-name");
		expect(html).toContain("盖放卡：点击查看详情");
		// hidden hand cards keep the card back
		expect(html).toContain('return \'<div class="\' + cls + \'"><div class="card-back"></div></div>\';');
	});

	it("makes deck, extra, grave and removed zones clickable with a list popup", () => {
		expect(html).toContain('id="zone-modal"');
		expect(html).toContain('id="zm-close"');
		expect(html).toContain("function openZoneList(zone, player)");
		expect(html).toContain('var ZONE_TITLES = { deck: "主卡组", extra: "额外卡组", grave: "墓地", removed: "除外区" }');
		for (const zone of ["deck", "extra"]) {
			expect(html).toContain(`data-zone="${zone}"`);
		}
		// grave/removed badges are rendered dynamically by renderZone
		expect(html).toContain('data-zone="');
		expect(html).toContain('badgeZone');
		expect(html).toContain('p.graveCount : p.removedCount');
		expect(html).toContain('p.removedCount : p.graveCount');
		// per-player card code arrays are tracked in state
		expect(html).toContain("deck: [], extra: [], grave: [], removed: [], field: null");
		expect(html).toContain("function zoneArray(player, location)");
	});

	it("pauses playback while a popup is open and resumes after closing", () => {
		expect(html).toContain("var resumeAfterPopup = false;");
		expect(html).toContain("resumeAfterPopup = playing;");
		expect(html).toContain("function pauseForPopup()");
		expect(html).toContain("function resumeIfPaused()");
		expect(html).toContain("pauseForPopup();");
		expect(html).toContain("resumeIfPaused();");
		expect(html).toContain('".card-modal.open, .zone-modal.open"');
	});

	it("supports mobile landscape with a rotate hint and compact field", () => {
		expect(html).toContain('id="rotate-hint"');
		expect(html).toContain("请横屏观看录像");
		expect(html).toContain("@media (orientation: portrait) and (max-width: 820px)");
		expect(html).toContain(".board.compact");
		expect(html).toContain(".app.compact .sidebar");
		expect(html).toContain("function applyMobileLayout()");
		expect(html).toContain('addEventListener("orientationchange", applyMobileLayout)');
		expect(html).toContain('board.style.setProperty("--cw"');
		expect(html).toContain("max-height: 520px");
	});

	it("appends the configurable card image version to image URLs for cache busting", () => {
		const versioned = renderReplayPlayPage("goat", "rep-1", [], "v7");
		expect(versioned).toContain('var CARD_IMG_VERSION = "v7";');
		expect(versioned).toContain('"/image?v=" + encodeURIComponent(CARD_IMG_VERSION)');
	});

	it("keeps message-driven playback state and engine version selection", () => {
		expect(html).toContain('var FORMAT = "goat";');
		expect(html).toContain('var REPLAY_ID = "rep-1";');
		expect(html).toContain("applyMessage");
		expect(html).toContain("engine-select");
	});
});
