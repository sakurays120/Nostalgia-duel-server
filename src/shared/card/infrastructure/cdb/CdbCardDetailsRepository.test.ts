import initSqlJs from "sql.js";

import {
	CdbCardDetailsRepository,
	defaultCardDetailsCdbPath,
} from "./CdbCardDetailsRepository";

const buildCdb = async (): Promise<Uint8Array> => {
	const SQL = await initSqlJs();
	const db = new SQL.Database();
	db.run("CREATE TABLE datas (id INTEGER PRIMARY KEY, ot INTEGER, alias INTEGER, setcode INTEGER, type INTEGER, atk INTEGER, def INTEGER, level INTEGER, race INTEGER, attribute INTEGER, category INTEGER)");
	db.run("CREATE TABLE texts (id INTEGER PRIMARY KEY, name TEXT, desc TEXT)");
	db.run("INSERT INTO datas VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [55773067, 3, 0, 0, 4, 0, 0, 0, 0, 0, 72]);
	db.run("INSERT INTO texts VALUES (?, ?, ?)", [55773067, "打落", "对方抽卡阶段时发动。"]);
	const data = db.export();
	db.close();
	return data;
};

describe("CdbCardDetailsRepository", () => {
	it("reads full card details with human-readable labels", async () => {
		const bytes = await buildCdb();
		const fs = await import("node:fs");
		const os = await import("node:os");
		const path = await import("node:path");
		const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "carddetails-"));
		await fs.promises.writeFile(path.join(dir, "cards.cdb"), bytes);
		const repo = new CdbCardDetailsRepository({ resolveCdbPath: () => path.join(dir, "cards.cdb") });

		const card = await repo.findByCode(55773067, "goat");

		expect(card).not.toBeNull();
		expect(card?.name).toBe("打落");
		expect(card?.typeText).toBe("通常陷阱");
		expect(card?.category).toBe(72);
		expect(card?.desc).toContain("抽卡阶段");
		await fs.promises.rm(dir, { recursive: true, force: true });
	});

	it("returns null for a missing card or invalid code", async () => {
		const bytes = await buildCdb();
		const fs = await import("node:fs");
		const os = await import("node:os");
		const path = await import("node:path");
		const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "carddetails-"));
		await fs.promises.writeFile(path.join(dir, "cards.cdb"), bytes);
		const repo = new CdbCardDetailsRepository({ resolveCdbPath: () => path.join(dir, "cards.cdb") });

		expect(await repo.findByCode(999999, "goat")).toBeNull();
		expect(await repo.findByCode(-1, "goat")).toBeNull();
		await fs.promises.rm(dir, { recursive: true, force: true });
	});

	it("returns null when the cdb file is absent", async () => {
		const repo = new CdbCardDetailsRepository({ resolveCdbPath: () => "C:/does-not-exist/cards.cdb" });
		expect(await repo.findByCode(55773067, "goat")).toBeNull();
	});

	it("resolves goat to its own cdb and other formats to base", () => {
		const resolve = defaultCardDetailsCdbPath("/resources");
		expect(resolve("goat").replaceAll("\\", "/")).toContain("formats/goat/cards.cdb");
		expect(resolve("1109").replaceAll("\\", "/")).toContain("base/cards.cdb");
	});
});
