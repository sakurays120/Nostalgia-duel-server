import { GetCardWithImage } from "./GetCardWithImage";
import { ResolveCardImage } from "./ResolveCardImage";
import { CardDetails, CardDetailsRepository } from "@shared/card/domain/CardDetails";

class StubDetailsRepository implements CardDetailsRepository {
	constructor(private readonly card: CardDetails | null) {}
	async findByCode(): Promise<CardDetails | null> {
		return this.card;
	}
}

const sampleCard: CardDetails = {
	id: 55773067,
	name: "打落",
	desc: "对方抽卡阶段时发动。",
	scope: 3,
	alias: 0,
	setcode: 0,
	type: 4,
	typeText: "通常陷阱",
	attack: 0,
	defense: 0,
	level: 0,
	race: 0,
	raceText: "",
	attribute: 0,
	attributeText: "",
	category: 72,
};

describe("GetCardWithImage", () => {
	it("returns base64 image data URL and full card metadata", async () => {
		const fs = await import("node:fs/promises");
		const os = await import("node:os");
		const path = await import("node:path");
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), "getcard-"));
		await fs.mkdir(path.join(dir, "goat"));
		await fs.writeFile(path.join(dir, "goat", "55773067.jpg"), Buffer.from("jpeg-bytes"));
		const useCase = new GetCardWithImage(
			new ResolveCardImage(dir),
			new StubDetailsRepository(sampleCard),
		);

		const result = await useCase.run("goat", "55773067");

		expect(result.image).toBe("data:image/jpeg;base64," + Buffer.from("jpeg-bytes").toString("base64"));
		expect(result.card?.name).toBe("打落");
		expect(result.card?.typeText).toBe("通常陷阱");
		expect(result.etag).toMatch(/^".+"$/);
		await fs.rm(dir, { recursive: true, force: true });
	});

	it("returns card metadata with null image when no file exists", async () => {
		const useCase = new GetCardWithImage(
			new ResolveCardImage("C:/none", () => false),
			new StubDetailsRepository(sampleCard),
		);

		const result = await useCase.run("goat", "55773067");

		expect(result.image).toBeNull();
		expect(result.card?.name).toBe("打落");
	});

	it("zero-pads a short card code to 8 digits in the response", async () => {
		const useCase = new GetCardWithImage(
			new ResolveCardImage("C:/none", () => false),
			new StubDetailsRepository(null),
		);

		const result = await useCase.run("goat", "32864");

		expect(result.code).toBe("00032864");
	});

	it("returns image with null card when the CDB row is missing", async () => {
		const fs = await import("node:fs/promises");
		const os = await import("node:os");
		const path = await import("node:path");
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), "getcard-"));
		await fs.mkdir(path.join(dir, "goat"));
		await fs.writeFile(path.join(dir, "goat", "1.png"), Buffer.from("png"));
		const useCase = new GetCardWithImage(
			new ResolveCardImage(dir),
			new StubDetailsRepository(null),
		);

		const result = await useCase.run("goat", "1");

		expect(result.image).toBe("data:image/png;base64," + Buffer.from("png").toString("base64"));
		expect(result.card).toBeNull();
		await fs.rm(dir, { recursive: true, force: true });
	});
});
