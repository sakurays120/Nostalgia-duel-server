import { readFile } from "node:fs/promises";

import { CardDetails, CardDetailsRepository } from "@shared/card/domain/CardDetails";
import { ResolveCardImage } from "@shared/card/application/ResolveCardImage";

export interface CardWithImageResult {
	format: string;
	code: string;
	/** data URL (data:image/...;base64,...) or null when no image file exists. */
	image: string | null;
	/** Full card metadata from the CDB, or null when the card is unknown. */
	card: CardDetails | null;
	/** Fingerprint for HTTP caching, derived from image file and card metadata. */
	etag: string;
}

/**
 * Resolves the image pack file and the CDB metadata for one card, returning a
 * single payload that lets the replay player render a card from one request.
 * Both sources are optional: a missing image still yields card metadata and a
 * missing CDB row still yields the image, so the UI can always fall back.
 */
export class GetCardWithImage {
	constructor(
		private readonly imageResolver: ResolveCardImage,
		private readonly detailsRepository: CardDetailsRepository,
	) {}

	async run(format: string, code: string): Promise<CardWithImageResult> {
		const location = this.imageResolver.run(format, code);
		const numericCode = Number(code);

		let image: string | null = null;
		let imageFingerprint = "no-image";
		if (location) {
			try {
				const bytes = await readFile(location.filePath);
				image = `data:${location.contentType};base64,${bytes.toString("base64")}`;
				imageFingerprint = String(bytes.length);
			} catch {
				image = null;
			}
		}

		const card = await this.detailsRepository.findByCode(numericCode, format);
		// Card codes are 8 digits in the data pack; normalise shorter codes so
		// the API and UI always show the canonical password (e.g. 32864 -> 00032864).
		const canonicalCode = /^\d{1,8}$/.test(code) ? code.padStart(8, "0") : code;
		const normalisedCard = card ? { ...card, code: canonicalCode } : null;
		const cardFingerprint = normalisedCard ? `${normalisedCard.id}:${normalisedCard.name}:${normalisedCard.type}` : "no-card";
		const etag = `"${hash(`${format}|${canonicalCode}|${imageFingerprint}|${cardFingerprint}`)}"`;

		return { format, code: canonicalCode, image, card: normalisedCard, etag };
	}
}

function hash(value: string): string {
	// FNV-1a is sufficient for an ETag fingerprint; no cryptographic need.
	let h = 0x811c9dc5;
	for (let i = 0; i < value.length; i++) {
		h ^= value.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0).toString(16);
}
