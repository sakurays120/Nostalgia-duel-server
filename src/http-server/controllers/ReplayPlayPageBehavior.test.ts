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

	it("renders card image slots that fall back to card name when image is absent", () => {
		expect(html).toContain("/api/cards/");
		expect(html).toContain("onerror=\"imgFallback(this)\"");
		expect(html).toContain("cname");
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
