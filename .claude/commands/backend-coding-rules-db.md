# backend DB コーディング規約

Drizzle ORM を使用したデータベース操作のコーディング規約。

---

## Drizzle ORM ルール

- スキーマ定義は `src/db/schema.ts` に集約する
- テーブル名は snake_case（`users`, `user_profiles`）
- カラム名は snake_case（`created_at`, `user_id`）
- TypeScript 側の変数名は camelCase にマッピングする

**スキーマ定義例：**

```ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

---

## クエリルール

- 生の SQL は使用禁止（Drizzle のクエリビルダーを使う）
- N+1 問題を避けるため関連データは join で取得する
- 大量データを扱う場合はページネーションを必ず実装する
- トランザクションが必要な処理は `db.transaction()` を使用する

---

## DB 実装フロー

テーブルを追加・変更する際は以下の手順を順番に実行すること。

### 1. DB 仕様書を読む

- 仕様書は `docs/db/` 配下の Markdown ファイルで管理する
- 実装前に対象の仕様書を必ず読み込み、テーブル定義・カラム・制約を把握する

### 2. スキーマを実装する

- `src/db/schema.ts` にテーブル定義を追加する
- 仕様書のカラム定義・制約・インデックスに従って実装する

### 3. マイグレーションを実行する

- スキーマ変更は必ずマイグレーションファイルを生成する
- マイグレーションファイルは手動で編集しない
- 手順：
  1. `schema.ts` を変更する
  2. `npm run db:generate` でマイグレーションファイルを生成する
  3. `npm run db:migrate` でマイグレーションを実行する
- スキーマ変更とマイグレーションファイルは同一コミットに含めること
- 本番環境への適用前に必ずバックアップを取ること

### 4. テーブル一覧（table_list.md）を更新する

- `docs/db/table_list.md` に追加・変更したテーブルを記載する
- フォーマット:

```markdown
| ID | テーブル名 | 状態 | ファイル | 説明 |
|---|---|---|---|---|
| DB-AUTH-01 | users | 有効 | docs/db/DB-AUTH-01.md | ユーザー |
```

---

## 環境変数

- DB 接続情報は必ず環境変数で管理する（コードにハードコードしない）
- `DATABASE_URL` を使用する
- `.env` は `.gitignore` に含めること
- `.env.example` に変数名と説明を記載すること
