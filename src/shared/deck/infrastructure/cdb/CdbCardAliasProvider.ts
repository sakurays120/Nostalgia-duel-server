import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";
import { CardAliasProvider } from "@shared/stats/persistence/RankedMatchPersistenceService";

export class CdbCardAliasProvider implements CardAliasProvider {
	private readonly aliasPromises = new Map<string, Promise<ReadonlyMap<number, number>>>();

	constructor(private readonly cdbPath?: string) {}

	private resolveCdbPath(formatId: string): string {
		if (this.cdbPath) {
			return this.cdbPath;
		}
		const resourcesDir = process.env.RESOURCES_DIR || "./nostalgia-resources";
		const cardDirectory = formatId === "goat" ? ["formats", "goat"] : ["base"];
		const primaryPath = path.resolve(
			process.cwd(),
			resourcesDir,
			"ygopro",
			...cardDirectory,
			"cards.cdb",
		);
		if (fsSync.existsSync(primaryPath)) {
			return primaryPath;
		}
		const fallbackPath = path.resolve(
			__dirname,
			"../../../../../../nostalgia-resources/ygopro",
			...cardDirectory,
			"cards.cdb",
		);
		if (fsSync.existsSync(fallbackPath)) {
			return fallbackPath;
		}
		return primaryPath;
	}

	async getAliases(formatId: string): Promise<ReadonlyMap<number, number>> {
		const filePath = this.resolveCdbPath(formatId);
		let pending = this.aliasPromises.get(filePath);
		if (!pending) {
			pending = (async () => {
				if (!fsSync.existsSync(filePath)) {
					return new Map<number, number>();
				}
				const body = await fs.readFile(filePath);
				const SQL = await initSqlJs();
				const db = new SQL.Database(body);
				const aliases = new Map<number, number>();
				try {
					const results = db.exec("SELECT id, alias FROM datas WHERE alias != 0 AND alias != id");
					if (results.length > 0) {
						for (const [id, alias] of results[0].values) {
							if (typeof id === "number" && typeof alias === "number") {
								aliases.set(id, alias);
							}
						}
					}
				} finally {
					db.close();
				}
				return aliases;
			})();
			this.aliasPromises.set(filePath, pending);
		}
		return pending;
	}
}
