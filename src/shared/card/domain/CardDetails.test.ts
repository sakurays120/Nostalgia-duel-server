import {
	describeAttribute,
	describeCardType,
	describeRace,
} from "./CardDetails";
import { CardTypes } from "./CardTypes";

describe("CardDetails labels", () => {
	it("builds a truncated monster type label", () => {
		expect(describeCardType(CardTypes.TYPE_MONSTER | CardTypes.TYPE_EFFECT)).toBe("效果怪兽");
		expect(describeCardType(CardTypes.TYPE_MONSTER | CardTypes.TYPE_NORMAL)).toBe("通常怪兽");
	});

	it("builds spell and trap type labels", () => {
		expect(describeCardType(CardTypes.TYPE_SPELL | CardTypes.TYPE_QUICKPLAY)).toBe("速攻魔法");
		expect(describeCardType(CardTypes.TYPE_TRAP | CardTypes.TYPE_CONTINUOUS)).toBe("永续陷阱");
	});

	it("joins multiple type qualifiers", () => {
		const type = CardTypes.TYPE_MONSTER | CardTypes.TYPE_SYNCHRO | CardTypes.TYPE_TUNER;
		expect(describeCardType(type)).toBe("调整·同调怪兽");
	});

	it("maps attribute and race flags to Chinese labels", () => {
		expect(describeAttribute(0x20)).toBe("暗");
		expect(describeAttribute(0x99)).toBe("");
		expect(describeRace(0x1 | 0x10)).toBe("龙族·战士族");
		expect(describeRace(0)).toBe("");
	});
});
