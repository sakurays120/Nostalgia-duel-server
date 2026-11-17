import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoatDeckTypes1790619192718 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			UPDATE "deck_types" SET "sort_order" = 37
			WHERE "format_id" = 'goat' AND "code" = 'OTHERS'
		`);
		await queryRunner.query(`
			INSERT INTO "deck_types" ("format_id", "code", "name_zh", "sort_order") VALUES
				('goat', 'G36', '卡通', 35),
				('goat', 'G37', '蜘蛛Beat', 36)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DELETE FROM "deck_types" WHERE "format_id" = 'goat' AND "code" IN ('G36', 'G37')
		`);
		await queryRunner.query(`
			UPDATE "deck_types" SET "sort_order" = 35
			WHERE "format_id" = 'goat' AND "code" = 'OTHERS'
		`);
	}
}
