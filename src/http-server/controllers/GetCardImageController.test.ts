import { Request, Response } from "express";

import { GetCardWithImage } from "@shared/card/application/GetCardWithImage";
import { CardDetails, CardDetailsRepository } from "@shared/card/domain/CardDetails";
import { ResolveCardImage } from "@shared/card/application/ResolveCardImage";
import { GetCardImageController } from "./GetCardImageController";

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

class StubDetailsRepository implements CardDetailsRepository {
	constructor(private readonly card: CardDetails | null) {}
	async findByCode(): Promise<CardDetails | null> {
		return this.card;
	}
}

describe("GetCardImageController", () => {
	let headers: Record<string, string>;
	let res: Partial<Response>;
	let req: Partial<Request>;

	const makeController = (opts: { imageDir?: string; card?: CardDetails | null } = {}): GetCardImageController => {
		const useCase = new GetCardWithImage(
			new ResolveCardImage(opts.imageDir ?? "C:/images"),
			new StubDetailsRepository(opts.card === undefined ? sampleCard : opts.card),
		);
		return new GetCardImageController(useCase);
	};

	beforeEach(() => {
		headers = {};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			end: jest.fn().mockReturnThis(),
			setHeader: jest.fn().mockImplementation((name: string, val: string) => {
				headers[name] = val;
				return res;
			}),
		};
	});

	it("returns JSON with base64 image and card metadata", async () => {
		const fs = await import("node:fs/promises");
		const path = await import("node:path");
		const os = await import("node:os");
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ctrlcard-"));
		await fs.mkdir(path.join(dir, "goat"));
		await fs.writeFile(path.join(dir, "goat", "55773067.jpg"), Buffer.from("img"));
		const controller = makeController({ imageDir: dir });
		req = { params: { format: "goat", code: "55773067" }, headers: {} };

		await controller.run(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			data: {
				format: "goat",
				code: "55773067",
				image: "data:image/jpeg;base64," + Buffer.from("img").toString("base64"),
				card: { ...sampleCard, code: "55773067" },
			},
		});
		expect(headers["Cache-Control"]).toContain("immutable");
		await fs.rm(dir, { recursive: true, force: true });
	});

	it("returns metadata with null image when no file exists", async () => {
		const controller = makeController({ imageDir: "C:/none" });
		req = { params: { format: "goat", code: "55773067" }, headers: {} };

		await controller.run(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(200);
		const body = (res.json as jest.Mock).mock.calls[0][0];
		expect(body.data.image).toBeNull();
		expect(body.data.card.name).toBe("打落");
	});

	it("returns 404 when neither image nor metadata exists", async () => {
		const controller = makeController({ imageDir: "C:/none", card: null });
		req = { params: { format: "goat", code: "999999" }, headers: {} };

		await controller.run(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ success: false, error: "Card image not found." });
	});

	it("rejects invalid card code without touching the use case", async () => {
		const controller = makeController();
		req = { params: { format: "goat", code: "../secret" }, headers: {} };

		await controller.run(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ success: false, error: "Card image not found." });
	});

	it("returns 304 without a body when If-None-Match matches", async () => {
		const fs = await import("node:fs/promises");
		const path = await import("node:path");
		const os = await import("node:os");
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ctrlcard-"));
		await fs.mkdir(path.join(dir, "goat"));
		await fs.writeFile(path.join(dir, "goat", "55773067.jpg"), Buffer.from("img"));
		const controller = makeController({ imageDir: dir });
		req = { params: { format: "goat", code: "55773067" }, headers: {} };
		await controller.run(req as Request, res as Response);
		const etag = headers["ETag"];
		expect(etag).toBeDefined();

		req = { params: { format: "goat", code: "55773067" }, headers: { "if-none-match": etag } };
		await controller.run(req as Request, res as Response);

		expect(res.status).toHaveBeenLastCalledWith(304);
		expect(res.end).toHaveBeenCalled();
		expect(res.json).toHaveBeenCalledTimes(1);
		await fs.rm(dir, { recursive: true, force: true });
	});
});
