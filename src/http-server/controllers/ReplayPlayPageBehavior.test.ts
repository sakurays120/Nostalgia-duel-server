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
		expect(html).toContain('e.key === "Escape"');
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
