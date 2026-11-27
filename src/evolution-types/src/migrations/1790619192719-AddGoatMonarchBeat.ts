import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoatMonarchBeat1790619192719 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			UPDATE "deck_types" SET "sort_order" = 38
			WHERE "format_id" = 'goat' AND "code" = 'OTHERS'
		`);
		await queryRunner.query(`
			INSERT INTO "deck_types" ("format_id", "code", "name_zh", "sort_order") VALUES
				('goat', 'G38', '帝王Beat', 37)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DELETE FROM "deck_types" WHERE "format_id" = 'goat' AND "code" = 'G38'
		`);
		await queryRunner.query(`
			UPDATE "deck_types" SET "sort_order" = 37
			WHERE "format_id" = 'goat' AND "code" = 'OTHERS'
		`);
	}
}
