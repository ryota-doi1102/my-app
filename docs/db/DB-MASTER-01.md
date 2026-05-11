# gender（PostgreSQL Enum型）

## ID
DB-MASTER-01

## 概要

性別を表す PostgreSQL の Enum 型。テーブルではなく型として定義されており、`user_profiles.gender` カラムで使用する。

## Enum 値

| 値 | 説明 | 表示順 |
|---|---|---|
| 男性 | 男性 | 1 |
| 女性 | 女性 | 2 |
| その他 | その他 | 3 |

## 型定義（Drizzle）

```ts
// backend/src/db/schema/DB-MASTER-01.ts
export const genderEnum = pgEnum("gender", ["男性", "女性", "その他"]);
```

## 共有型定義（Zod）

```ts
// shared/schemas/user.ts
gender: z.enum(['男性', '女性', 'その他'])
```

## 使用箇所

| テーブル | カラム |
|---|---|
| user_profiles | gender |

## 備考

- 値の追加は `ALTER TYPE gender ADD VALUE '...'` で可能（マイグレーション必須）
- 値の削除・変更は PostgreSQL の制約上困難なため、原則として行わない
- シード不要（Enum 型のためデータ投入は不要）
