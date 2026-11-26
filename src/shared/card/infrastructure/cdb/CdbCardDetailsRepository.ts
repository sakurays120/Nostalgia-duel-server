import fs from "node:fs";
import path from "node:path";

import initSqlJs from "sql.js";

import {
	CardDetails,
	CardDetailsRepository,
	describeAttribute,
	describeCardType,
	describeRace,
} from "@shared/card/domain/CardDetails";
import { Logger } from "@shared/logger/domain/Logger";
import LoggerFactory from "@shared/logger/infrastructure/LoggerFactory";

const SELECT_CARD = `SELECT d.id, d.ot, d.alias, d.setcode, d.type, d.atk, d.def, d.level,
	d.race, d.attribute, d.category, t.name, t.desc
	FROM datas d LEFT JOIN texts t ON t.id = d.id WHERE d.id = ?`;

export interface CdbCardDetailsOptions {
	/** Resolves a format id to the .cdb file that holds its card pool. */
	resolveCdbPath: (format: string) => string;
}

/**
 * Reads full card metadata from a YGOPro cards.cdb. Read-only and cached: the
 * fixed resource pack never changes at runtime, so the sql.js engine and the
 * prepared lookup are created lazily and reused for the process lifetime.
 */
export class CdbCardDetailsRepository implements CardDetailsRepository {
	private readonly resolveCdbPath: (format: string) => string;
	private readonly logger: Logger = LoggerFactory.getLogger();
	private readonly dbByFormat = new Map<string, Promise<{ db: import("sql.js").Database; close: () => void } | null>>();

	constructor(options: CdbCardDetailsOptions) {
		this.resolveCdbPath = options.resolveCdbPath;
	}

	async findByCode(code: number, format: string): Promise<CardDetails | null> {
		if (!Number.isInteger(code) || code <= 0) {
			return null;
		}
		const entry = await this.getDatabase(format);
		if (!entry) {
			return null;
		}
		const stmt = entry.db.prepare(SELECT_CARD);
		try {
			stmt.bind([code]);
			if (!stmt.step()) {
				return null;
			}
			const row = stmt.getAsObject() as Record<string, unknown>;
			const name = typeof row.name === "string" ? row.name : "";
			const desc = typeof row.desc === "string" ? row.desc : "";
			const type = num(row.type);
			const race = num(row.race);
			const attribute = num(row.attribute);
			return {
				id: num(row.id),
				name,
				desc,
				scope: num(row.ot),
				alias: num(row.alias),
				setcode: num(row.setcode),
				type,
				typeText: describeCardType(type),
				attack: num(row.atk),
				defense: num(row.def),
				level: num(row.level),
				race,
				raceText: describeRace(race),
				attribute,
				attributeText: describeAttribute(attribute),
				category: num(row.category),
			};
		} finally {
			stmt.free();
		}
	}

	private getDatabase(format: string): Promise<{ db: import("sql.js").Database; close: () => void } | null> {
		let pending = this.dbByFormat.get(format);
		if (!pending) {
			pending = this.openDatabase(format);
			this.dbByFormat.set(format, pending);
		}
		return pending;
	}

	private async openDatabase(format: string): Promise<{ db: import("sql.js").Database; close: () => void } | null> {
		const cdbPath = this.resolveCdbPath(format);
		if (!fs.existsSync(cdbPath)) {
			this.logger.warn(`CdbCardDetailsRepository: cdb not found for ${format}: ${cdbPath}`);
			return null;
		}
		try {
			const SQL = await initSqlJs();
			const bytes = await fs.promises.readFile(cdbPath);
			return { db: new SQL.Database(bytes), close: () => undefined };
		} catch (error) {
			this.logger.error(`CdbCardDetailsRepository: failed to open ${cdbPath}: ${error}`);
			return null;
		}
	}
}

function num(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Default path resolver: goat uses its own CDB, other formats use base. */
export function defaultCardDetailsCdbPath(resourcesDir: string): (format: string) => string {
	const root = path.resolve(resourcesDir);
	return (format: string): string => {
		if (format === "goat") {
			return path.join(root, "ygopro", "formats", "goat", "cards.cdb");
		}
		return path.join(root, "ygopro", "base", "cards.cdb");
	};
}
