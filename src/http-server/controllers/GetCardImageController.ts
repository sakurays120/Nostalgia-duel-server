import { createHash } from "node:crypto";
import { stat, readFile } from "node:fs/promises";

import { Request, Response } from "express";

import { ResolveCardImage } from "@shared/card/application/ResolveCardImage";

/**
 * Serves card images from a local, format-scoped image pack.
 *
 * Card images are immutable for a given card code: a card never changes its
 * art. They are therefore served with a long-lived, immutable cache so the
 * browser keeps them and never re-fetches on seek/scrub. Cache invalidation is
 * handled by a version segment injected into the URL (CARD_IMAGE_VERSION on
 * the page): bumping the version produces a brand new URL, so browsers refetch
 * only when the operator deliberately changes the version after replacing the
 * image pack. An ETag derived from file mtime+size backs this up for normal
 * (non-immutable) revalidation and conditional requests.
 */
export class GetCardImageController {
	/** One year, immutable: the URL carries the pack version for busting. */
	private static readonly CACHE_CONTROL = "public, max-age=31536000, immutable";

	private readonly resolver: ResolveCardImage;

	constructor(resolver?: ResolveCardImage) {
		this.resolver = resolver ?? new ResolveCardImage(process.env.CARD_IMAGE_DIR ?? "");
	}

	async run(req: Request, res: Response): Promise<void> {
		const formatParam = req.params.format;
		const format = Array.isArray(formatParam) ? formatParam[0] : (formatParam ?? "");
		const codeParam = req.params.code;
		const code = Array.isArray(codeParam) ? codeParam[0] : (codeParam ?? "");

		const location = this.resolver.run(format, code);
		if (!location) {
			res.status(404).json({ success: false, error: "Card image not found." });
			return;
		}

		try {
			const [bytes, info] = await Promise.all([
				readFile(location.filePath),
				stat(location.filePath),
			]);
			const version = `${info.mtimeMs}-${info.size}`;
			const etag = `"${createHash("sha1").update(version).digest("hex")}"`;

			res.setHeader("Cache-Control", GetCardImageController.CACHE_CONTROL);
			res.setHeader("ETag", etag);
			const ifNoneMatch = req.headers?.["if-none-match"];
			if (ifNoneMatch === etag) {
				res.status(304).end();
				return;
			}

			res.setHeader("Content-Type", location.contentType);
			res.status(200).send(bytes);
		} catch {
			res.status(404).json({ success: false, error: "Card image not found." });
		}
	}
}
