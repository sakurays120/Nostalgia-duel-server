import { Request, Response } from "express";

import { GetCardWithImage } from "@shared/card/application/GetCardWithImage";
import { getCardWithImage } from "../composition/CardImages";

/**
 * Returns one card's image (as a base64 data URL) and its full CDB metadata
 * in a single JSON response. The response is immutable and version-addressed
 * via ?v= on the URL, so browsers cache it and never re-fetch on seek/scrub.
 */
export class GetCardImageController {
	private readonly useCase: GetCardWithImage;

	constructor(useCase?: GetCardWithImage) {
		this.useCase = useCase ?? getCardWithImage;
	}

	async run(req: Request, res: Response): Promise<void> {
		const formatParam = req.params.format;
		const format = Array.isArray(formatParam) ? formatParam[0] : (formatParam ?? "");
		const codeParam = req.params.code;
		const code = Array.isArray(codeParam) ? codeParam[0] : (codeParam ?? "");

		if (!/^[0-9A-Za-z_-]+$/.test(format) || !/^\d{1,9}$/.test(code)) {
			res.status(404).json({ success: false, error: "Card image not found." });
			return;
		}

		const result = await this.useCase.run(format, code);
		// No image and no metadata: nothing to serve.
		if (result.image === null && result.card === null) {
			res.status(404).json({ success: false, error: "Card image not found." });
			return;
		}

		res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
		res.setHeader("ETag", result.etag);
		if (req.headers?.["if-none-match"] === result.etag) {
			res.status(304).end();
			return;
		}

		res.status(200).json({
			success: true,
			data: {
				format: result.format,
				code: result.code,
				image: result.image,
				card: result.card,
			},
		});
	}
}
