import { pgEnum } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["男性", "女性", "その他"]);
export type GenderType = (typeof genderEnum.enumValues)[number];
