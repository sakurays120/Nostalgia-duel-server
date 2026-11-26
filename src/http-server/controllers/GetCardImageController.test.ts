import { Request, Response } from "express";

import { GetCardImageController } from "./GetCardImageController";
import { ResolveCardImage } from "@shared/card/application/ResolveCardImage";

describe("GetCardImageController", () => {
	let controller: GetCardImageController;
	let req: Partial<Request>;
	let res: Partial<Response>;
	let headers: Record<string, string>;

	const setupPack = async (): Promise<string> => {
		const fs = await import("node:fs/promises");
		const path = await import("node:path");
		const os = await import("node:os");
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cardimg-"));
		await fs.mkdir(path.join(dir, "goat"));
		await fs.writeFile(path.join(dir, "goat", "4242.jpg"), Buffer.from("jpeg-bytes"));
		return dir;
	};

	beforeEach(() => {
		process.env.CARD_IMAGE_DIR = "C:/images";
		controller = new GetCardImageController();
		headers = {};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			send: jest.fn().mockReturnThis(),
			end: jest.fn().mockReturnThis(),
			setHeader: jest.fn().mockImplementation((name: string, val: string) => {
				headers[name] = val;
				return res;
			}),
		};
	});

	afterEach(() => {
		delete process.env.CARD_IMAGE_DIR;
	});

	it("returns 404 json when image does not exist", async () => {
		req = { params: { format: "goat", code: "12345" } };

		await controller.run(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ success: false, error: "Card image not found." });
	});

	it("rejects invalid card code without reading disk", async () => {
		req = { params: { format: "goat", code: "../secret" } };

		await controller.run(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.send).not.toHaveBeenCalled();
	});

	it("serves image bytes with content type and long immutable cache headers", async () => {
		const fs = await import("node:fs/promises");
		const dir = await setupPack();
		process.env.CARD_IMAGE_DIR = dir;
		controller = new GetCardImageController(new ResolveCardImage(dir));
		req = { params: { format: "goat", code: "4242" }, headers: {} };

		await controller.run(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/jpeg");
		expect(headers["Cache-Control"]).toContain("max-age=31536000");
		expect(headers["Cache-Control"]).toContain("immutable");
		expect(headers["ETag"]).toMatch(/^".+"$/);
		expect(res.send).toHaveBeenCalledWith(Buffer.from("jpeg-bytes"));
		await fs.rm(dir, { recursive: true, force: true });
	});

	it("returns 304 without a body when If-None-Match matches the ETag", async () => {
		const fs = await import("node:fs/promises");
		const dir = await setupPack();
		process.env.CARD_IMAGE_DIR = dir;
		controller = new GetCardImageController(new ResolveCardImage(dir));

		// First request discovers the ETag.
		req = { params: { format: "goat", code: "4242" }, headers: {} };
		await controller.run(req as Request, res as Response);
		const etag = headers["ETag"];
		expect(etag).toBeDefined();

		// Second request with the ETag should be a cheap 304.
		req = { params: { format: "goat", code: "4242" }, headers: { "if-none-match": etag } };
		await controller.run(req as Request, res as Response);

		expect(res.status).toHaveBeenLastCalledWith(304);
		expect(res.end).toHaveBeenCalled();
		expect(res.send).toHaveBeenCalledTimes(1); // only the first request sent bytes
		await fs.rm(dir, { recursive: true, force: true });
	});

	it("sends a full 200 when If-None-Match does not match", async () => {
		const fs = await import("node:fs/promises");
		const dir = await setupPack();
		process.env.CARD_IMAGE_DIR = dir;
		controller = new GetCardImageController(new ResolveCardImage(dir));
		req = { params: { format: "goat", code: "4242" }, headers: { "if-none-match": '"stale"' } };

		await controller.run(req as Request, res as Response);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith(Buffer.from("jpeg-bytes"));
		await fs.rm(dir, { recursive: true, force: true });
	});
});
