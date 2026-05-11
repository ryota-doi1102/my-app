CREATE TYPE "public"."gender" AS ENUM('男性', '女性', 'その他');
--> statement-breakpoint
CREATE TYPE "public"."work_type" AS ENUM('フルタイム', 'パートタイム', 'リモート', 'フリーランス');
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "gender" "gender";
--> statement-breakpoint
DELETE FROM "user_work_types";
--> statement-breakpoint
ALTER TABLE "user_work_types" ADD COLUMN "work_type" "work_type" NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_gender_id_genders_id_fk";
--> statement-breakpoint
ALTER TABLE "user_work_types" DROP CONSTRAINT "user_work_types_work_type_id_work_types_id_fk";
--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "gender_id";
--> statement-breakpoint
ALTER TABLE "user_work_types" DROP COLUMN "work_type_id";
--> statement-breakpoint
DROP TABLE "genders";
--> statement-breakpoint
DROP TABLE "work_types";
