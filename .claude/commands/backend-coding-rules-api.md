# backend API コーディング規約

backend の API 実装時に参照するコーディング規約。

---

## TypeScript 共通ルール

- `strict` モードを使用する
- `any` は使用禁止（`unknown` を使う）
- 型定義は `interface` より `type` を優先する
- 関数の引数・戻り値には必ず型を明示する
- 非 null アサーション（`!`）は使用禁止

---

## Hono ルーティング

- ルートは `src/routes/` 配下にリソース単位でファイルを分割する
- URL は `/api/v1/` プレフィックスで統一する
- ファイル名・変数名は camelCase（`usersRoute.ts`）
- 1ファイルに対して1リソースを原則とする

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
  return c.json<ApiResponse<typeof users>>({
    success: true,
    data: users,
  })
})

export { route as usersRoute }
```

---

## レスポンス形式

- 成功時: `{ status_code: number, success: true, data: T }`
- 失敗時: `{ status_code: number, success: false, error: { code: ErrorCode, message: string } }`
- `status_code` は HTTP ヘッダーのステータスコードと必ず同じ値にする
- エラーは共通ミドルウェア（`src/middleware/error.ts`）で処理する
- 本番環境ではスタックトレースを含めない

**型の使い分け：**

| 用途 | 使用する型 |
|---|---|
| ルートのレスポンス型注釈 | `backend/src/types/api.ts` の `SuccessResponse<T>` / `ErrorResponse` |
| shared との契約（フロントと共有） | `shared/types/api.ts` の `ApiResponse<T>` |

**使用可能なエラーコード（`ErrorCode`）：**

| ステータスコード | code | 説明 |
|---|---|---|
| 400 | `BAD_REQUEST` | リクエストの形式が不正・JSON が壊れている |
| 401 | `UNAUTHORIZED` | 認証エラー |
| 403 | `FORBIDDEN` | 認可エラー（ログイン済みだが権限なし） |
| 404 | `NOT_FOUND` | リソースが存在しない |
| 409 | `CONFLICT` | 重複エラー |
| 422 | `VALIDATION_ERROR` | バリデーションエラー（形式は正しいが値が不正） |
| 500 | `INTERNAL_SERVER_ERROR` | サーバーエラー |

**エラーメッセージのルール：**

- エラーレスポンスの `message` はユーザーに表示することを想定した日本語のメッセージであること
- `message` は必ず `docs/api/_status_codes.md` のエラーメッセージ一覧から使用する
- 一覧にないメッセージを使用する必要がある場合は、実装前にユーザーに確認を取り、承認を得てから `_status_codes.md` に追記する
- 英語メッセージ（`'Validation error'`, `'Not found'` 等）は使用禁止
- API 仕様書（`docs/api/API-XXX-XX.md`）に記載されていないメッセージをレスポンスで返してはならない

---

## バリデーション

- リクエストのバリデーションは `shared/schemas/` を優先して使う
- `shared` に定義がない場合のみ `backend` 内に定義する
- Zod スキーマを使用してバリデーションする
- バリデーションは `@hono/zod-validator` の `zValidator` ミドルウェアで行う
- バリデーションエラー（値の不正）は **422 `VALIDATION_ERROR`** を返す
- リクエスト形式不正（JSON が壊れている等）は **400 `BAD_REQUEST`** を返す

```ts
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { signupRequestSchema } from '@shared/schemas/auth.js'

const route = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      // Zod スキーマのメッセージをそのまま使用する（日本語で定義されていること）
      return c.json(
        { status_code: 422, success: false,
          error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'バリデーションエラーが発生しました' } },
        422,
      )
    }
  },
})
```

---

## 認証・認可

- 認証が必要なルートは必ず auth ミドルウェアを適用する
- JWT の検証は `src/middleware/auth.ts` で行う
- 認証エラーは 401、認可エラーは 403 を返す

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

- `routes/` にはルーティングのみ記述する
- ビジネスロジックは `services/` に切り出す
- `routes/` から直接 `db` を呼ばない（必ず `services/` 経由）

---

## コメント・ロギング

共通規約は `docs/rules/comment-and-logging-rules.md` を参照。

---

## API 実装フロー

API を実装・変更する際は以下の手順を順番に実行すること。

### 1. API 仕様書を読む

- 仕様書は `docs/api/` 配下の Markdown ファイルで管理する
- 実装前に対象の仕様書を必ず読み込み、リクエスト・レスポンス・エラー仕様を把握する
- エラーレスポンスの `message` は仕様書の「このAPIで発生するエラー」表に記載のメッセージを使用する
- 仕様書に記載のないメッセージが必要な場合は、実装前にユーザーに確認し、`docs/api/_status_codes.md` に追記してから使用する

### 2. API を実装する

- `src/routes/` にルートを実装する
- ビジネスロジックは `src/services/` に切り出す
- バリデーションは `@hono/zod-openapi` + `shared/schemas/` を使う

### 3. API 一覧（api-list.md）を更新する

- `docs/api/_api-list.md` に追加・変更した API を記載する
- フォーマット:

```markdown
| ID | メソッド | パス | 状態 | ファイル | 説明 |
|---|---|---|---|---|---|
| API-AUTH-01 | POST | /auth/signup/request | 有効 | docs/api/API-AUTH-01.md | サインアップトークン発行 |
```
