import { supportsDeckMatchups } from "@shared/deck/domain/classifier/DeckClassifier";
import { CardUsageCalculator, CardUsageRow } from "../domain/CardUsageCalculator";
import { DeckUsageCalculator, PlayerMatchDeckSnapshot } from "../domain/DeckUsageCalculator";
import { HalfYearWindow } from "../domain/HalfYearWindow";
import {
	UsageConsistencyValidator,
	UsageDeckRowData,
	UsageStatRunData,
} from "../domain/UsageConsistencyValidator";
import { CdbCardMetadataProvider } from "../infrastructure/cdb/CdbCardMetadataProvider";
import { TopDeckSelector } from "@shared/stats/matchup/domain/TopDeckSelector";
import {
	DeckMatchupCalculator,
	DeckMatchupRowData,
	RawPhysicalMatchPerspective,
} from "@shared/stats/matchup/domain/DeckMatchupCalculator";

export interface FormatWindowFacts {
	readonly snapshots: readonly PlayerMatchDeckSnapshot[];
	readonly perspectives: readonly RawPhysicalMatchPerspective[];
}

export interface UsageStatisticsRepository {
	tryAcquireAdvisoryLock(formatId: string): Promise<boolean>;
	releaseAdvisoryLock(formatId: string): Promise<void>;
	readFormatWindowFacts(
		formatId: string,
		startInclusive: string,
		endExclusive: string,
		options: { includePhysicalMatchPerspectives: boolean; snapshotBatchSize?: number },
	): Promise<FormatWindowFacts>;
	findRun(formatId: string, windowStart: string): Promise<UsageStatRunData | null>;
	listPublishedRuns(formatId: string): Promise<UsageStatRunData[]>;
	publishPeriodStatistics(
		run: UsageStatRunData,
		deckRows: readonly UsageDeckRowData[],
		cardRows: readonly CardUsageRow[],
		matchupRows?: readonly DeckMatchupRowData[],
	): Promise<void>;
}

export interface RebuildResult {
	readonly success: boolean;
	readonly formatId: string;
	readonly windowStart: string;
	readonly dataEndExclusive: string;
	readonly totalDecks?: number;
	readonly sideKnownDecks?: number;
	readonly admittedPhysicalMatches?: number;
	readonly durationMs?: number;
	readonly error?: string;
}

export interface RebuildReport {
	readonly success: boolean;
	readonly formatReports: readonly RebuildResult[];
}

export class RebuildUsageStatisticsUseCase {
	constructor(
		private readonly repository: UsageStatisticsRepository,
		private readonly metadataProvider: CdbCardMetadataProvider,
		private readonly goatMetadataProvider = metadataProvider,
	) {}

