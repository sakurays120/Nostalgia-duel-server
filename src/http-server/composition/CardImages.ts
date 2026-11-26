import path from "node:path";

import { GetCardWithImage } from "@shared/card/application/GetCardWithImage";
import { ResolveCardImage } from "@shared/card/application/ResolveCardImage";
import {
	CdbCardDetailsRepository,
	defaultCardDetailsCdbPath,
} from "@shared/card/infrastructure/cdb/CdbCardDetailsRepository";
import {
	JsonCardDetailsRepository,
} from "@shared/card/infrastructure/json/JsonCardDetailsRepository";
import { CardDetails, CardDetailsRepository } from "@shared/card/domain/CardDetails";
import { config } from "src/config";

/**
 * Card metadata source: the HTML-free JSON pack (scripts/md-to-json.py) is the
 * primary source, falling back to the YGOPro CDB when a card is not in the pack
 * (e.g. formats other than goat). This keeps the endpoint useful for all formats.
 */
class CompositeCardDetailsRepository implements CardDetailsRepository {
	constructor(
		private readonly primary: CardDetailsRepository,
		private readonly fallback: CardDetailsRepository,
	) {}

	async findByCode(code: number, format: string): Promise<CardDetails | null> {
		return (await this.primary.findByCode(code, format)) ?? this.fallback.findByCode(code, format);
	}
}

const imageRoot = process.env.CARD_IMAGE_DIR ?? path.join(process.cwd(), "cards", "card_img");
const jsonRoot = process.env.CARD_DATA_DIR ?? path.join(process.cwd(), "cards", "cards_data");

const imageResolver = new ResolveCardImage(imageRoot);
const detailsRepository = new CompositeCardDetailsRepository(
	new JsonCardDetailsRepository(jsonRoot),
	new CdbCardDetailsRepository({
		resolveCdbPath: defaultCardDetailsCdbPath(config.resources.dir),
	}),
);

/** Single shared use case for the card image + metadata endpoint. */
export const getCardWithImage = new GetCardWithImage(imageResolver, detailsRepository);
