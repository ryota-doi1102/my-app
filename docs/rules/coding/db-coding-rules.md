# backend DB コーディング規約

コマンド規約の詳細は `.claude/commands/backend-coding-rules-db.md` を参照。

---

## TypeScript 共通ルール

| ルール | 内容 |
|---|---|
| strict モード | 常に有効 |
| `any` 禁止 | 型が不明な場合は `unknown` を使う |
| 型定義 | `interface` より `type` を優先 |
| 関数の型 | 引数・戻り値に必ず型を明示 |
| 非 null アサーション（`!`） | 使用禁止 |

---

## DB 実装（Drizzle ORM）

### スキーマ定義

- スキーマ定義は `src/db/schema.ts` に集約する
- テーブル名・カラム名は snake_case
- TypeScript 側の変数名は camelCase にマッピングする

```ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert
```

### クエリルール

- 生の SQL は使用禁止（Drizzle のクエリビルダーを使う）
- N+1 問題を避けるため関連データは join で取得する
- 大量データを扱う場合はページネーションを必ず実装する
- トランザクションが必要な処理は `db.transaction()` を使用する
- 論理削除済みレコードを除外するため `isNull(table.deletedAt)` を WHERE に付ける

### マイグレーション

```bash
# 1. schema.ts を変更する
# 2. マイグレーションファイルを生成
npm run db:generate

# 3. マイグレーションを実行
npm run db:migrate
```

- マイグレーションファイルは手動で編集しない
- スキーマ変更とマイグレーションファイルは同一コミットに含めること
- 本番環境への適用前に必ずバックアップを取ること

### DB 実装フロー

テーブルを追加・変更する際は以下の手順を順番に実行する。

1. **DB 仕様書を読む** — `docs/db/` 配下の仕様書でテーブル定義・カラム・制約を確認する
2. **スキーマを実装する** — `src/db/schema.ts` にテーブル定義を追加する
3. **マイグレーションを実行する** — `npm run db:generate` → `npm run db:migrate`
4. **テーブル一覧を更新する** — `docs/db/table_list.md` に追加・変更したテーブルを記載する

---

## ディレクトリ構成

```
backend/src/
├── db/
│   ├── schema.ts   # テーブル定義（全テーブルを集約）
│   └── index.ts    # DB 接続
├── drizzle/        # 生成されたマイグレーションファイル（手動編集禁止）
└── drizzle.config.ts
```

---

## 環境変数

- DB 接続情報は必ず環境変数で管理する（コードにハードコードしない）
- `DATABASE_URL` を使用する
- `.env` は `.gitignore` に含めること
- `.env.example` に変数名と説明を記載すること
