import { CardTypes } from "./CardTypes";

/**
 * The card metadata shown alongside a replay card image. Values mirror the
 * YGOPro `datas`/`texts` tables plus a few human-readable labels derived from
 * the numeric bit flags.
 */
export interface CardDetails {
	id: number;
	name: string;
	desc: string;
	scope: number;
	alias: number;
	setcode: number;
	type: number;
	typeText: string;
	attack: number;
	defense: number;
	level: number;
	race: number;
	raceText: string;
	attribute: number;
	attributeText: string;
	category: number;
	/** Original 8-digit card code as stored in the scraped data pack. */
	code?: string;
	/** Optional richer fields sourced from the HTML-free JSON card pack. */
	nameJa?: string;
	nameEn?: string;
	limitation?: string;
	rarity?: string;
	packs?: string;
	intro?: string;
	faq?: string;
	ruling?: string;
	qas?: string;
	errata?: string;
}

export interface CardDetailsRepository {
	findByCode(code: number, format: string): Promise<CardDetails | null>;
}

const TYPE_LABELS: Array<[number, string]> = [
	[CardTypes.TYPE_NORMAL, "通常"],
	[CardTypes.TYPE_EFFECT, "效果"],
	[CardTypes.TYPE_FUSION, "融合"],
	[CardTypes.TYPE_RITUAL, "仪式"],
	[CardTypes.TYPE_TRAPMONSTER, "陷阱怪兽"],
	[CardTypes.TYPE_SPIRIT, "灵魂"],
	[CardTypes.TYPE_UNION, "同盟"],
	[CardTypes.TYPE_GEMINI, "双重"],
	[CardTypes.TYPE_TUNER, "调整"],
	[CardTypes.TYPE_SYNCHRO, "同调"],
	[CardTypes.TYPE_TOKEN, "衍生物"],
	[CardTypes.TYPE_QUICKPLAY, "速攻"],
	[CardTypes.TYPE_CONTINUOUS, "永续"],
	[CardTypes.TYPE_EQUIP, "装备"],
	[CardTypes.TYPE_FIELD, "场地"],
	[CardTypes.TYPE_COUNTER, "反击"],
	[CardTypes.TYPE_FLIP, "反转"],
	[CardTypes.TYPE_TOON, "卡通"],
	[CardTypes.TYPE_XYZ, "超量"],
	[CardTypes.TYPE_PENDULUM, "灵摆"],
	[CardTypes.TYPE_LINK, "连接"],
	[CardTypes.TYPE_SKILL, "技能"],
];

const ATTRIBUTE_LABELS: Record<number, string> = {
	0x1: "地",
	0x2: "水",
	0x4: "炎",
	0x8: "风",
	0x10: "光",
	0x20: "暗",
	0x40: "神",
};

const RACE_LABELS: Array<[number, string]> = [
	[0x1, "龙族"],
	[0x2, "魔法师族"],
	[0x4, "天使族"],
	[0x8, "恶魔族"],
	[0x10, "战士族"],
	[0x20, "兽族"],
	[0x40, "鸟兽族"],
	[0x80, "昆虫族"],
	[0x100, "机械族"],
	[0x200, "水族"],
	[0x400, "炎族"],
	[0x800, "雷族"],
	[0x1000, "植物族"],
	[0x2000, "兽战士族"],
	[0x4000, "恐龙族"],
	[0x8000, "鱼族"],
	[0x10000, "爬虫类族"],
	[0x20000, "岩石族"],
	[0x40000, "鸟族"],
	[0x80000, "海龙族"],
	[0x100000, "雷龙族"],
	[0x200000, "兽人族"],
	[0x400000, "幻龙族"],
	[0x800000, "电子界族"],
];

/** Build a concise Chinese type label such as 效果怪兽 / 永续陷阱 / 速攻魔法. */
export function describeCardType(type: number): string {
	const isMonster = (type & CardTypes.TYPE_MONSTER) !== 0;
	const isSpell = (type & CardTypes.TYPE_SPELL) !== 0;
	const isTrap = (type & CardTypes.TYPE_TRAP) !== 0;
	const qualifiers = TYPE_LABELS.filter(([flag]) => (type & flag) !== 0).map(([, label]) => label);
	// YGOPro only has TYPE_NORMAL for vanilla monsters; plain spell/trap cards
	// carry no "normal" flag, so fill in 通常 to match how players name them.
	if (qualifiers.length === 0 && (isMonster || isSpell || isTrap)) {
		qualifiers.push("通常");
	}
	const base = isMonster ? "怪兽" : isSpell ? "魔法" : isTrap ? "陷阱" : "卡";
	return qualifiers.join("·") + base;
}

export function describeAttribute(attribute: number): string {
	return ATTRIBUTE_LABELS[attribute] ?? "";
}

export function describeRace(race: number): string {
	return RACE_LABELS.filter(([flag]) => (race & flag) !== 0)
		.map(([, label]) => label)
		.join("·");
}
