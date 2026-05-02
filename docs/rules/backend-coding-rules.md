# backend コーディング規約

## TypeScript 共通ルール

| ルール | 内容 |
|---|---|
| strict モード | 常に有効 |
| `any` 禁止 | 型が不明な場合は `unknown` を使う |
| 型定義 | `interface` より `type` を優先 |
| 関数の型 | 引数・戻り値に必ず型を明示 |
| 非 null アサーション（`!`） | 使用禁止 |

---

## API 実装（Hono）

### ルーティング

- ルートは `src/routes/` 配下にリソース単位でファイルを分割する
- URL は `/api/v1/` プレフィックスで統一する
- ファイル名・変数名は camelCase（`usersRoute.ts`）
- `routes/` にはルーティングのみ記述する
- ビジネスロジックは `services/` に切り出す
- `routes/` から直接 `db` を呼ばない（必ず `services/` 経由）

**ファイル構成順序：**

1. import
2. 型定義
3. ルート定義
4. export

```ts
import { Hono } from 'hono'
import type { ApiResponse } from '@shared/types/api'
import { usersService } from '../services/usersService'

const route = new Hono()

route.get('/', async (c) => {
  const users = await usersService.findAll()
  return c.json<ApiResponse<typeof users>>({ success: true, data: users })
})

export { route as usersRoute }
```

### レスポンス形式

- 成功時: `{ success: true, data: T }`
- 失敗時: `{ success: false, error: { code: string, message: string } }`
- エラーは `src/middleware/error.ts` で処理する
- 本番環境ではスタックトレースを含めない

### 認証・認可

- 認証が必要なルートは必ず auth ミドルウェアを適用する
- JWT の検証は `src/middleware/auth.ts` で行う
- 認証エラーは 401、認可エラーは 403 を返す

### ロギング

- `console.log` は使用禁止
- pino を使用してログを出力する
- 開発環境: pino-pretty で整形出力
- 本番環境: JSON 形式で出力
- ログレベル: `error` / `warn` / `info` / `debug` を適切に使い分ける

### API 実装フロー

API を実装・変更する際は以下の手順を順番に実行する。

1. **API 仕様書を読む** — `docs/api/` 配下の Markdown ファイルで仕様を確認する
2. **API を実装する** — `src/routes/` にルート、`src/services/` にビジネスロジックを実装する
3. **api-list.md を更新する** — `docs/api/api-list.md` に追加・変更した API を記載する
4. **ユニットテストを実装・修正する** — `backend-coding-rules-unit-test` の規約に従う
5. **openapi.yaml を更新する** — `docs/api/openapi.yaml` を OpenAPI 3.1 形式で更新する
6. **OpenAPI クライアントコードを生成する** — `npm run api:generate` を実行する

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

---

## ディレクトリ構成

```
backend/src/
├── routes/       # ルーティング（リソース単位）
├── services/     # ビジネスロジック
├── middleware/   # 共通ミドルウェア
├── db/           # DB接続・スキーマ
└── types/        # backend 固有の型定義
```

---

## Unit テスト（Vitest）

- テストファイルは対象ファイルと同じディレクトリに配置する
  （例：`src/services/usersService.ts` → `src/services/usersService.test.ts`）
- `describe` でリソース・機能単位にグループ化する
- `it` / `test` の説明は日本語で記述する
- Arrange / Act / Assert（AAA）パターンに従う
- 外部依存（DB・外部 API）は必ずモックする
- テストでは実 DB に接続しない

```bash
npm run test                  # watch モード
npm run test:run              # 1回実行（CI用）
npm run test:coverage         # カバレッジ確認
```

カバレッジ目標：`services/` は 80% 以上
