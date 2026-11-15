import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedGoatDeckTypes1790619192717 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "usage_stat_runs"
			DROP CONSTRAINT "usage_stat_runs_format_id_check",
			ADD CONSTRAINT "ck_usage_stat_runs_format_id" CHECK ("format_id" IN ('1103', '1109', 'goat'))
		`);
		await queryRunner.query(`
			ALTER TABLE "usage_deck_rows"
			DROP CONSTRAINT "usage_deck_rows_format_id_check",
			ADD CONSTRAINT "ck_usage_deck_rows_format_id" CHECK ("format_id" IN ('1103', '1109', 'goat'))
		`);
		await queryRunner.query(`
			ALTER TABLE "usage_card_rows"
			DROP CONSTRAINT "usage_card_rows_format_id_check",
			ADD CONSTRAINT "ck_usage_card_rows_format_id" CHECK ("format_id" IN ('1103', '1109', 'goat'))
		`);
		await queryRunner.query(`
			ALTER TABLE "stats_deck_matchups"
			DROP CONSTRAINT "ck_stats_deck_matchups_format",
			ADD CONSTRAINT "ck_stats_deck_matchups_format" CHECK ("format_id" IN ('1109', 'goat'))
		`);
		await queryRunner.query(`
			ALTER TABLE "stats_deck_detail_matchups"
			DROP CONSTRAINT "stats_deck_detail_matchups_format_id_check",
			ADD CONSTRAINT "ck_stats_deck_detail_matchups_format" CHECK ("format_id" IN ('1109', 'goat'))
		`);
		await queryRunner.query(`
			ALTER TABLE "stats_deck_top_players"
			DROP CONSTRAINT "stats_deck_top_players_format_id_check",
			ADD CONSTRAINT "ck_stats_deck_top_players_format" CHECK ("format_id" IN ('1109', 'goat'))
		`);
		await queryRunner.query(`
			INSERT INTO "deck_types" ("format_id", "code", "name_zh", "sort_order") VALUES
	('goat', 'G01', '反转Beat', 0),
	('goat', 'G02', '最终一战', 1),
	('goat', 'G03', '又佐Beat', 2),
	('goat', 'G04', '铁骑士Beat', 3),
	('goat', 'G05', '荷鲁斯控制', 4),
	('goat', 'G06', '混沌控制', 5),
	('goat', 'G07', '魔法师控制', 6),
	('goat', 'G08', '技抽烧血', 7),
	('goat', 'G09', '地属性Beat', 8),
	('goat', 'G10', '混沌战士Beat', 9),
	('goat', 'G11', '战士Beat', 10),
	('goat', 'G12', '艾克佐迪亚', 11),
	('goat', 'G13', '替罪羊控制', 12),
	('goat', 'G14', '小丑控制', 13),
	('goat', 'G15', '混沌遗言', 14),
	('goat', 'G16', '水属性', 15),
	('goat', 'G17', '守墓', 16),
	('goat', 'G18', '技抽Beat', 17),
	('goat', 'G19', '弗兰肯名推门', 18),
	('goat', 'G20', '烧血', 19),
	('goat', 'G21', '混沌Turbo', 20),
	('goat', 'G22', '弗兰肯荷鲁斯', 21),
	('goat', 'G23', '名推门', 22),
	('goat', 'G24', '反转战士Beat', 23),
	('goat', 'G25', '代行者', 24),
	('goat', 'G26', '弁庆OTK', 25),
	('goat', 'G27', '倒计时', 26),
	('goat', 'G28', '巴祖异归', 27),
	('goat', 'G29', '纳祭之魔', 28),
	('goat', 'G30', '救援猫OTK', 29),
	('goat', 'G31', '佐克', 30),
	('goat', 'G32', '熊猫烧血', 31),
	('goat', 'G33', '不死Beat', 32),
	('goat', 'G34', '大暴落', 33),
	('goat', 'G35', '壶削', 34),
	('goat', 'OTHERS', '其他', 35)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "stats_deck_top_players" WHERE "format_id" = 'goat'`);
		await queryRunner.query(`DELETE FROM "stats_deck_detail_matchups" WHERE "format_id" = 'goat'`);
		await queryRunner.query(`DELETE FROM "stats_deck_matchups" WHERE "format_id" = 'goat'`);
		await queryRunner.query(`DELETE FROM "usage_card_rows" WHERE "format_id" = 'goat'`);
		await queryRunner.query(`DELETE FROM "usage_deck_rows" WHERE "format_id" = 'goat'`);
		await queryRunner.query(`DELETE FROM "usage_stat_runs" WHERE "format_id" = 'goat'`);
		await queryRunner.query(`DELETE FROM "match_decks" WHERE "format_id" = 'goat'`);
		await queryRunner.query(`DELETE FROM "deck_types" WHERE "format_id" = 'goat'`);
		await queryRunner.query(`
			ALTER TABLE "usage_stat_runs"
			DROP CONSTRAINT "ck_usage_stat_runs_format_id",
			ADD CONSTRAINT "usage_stat_runs_format_id_check" CHECK ("format_id" IN ('1103', '1109'))
		`);
		await queryRunner.query(`
			ALTER TABLE "usage_deck_rows"
			DROP CONSTRAINT "ck_usage_deck_rows_format_id",
			ADD CONSTRAINT "usage_deck_rows_format_id_check" CHECK ("format_id" IN ('1103', '1109'))
		`);
		await queryRunner.query(`
			ALTER TABLE "usage_card_rows"
			DROP CONSTRAINT "ck_usage_card_rows_format_id",
			ADD CONSTRAINT "usage_card_rows_format_id_check" CHECK ("format_id" IN ('1103', '1109'))
		`);
		await queryRunner.query(`
			ALTER TABLE "stats_deck_matchups"
			DROP CONSTRAINT "ck_stats_deck_matchups_format",
			ADD CONSTRAINT "ck_stats_deck_matchups_format" CHECK ("format_id" = '1109')
		`);
		await queryRunner.query(`
			ALTER TABLE "stats_deck_detail_matchups"
			DROP CONSTRAINT "ck_stats_deck_detail_matchups_format",
			ADD CONSTRAINT "stats_deck_detail_matchups_format_id_check" CHECK ("format_id" = '1109')
		`);
		await queryRunner.query(`
			ALTER TABLE "stats_deck_top_players"
			DROP CONSTRAINT "ck_stats_deck_top_players_format",
			ADD CONSTRAINT "stats_deck_top_players_format_id_check" CHECK ("format_id" = '1109')
		`);
	}
}
