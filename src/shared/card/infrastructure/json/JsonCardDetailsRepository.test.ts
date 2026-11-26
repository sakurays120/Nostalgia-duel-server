import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { JsonCardDetailsRepository } from "./JsonCardDetailsRepository";

describe("JsonCardDetailsRepository", () => {
	let root: string;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), "jsoncard-"));
		await fs.mkdir(path.join(root, "goat"), { recursive: true });
	});

	afterEach(async () => {
		await fs.rm(root, { recursive: true, force: true });
	});

	it("reads a padded-code JSON card with all rich fields", async () => {
		const card = {
			id: 55773067, code: "55773067", name: "打落", nameJa: "はたき落とし", nameEn: "Drop Off",
			typeText: "陷阱·通常", limitation: "无限制", rarity: "平卡N", packs: "BE02，MA，DL05",
			desc: "对方的抽卡阶段时发动。", raceText: "", attributeText: "", level: 0,
			attack: 0, defense: 0, intro: "", faq: "FAQ text", ruling: "-", qas: "", errata: "",
		};
		await fs.writeFile(path.join(root, "goat", "55773067.json"), JSON.stringify(card));

		const repo = new JsonCardDetailsRepository(root);
		const result = await repo.findByCode(55773067, "goat");

		expect(result).not.toBeNull();
		expect(result?.name).toBe("打落");
		expect(result?.nameJa).toBe("はたき落とし");
		expect(result?.typeText).toBe("陷阱·通常");
		expect(result?.faq).toBe("FAQ text");
		expect(result?.code).toBe("55773067");
		expect(result?.attack).toBe(0);
		expect(result?.scope).toBe(0);
	});

	it("zero-pads a short numeric code to find the file", async () => {
		const card = { id: 32864, name: "第13人的埋葬者", typeText: "怪兽·通常", attack: 1200, defense: 900, level: 3 };
		await fs.writeFile(path.join(root, "goat", "00032864.json"), JSON.stringify(card));

		const repo = new JsonCardDetailsRepository(root);
		const result = await repo.findByCode(32864, "goat");

		expect(result?.name).toBe("第13人的埋葬者");
		expect(result?.attack).toBe(1200);
	});

	it("returns null when the JSON file is absent", async () => {
		const repo = new JsonCardDetailsRepository(root);
		expect(await repo.findByCode(99999999, "goat")).toBeNull();
	});

	it("caches parsed cards across lookups", async () => {
		await fs.writeFile(path.join(root, "goat", "1.json"), JSON.stringify({ id: 1, name: "一" }));
		const repo = new JsonCardDetailsRepository(root);
		expect((await repo.findByCode(1, "goat"))?.name).toBe("一");
		await fs.writeFile(path.join(root, "goat", "1.json"), JSON.stringify({ id: 1, name: "二" }));
		expect((await repo.findByCode(1, "goat"))?.name).toBe("一");
	});

	it("rejects invalid codes and formats", async () => {
		const repo = new JsonCardDetailsRepository(root);
		expect(await repo.findByCode(-1, "goat")).toBeNull();
		expect(await repo.findByCode(0, "goat")).toBeNull();
		expect(await repo.findByCode(1, "../evil")).toBeNull();
	});
});
