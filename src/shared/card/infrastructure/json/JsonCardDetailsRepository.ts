import fs from "node:fs";
import path from "node:path";

import {
	CardDetails,
	CardDetailsRepository,
} from "@shared/card/domain/CardDetails";

/**
 * Read-only repository over the HTML-free JSON card pack produced by
 * scripts/md-to-json.py. Files live at <root>/<format>/<padded-code>.json.
 * Parsed cards are cached for the process lifetime since the pack is fixed.
 */
export class JsonCardDetailsRepository implements CardDetailsRepository {
	private readonly cache = new Map<string, CardDetails | null>();

	constructor(
		private readonly rootDir: string,
		private readonly fileExists: (filePath: string) => boolean = fs.existsSync,
	) {}

	async findByCode(code: number, format: string): Promise<CardDetails | null> {
		if (!Number.isInteger(code) || code <= 0 || !/^[0-9A-Za-z_-]+$/.test(format)) {
			return null;
		}
		const cacheKey = `${format}|${code}`;
		const cached = this.cache.get(cacheKey);
		if (cached !== undefined) {
			return cached;
		}

		const raw = String(code);
		const padded = raw.padStart(8, "0");
		const candidates = raw === padded ? [raw] : [raw, padded];
		let card: CardDetails | null = null;
		for (const candidate of candidates) {
			const filePath = path.join(this.rootDir, format, `${candidate}.json`);
			if (!this.fileExists(filePath)) {
				continue;
			}
			try {
				const parsed = JSON.parse(await fs.promises.readFile(filePath, "utf8")) as Record<string, unknown>;
				card = toCardDetails(parsed);
				break;
			} catch {
				card = null;
				break;
			}
		}
		this.cache.set(cacheKey, card);
		return card;
	}
}

function toCardDetails(parsed: Record<string, unknown>): CardDetails {
	const str = (key: string): string => (typeof parsed[key] === "string" ? (parsed[key] as string) : "");
	const num = (key: string): number => (typeof parsed[key] === "number" && Number.isFinite(parsed[key]) ? (parsed[key] as number) : 0);
	return {
		id: num("id"),
		name: str("name"),
		desc: str("desc"),
		scope: 0,
		alias: 0,
		setcode: 0,
		type: 0,
		typeText: str("typeText"),
		attack: num("attack"),
		defense: num("defense"),
		level: num("level"),
		race: 0,
		raceText: str("raceText"),
		attribute: 0,
		attributeText: str("attributeText"),
		category: 0,
		code: str("code"),
		nameJa: str("nameJa"),
		nameEn: str("nameEn"),
		limitation: str("limitation"),
		rarity: str("rarity"),
		packs: str("packs"),
		intro: str("intro"),
		faq: str("faq"),
		ruling: str("ruling"),
		qas: str("qas"),
		errata: str("errata"),
	};
}
