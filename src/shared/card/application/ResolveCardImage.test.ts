import path from "node:path";

import { ResolveCardImage } from "./ResolveCardImage";

describe("ResolveCardImage", () => {
	it("resolves a format-scoped jpg path", () => {
		const service = new ResolveCardImage("C:/images", () => true);

		const location = service.run("goat", "12345");

		expect(location?.contentType).toBe("image/jpeg");
		expect(location?.filePath.replaceAll("\\", "/")).toBe("C:/images/goat/12345.jpg");
	});

	it("falls back to png when jpg is absent", () => {
		const service = new ResolveCardImage("C:/images", (p) => p.endsWith(".png"));

		const location = service.run("1103", "999");

		expect(location?.contentType).toBe("image/png");
		expect(location?.filePath.replaceAll("\\", "/")).toBe("C:/images/1103/999.png");
	});

	it("returns null when no candidate exists", () => {
		const service = new ResolveCardImage("C:/images", () => false);

		expect(service.run("goat", "12345")).toBeNull();
	});

	it("rejects non-numeric card codes", () => {
		const service = new ResolveCardImage("C:/images", () => true);

		expect(service.run("goat", "../secret")).toBeNull();
		expect(service.run("goat", "12abc")).toBeNull();
	});

	it("rejects unsafe format names", () => {
		const service = new ResolveCardImage("C:/images", () => true);

		expect(service.run("../evil", "12345")).toBeNull();
		expect(service.run("", "12345")).toBeNull();
	});
});