	public async rebuildFormatWindow(
		formatId: string,
		window: HalfYearWindow,
	): Promise<RebuildResult> {
		const startTime = Date.now();
		const locked = await this.repository.tryAcquireAdvisoryLock(formatId);
		if (!locked) {
			return {
				success: false,
				formatId,
				windowStart: window.windowStart,
				dataEndExclusive: window.dataEndExclusive,
				error: `Could not acquire advisory lock for format ${formatId}`,
			};
		}

		try {
			const metadata = formatId === "goat" ? this.goatMetadataProvider : this.metadataProvider;
			await metadata.load();
			const includeMatchups = supportsDeckMatchups(formatId);
			// 1. Read usage snapshots and physical match perspectives from the
			// same REPEATABLE READ snapshot so the Top 16 and the matchup matrix always
			// describe the same point in time
			const facts = await this.repository.readFormatWindowFacts(
				formatId,
				window.windowStart,
				window.dataEndExclusive,
				{ includePhysicalMatchPerspectives: includeMatchups },
			);

			// 2. Deck usage calculation
			const deckCalculator = new DeckUsageCalculator(formatId, (id) => metadata.hasCard(id));
			const deckResult = deckCalculator.calculate(facts.snapshots);

			const deckRows: UsageDeckRowData[] = [];
			for (const [code, count] of deckResult.deckCounts.entries()) {
				deckRows.push({
					formatId,
					windowStart: window.windowStart,
					deckTypeCode: code,
					deckCount: count,
				});
			}

			// 3. Card usage calculation
			const cardCalculator = new CardUsageCalculator(metadata, formatId, window.windowStart);
			const cardRows = cardCalculator.calculate(deckResult.validSnapshots);

			// 4. Header run data
			const runData: UsageStatRunData = {
				formatId,
				windowStart: window.windowStart,
				windowEndExclusive: window.windowEndExclusive,
				dataEndExclusive: window.dataEndExclusive,
				totalDecks: deckResult.totalDecks,
				sideKnownDecks: deckResult.sideKnownDecks,
				publishedAt: new Date(),
				matchupsEvaluated: includeMatchups,
			};

			// 5. Matchup calculation
			let matchupRows: DeckMatchupRowData[] = [];
			let admittedPhysicalMatches = 0;
			let topDeckCodes: string[] = [];

			if (includeMatchups) {
				topDeckCodes = TopDeckSelector.selectTopDecks(formatId, deckResult.deckCounts);
				const matchupResult = DeckMatchupCalculator.calculate(
					formatId,
					window.windowStart,
					topDeckCodes,
					facts.perspectives,
				);
				matchupRows = [...matchupResult.matchupRows];
				admittedPhysicalMatches = matchupResult.admittedPhysicalMatches;

				UsageConsistencyValidator.validateMatchupRows(
					formatId,
					window.windowStart,
					matchupRows,
					admittedPhysicalMatches,
					topDeckCodes,
				);
			}

			// 6. Pre-publish validation
			UsageConsistencyValidator.validate(runData, deckRows, cardRows, metadata);

			// 7. Atomic publish
			await this.repository.publishPeriodStatistics(runData, deckRows, cardRows, matchupRows);

			return {
				success: true,
				formatId,
				windowStart: window.windowStart,
				dataEndExclusive: window.dataEndExclusive,
				totalDecks: deckResult.totalDecks,
				sideKnownDecks: deckResult.sideKnownDecks,
				admittedPhysicalMatches: includeMatchups ? admittedPhysicalMatches : undefined,
				durationMs: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				formatId,
				windowStart: window.windowStart,
				dataEndExclusive: window.dataEndExclusive,
				error: error instanceof Error ? error.message : String(error),
			};
		} finally {
			await this.repository.releaseAdvisoryLock(formatId);
		}
	}

	public async rebuildDaily(referenceDate?: string | Date): Promise<RebuildReport> {
		const currentWindow = HalfYearWindow.current(referenceDate);
		const formats = ["1103", "1109", "goat"];
		const results: RebuildResult[] = [];

		for (const formatId of formats) {
			// Catch up previous half-year if it is unfinalized or its matchups were
			// never evaluated (a finalized batch with zero matchup rows is complete)
			const prevWindow = HalfYearWindow.previousOf(currentWindow.period);
			const prevRun = await this.repository.findRun(formatId, prevWindow.windowStart);
			const prevMatchupsEvaluated =
				!supportsDeckMatchups(formatId) || prevRun?.matchupsEvaluated === true;

			if (
				!prevRun ||
				prevRun.dataEndExclusive < prevWindow.windowEndExclusive ||
				!prevMatchupsEvaluated
			) {
				const prevResult = await this.rebuildFormatWindow(formatId, prevWindow);
				results.push(prevResult);
			}

			// Rebuild current half-year
			const currentResult = await this.rebuildFormatWindow(formatId, currentWindow);
			results.push(currentResult);
		}

		const success = results.every((r) => r.success);
		return { success, formatReports: results };
	}

	public async rebuildPeriod(
		periodStr: string,
		referenceDate?: string | Date,
	): Promise<RebuildReport> {
		const window = HalfYearWindow.fromPeriodString(periodStr, referenceDate);
		const formats = ["1103", "1109", "goat"];
		const results: RebuildResult[] = [];

		for (const formatId of formats) {
			const res = await this.rebuildFormatWindow(formatId, window);
			results.push(res);
		}

		const success = results.every((r) => r.success);
		return { success, formatReports: results };
	}
}
