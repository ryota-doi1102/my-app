# work_type（PostgreSQL Enum型）

## ID
DB-MASTER-02

## 概要

希望勤務形態を表す PostgreSQL の Enum 型。テーブルではなく型として定義されており、`user_work_types.work_type` カラムで使用する。

## Enum 値

| 値 | 説明 | 表示順 |
|---|---|---|
| フルタイム | フルタイム勤務 | 1 |
| パートタイム | パートタイム勤務 | 2 |
| リモート | リモートワーク | 3 |
| フリーランス | フリーランス | 4 |

## 型定義（Drizzle）

```ts
// backend/src/db/schema/DB-MASTER-02.ts
export const workTypeEnum = pgEnum("work_type", ["フルタイム", "パートタイム", "リモート", "フリーランス"]);
```

## 共有型定義（Zod）

```ts
// shared/schemas/user.ts
export const WORK_TYPES = ['フルタイム', 'パートタイム', 'リモート', 'フリーランス'] as const
workTypes: z.array(z.enum(WORK_TYPES))
```

## 使用箇所

| テーブル | カラム |
|---|---|
| user_work_types | work_type |

## 備考

- 値の追加は `ALTER TYPE work_type ADD VALUE '...'` で可能（マイグレーション必須）
- 値の削除・変更は PostgreSQL の制約上困難なため、原則として行わない
- シード不要（Enum 型のためデータ投入は不要）
