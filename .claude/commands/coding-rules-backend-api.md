# backend API コーディング規約

backend の API 実装時に参照するコーディング規約。

詳細は `docs/rules/coding/api-coding-rules.md` を参照。

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
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { userProfileCreateBackendSchema } from '../schemas/user.js'
import { userService } from '../services/userService/index.js'

const usersRoute = new OpenAPIHono({
    defaultHook: (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    status_code: 422,
                    is_success: false as const,
                    error: {
                        code: 'VALIDATION_ERROR',
                        messages: result.error.issues.map((i) => i.message),
                    },
                },
                422,
            )
        }
    },
})

export { usersRoute }
```

---

## レスポンス形式

- 成功時: `{ status_code: number, is_success: true, data: T }`
- 失敗時: `{ status_code: number, is_success: false, error: { code: ErrorCode, messages: string[] } }`
- `status_code` は HTTP ヘッダーのステータスコードと必ず同じ値にする
- エラーは共通ミドルウェア（`src/middleware/error.ts`）で処理する
- 本番環境ではスタックトレースを含めない

> `is_success` を使う（`success` ではない）。エラーメッセージは `messages: string[]`（配列）。

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

- エラーレスポンスの `messages` はユーザーに表示することを想定した日本語のメッセージであること
- `messages` は必ず `docs/api/_status_codes.md` のエラーメッセージ一覧から使用する
- 一覧にないメッセージを使用する必要がある場合は、実装前にユーザーに確認を取り、承認を得てから `_status_codes.md` に追記する
- 英語メッセージ（`'Validation error'`, `'Not found'` 等）は使用禁止
- API 仕様書（`docs/api/API-XXX-XX.md`）に記載されていないメッセージをレスポンスで返してはならない

---

## バリデーション

- リクエストのバリデーションは `@hono/zod-openapi` の `zValidator` を使う
- ルートで使用するスキーマは `backend/src/schemas/` のものを import する（`shared/schemas/` を直接 import しない）
- バリデーションエラー（値の不正）は **422 `VALIDATION_ERROR`** を返す
- リクエスト形式不正（JSON が壊れている等）は **400 `BAD_REQUEST`** を返す

---

## スキーマ設計ルール

### undefined 禁止（PATCH を除く）

作成・更新 API（PUT/POST）では、リクエストボディのフィールドに `undefined`（フィールド自体の省略）を許可しない。

- 必須フィールド: `.optional()` を付けない（省略 → 422）
- 任意フィールド: `.optional()` は付けず、`.nullable()` のみ付ける（省略 → 422 / null → 204）
- 例外: PATCH API は部分更新を意図するため `.optional()` を許可する

```ts
// ✓ PUT/POST の任意フィールド（省略不可・null 許可）
phone: z.string().nullable(),

// ✗ PUT/POST で optional は使わない
phone: z.string().nullable().optional(),

// ✓ PATCH の任意フィールド（省略可・null 許可）
phone: z.string().nullable().optional(),
```

### 未入力（null）の項目は値を削除する

サービス層で `null` または空文字 `""` を受け取った場合、DB の対応カラムを NULL に更新する。

```ts
// ✓ 正しい（空文字・null → NULL）
phone: phone || null,

// ✗ 誤り（"" が NULL に変換されない）
phone: phone ?? null,
```

### スキーマは backend のものを参照する

ルートで使用するスキーマは `backend/src/schemas/` に定義した backend スキーマを import する。`shared/schemas/` を直接 import しない。

```ts
// ✓ backend スキーマを import する
import { userProfileEditBackendSchema } from "../schemas/user.js";

// ✗ shared スキーマを直接 import しない
import { userProfileEditSchema } from "@shared/schemas/user.js";
```

### 更新 API のスキーマは作成 API のスキーマを派生させる

更新スキーマは作成スキーマを基にして `omit` + `extend` で定義する。フィールドを重複定義しない。

```ts
// shared/schemas/user.ts
export const userProfileEditSchema = userProfileCreateSchema
    .omit({ password: true, agreedToTerms: true })
    .extend({
        phone: z.string().nullable(),
        postalCode: z.string().nullable(),
    });

// backend/src/schemas/user.ts
export const userProfileEditBackendSchema = userProfileEditSchema
    .omit({ profileImage: true })
    .extend({
        profileImage: profileImageBase64Schema,
    });
```

---

## 認証・認可

- 認証が必要なルートは必ず `requireAuth()` ミドルウェアを適用する
- JWT の検証は `src/middleware/auth.ts` で行う
- 認証エラーは 401、認可エラーは 403 を返す
- 認証不要ルートには適用しない（例: ユーザー登録 PUT `/`）

---

## ディレクトリ構成

```
backend/src/
├── routes/       # ルーティング（リソース単位）
├── services/     # ビジネスロジック（API 単位でファイル分割）
├── middleware/   # 共通ミドルウェア
├── schemas/      # backend 固有のスキーマ拡張
├── db/           # DB接続・スキーマ
└── types/        # backend 固有の型定義
```

- `routes/` にはルーティングのみ記述する
- ビジネスロジックは `services/` に切り出す
- `routes/` から直接 `db` を呼ばない（必ず `services/` 経由）
- サービスは API 単位でファイルを分割し、`index.ts` でまとめてエクスポートする

---

## コメント・ロギング

共通規約は `/coding-rules-comment-logging` を参照。

---

## API 実装フロー

API を実装・変更する際は以下の手順を順番に実行すること。

### 1. API 仕様書を読む

- 仕様書は `docs/api/` 配下の Markdown ファイルで管理する
- 実装前に対象の仕様書を必ず読み込み、リクエスト・レスポンス・エラー仕様を把握する
- エラーレスポンスの `messages` は仕様書の処理フロー表に記載のメッセージを使用する
- 仕様書に記載のないメッセージが必要な場合は、実装前にユーザーに確認し、`docs/api/_status_codes.md` に追記してから使用する

### 2. API を実装する

- `src/routes/` にルートを実装する（`OpenAPIHono` + `createRoute` を使う）
- ビジネスロジックは `src/services/` に切り出す
- バリデーションは `@hono/zod-openapi` + `backend/src/schemas/` を使う

### 3. API 一覧（_api-list.md）を更新する

- `docs/api/_api-list.md` に追加・変更した API を記載する

---

## 実装パターン詳細

ルート・サービス・スキーマの具体的な実装パターンは `docs/rules/coding/api-coding-rules.md` を参照。

主要ルール（抜粋）：

- `is_success` フィールドを使う（`success` ではない）、エラーは `messages: string[]`
- パスパラメータで 404 をサービス側で制御する場合は `z.string()`、Zod で弾く場合は `z.string().uuid()`
- 任意フィールドの null 変換は `|| null`（`?? null` 不可）
- サービスは API 単位でファイルを分割し、`index.ts` でまとめてエクスポートする
- トランザクション内の予期せぬエラーは `AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました")` で throw する
- PUT/POST の任意フィールドは `.nullable()` のみ（`.optional()` は付けない）
- ルートで参照するスキーマは `backend/src/schemas/` のものを使う（`shared/schemas/` を直接 import しない）
- 更新スキーマは作成スキーマを `omit` + `extend` して派生させる（重複定義しない）
