import fs from "node:fs";
import path from "node:path";

const CANDIDATES = [
	{ extension: ".jpg", contentType: "image/jpeg" },
	{ extension: ".png", contentType: "image/png" },
	{ extension: ".webp", contentType: "image/webp" },
] as const;

export interface CardImageLocation {
	filePath: string;
	contentType: string;
}

/**
 * Resolves a card image on disk from a format-scoped image root.
 * Only numeric card ids and safe format names are accepted so a request can
 * never escape the configured root directory. When the image pack is absent
 * the resolver returns null and the caller falls back to the card name.
 */
export class ResolveCardImage {
	constructor(
		private readonly rootDir: string,
		private readonly fileExists: (filePath: string) => boolean = fs.existsSync,
	) {}

	public run(format: string, code: string): CardImageLocation | null {
		if (!/^[0-9A-Za-z_-]+$/.test(format) || !/^\d{1,9}$/.test(code)) {
			return null;
		}
		for (const candidate of CANDIDATES) {
			const filePath = path.join(this.rootDir, format, `${code}${candidate.extension}`);
			if (this.fileExists(filePath)) {
				return { filePath, contentType: candidate.contentType };
			}
		}
		return null;
	}
}
