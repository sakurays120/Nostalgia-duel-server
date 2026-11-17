import { HistoricalRulingsDriver } from "@test-support/wasm/HistoricalRulingsDriver";
import {
	IdleCmdType,
	OcgcoreScriptConstants as C,
	YGOProMsgChainDisabled,
	YGOProMsgChainEnd,
	YGOProMsgChaining,
	YGOProMsgNewPhase,
	YGOProMsgPayLpCost,
	YGOProMsgSelectEffectYn,
} from "ygopro-msg-encode";

const SKULL_LAIR = 6733059;
const ROYAL_OPPRESSION = 93016201;
const MONSTER_REBORN = 83764718;
const SKULL_SERVANT = 32274490;

describe("GOAT continuous trap activation", () => {
	it("uses Skull Lair's destruction effect only after its activation resolves", async () => {
		const driver = await HistoricalRulingsDriver.create("goat");
		const duel = driver.createDuel();
		try {
			duel.place(0, { szone: [{ code: SKULL_LAIR }], grave: [SKULL_SERVANT] });
			duel.place(1, { mzone: [{ code: SKULL_SERVANT }] });
			duel.idleAction = (msg) => {
				const lair = msg.activatableCards.find((entry) => entry.code === SKULL_LAIR);
				return lair
					? msg.prepareResponse(IdleCmdType.ACTIVATE, lair)
					: msg.prepareResponse(IdleCmdType.TO_EP);
			};
			duel.start(1, "goat");
			const flip = duel.runUntil((msg) => msg instanceof YGOProMsgChainEnd);
			expect(flip.some((msg) => msg instanceof YGOProMsgChaining && msg.code === SKULL_LAIR)).toBe(
				true,
			);
			expect(flip.some((msg) => msg instanceof YGOProMsgSelectEffectYn)).toBe(false);
			expect(duel.queryFieldCount(0, C.LOCATION_GRAVE)).toBe(1);
			expect(duel.queryFieldCount(1, C.LOCATION_MZONE)).toBe(1);

			const effect = duel.runUntil((msg) => msg instanceof YGOProMsgChainEnd);
			expect(
				effect.some((msg) => msg instanceof YGOProMsgChaining && msg.code === SKULL_LAIR),
			).toBe(true);
			expect(duel.queryFieldCount(0, C.LOCATION_REMOVED)).toBe(1);
			expect(duel.queryFieldCount(1, C.LOCATION_MZONE)).toBe(0);
		} finally {
			duel.endDuel();
			driver.finalize();
		}
	});

	it("uses Royal Oppression's negation only after its activation resolves", async () => {
		const driver = await HistoricalRulingsDriver.create("goat");
		const duel = driver.createDuel();
		try {
			duel.place(0, {
				hand: [MONSTER_REBORN, MONSTER_REBORN],
				grave: [SKULL_SERVANT, SKULL_SERVANT],
			});
			duel.place(1, { szone: [{ code: ROYAL_OPPRESSION }] });
			let rebornActivated = false;
			duel.idleAction = (msg) => {
				const reborn = msg.activatableCards.find((entry) => entry.code === MONSTER_REBORN);
				if (reborn) {
					rebornActivated = true;
					return msg.prepareResponse(IdleCmdType.ACTIVATE, reborn);
				}
				return msg.prepareResponse(IdleCmdType.TO_EP);
			};
			duel.selectChainIndex = (msg) => {
				if (msg.player !== 1 || !rebornActivated) return null;
				const index = msg.chains.findIndex((entry) => entry.code === ROYAL_OPPRESSION);
				return index < 0 ? null : index;
			};
			duel.start(1, "goat");
			const flip = duel.runUntil((msg) => msg instanceof YGOProMsgChainEnd);
			expect(flip.filter((msg) => msg instanceof YGOProMsgChaining).map((msg) => msg.code)).toEqual(
				[MONSTER_REBORN, ROYAL_OPPRESSION],
			);
			expect(flip.some((msg) => msg instanceof YGOProMsgSelectEffectYn)).toBe(false);
			expect(duel.queryFieldCount(0, C.LOCATION_MZONE)).toBe(1);

			const effect = duel.runUntil(
				(msg) => msg instanceof YGOProMsgNewPhase && msg.phase === C.PHASE_END,
			);
			expect(
				effect.filter((msg) => msg instanceof YGOProMsgChaining).map((msg) => msg.code),
			).toEqual([MONSTER_REBORN, ROYAL_OPPRESSION]);
			expect(effect.filter((msg) => msg instanceof YGOProMsgPayLpCost)).toMatchObject([
				{ player: 1, cost: 800 },
			]);
			expect(effect.filter((msg) => msg instanceof YGOProMsgChainDisabled)).toMatchObject([
				{ chainCount: 1 },
			]);
			expect(duel.queryFieldCount(0, C.LOCATION_MZONE)).toBe(1);
		} finally {
			duel.endDuel();
			driver.finalize();
		}
	});
});
