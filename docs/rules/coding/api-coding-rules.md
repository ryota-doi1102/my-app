# API 実装規約

## 概要

- ルーティング: `backend/src/routes/` にリソース単位で管理する
- ビジネスロジック: `backend/src/services/{resource}/` に API 単位で管理する
- バリデーションスキーマ: `shared/schemas/` を優先し、backend 固有の拡張は `backend/src/schemas/` に置く

---

## ディレクトリ構成

```
backend/src/
├── routes/
│   └── users.ts               # PUT/GET/DELETE /api/v1/users など
├── services/
│   └── userService/
│       ├── index.ts            # サービスオブジェクトをまとめてエクスポート
│       ├── common.ts           # 複数の API で共有する型・関数
│       ├── API-USER-02.ts      # createUserProfile
│       ├── API-USER-04.ts      # updateUserProfile
│       └── ...
├── schemas/
│   └── user.ts                 # backend 固有のスキーマ拡張（base64画像など）
├── middleware/
│   ├── auth.ts                 # JWT 認証ミドルウェア
│   └── error.ts                # AppError クラス・errorHandler
└── types/
    └── api.ts                  # ErrorCode / ErrorResponse / SuccessResponse
```

---

## ルート実装（routes/）

### 基本構造

`OpenAPIHono` + `createRoute` を使う。`defaultHook` でバリデーションエラー（422）を共通処理する。

```ts
const usersRoute = new OpenAPIHono({
    defaultHook: (result, c) => {
        if (!result.success) {
            return c.json(
                {
                    status_code: 422,
                    is_success: false as const,
                    error: {
                        code: "VALIDATION_ERROR",
                        messages: result.error.issues.map((i) => i.message),
                    },
                },
                422,
            );
        }
    },
});
```

### 認証ミドルウェアの適用

- 認証が必要なルートには `requireAuth()` を適用する
- `use("/:id", requireAuth())` のように、パターンでまとめて適用できる
- 認証不要ルートには適用しない（例: ユーザー登録 PUT `/`）

```ts
// /:id 系（GET/PUT/DELETE）は認証必須
usersRoute.use("/:id", requireAuth());

// POST / は認証必須、PUT / は認証不要（分岐で処理）
usersRoute.use("/", async (c, next) => {
    if (c.req.method === "PUT") return next(); // 認証スキップ
    return requireAuth()(c, next);
});
```

### Content-Type・ボディ検証ミドルウェア

JSON を受け取る PUT/POST ルートには、Zod バリデーションの前に Content-Type と空ボディのチェックを行う。

```ts
usersRoute.use("/:id", async (c, next) => {
    if (c.req.method === "PUT") {
        const contentType = c.req.header("content-type");
        const badRequest = c.json(
            {
                status_code: 400,
                is_success: false as const,
                error: { code: "BAD_REQUEST", messages: ["リクエストの形式が正しくありません"] },
            },
            400,
        );
        if (!contentType?.includes("application/json")) return badRequest;
        try {
            const text = await c.req.raw.clone().text();
            if (!text.trim()) return badRequest;
            JSON.parse(text);
        } catch {
            return badRequest;
        }
    }
    return next();
});
```

### パスパラメータのスキーマ

- `z.string().uuid()` を使うと、非 UUID 文字列が Zod レベルで弾かれてサービスに到達しない
- サービス側で 404 を返すテストが必要な場合は `z.string()` を使い、サービス内で NOT_FOUND を throw する

```ts
// 404 をサービス側で制御する場合
params: z.object({ id: z.string() }),

// Zod レベルで UUID を強制する場合（サービスまで到達させない）
params: z.object({ id: z.string().uuid() }),
```

### レスポンス形式

| 状況 | ステータス | 形式 |
|---|---|---|
| 成功（データあり） | 200 | `{ status_code: 200, is_success: true, data: T }` |
| 成功（データなし） | 204 | `c.body(null, 204)` |
| バリデーションエラー | 422 | `{ status_code: 422, is_success: false, error: { code, messages } }` |
| 認証エラー | 401 | `{ status_code: 401, is_success: false, error: { code, messages } }` |
| リソース未検出 | 404 | AppError → errorHandler が変換 |
| 重複エラー | 409 | AppError → errorHandler が変換 |
| サーバーエラー | 500 | AppError / Error → errorHandler が変換 |

> `is_success` を使う（`success` ではない）

---

## サービス実装（services/{resource}/）

### ファイル分割

- API 1 本につき 1 ファイルに対応させる（`API-USER-04.ts` = `updateUserProfile`）
- 複数 API で使う共通関数・型は `common.ts` に集約する
- `index.ts` でサービスオブジェクトにまとめてエクスポートする

```ts
// index.ts
import { createUserProfile } from "./API-USER-02.js";
import { updateUserProfile } from "./API-USER-04.js";

export const userService = {
    createUserProfile,
    updateUserProfile,
};
```

### 関数シグネチャ

- 引数の型は `backend/src/schemas/` の `BackendInput` 型を使う
- 戻り値の型は `common.ts` に定義した型を使う

```ts
export async function updateUserProfile(
    userId: string,
    data: UserProfileEditBackendInput,
): Promise<UserProfileDetail> { ... }
```

### 実装順序

1. **存在チェック** — 対象リソースが存在するか確認し、存在しない場合は 404 を throw する
2. **重複チェック** — メールアドレスなど一意制約のある項目を確認し、重複があれば 409 を throw する
3. **副作用の準備** — ファイル保存など副作用を伴う処理をトランザクション前に実行する
4. **DB トランザクション** — 複数テーブルへの書き込みは `db.transaction()` でまとめる
5. **後処理** — 古い画像の削除など、トランザクション成功後に実行する副作用を行う
6. **取得して返す** — 更新後のデータを再取得して返す（または `void`）

```ts
// 存在チェック
const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);
if (!existingUser) throw new AppError(404, "NOT_FOUND", "ユーザーが見つかりません");

// 重複チェック
const [emailConflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, userId)))
    .limit(1);
if (emailConflict) throw new AppError(409, "CONFLICT", "メールアドレスが既に登録されています");
```

### null / undefined 判定

任意フィールドを DB に保存するときは `|| null` を使い、空文字・undefined を NULL に変換する。

```ts
// ✓ 正しい（空文字・undefined・null → NULL）
phone: phone || null,

// ✗ 誤り（undefined → NULL だが "" はそのまま ""）
phone: phone ?? null,
```

### 配列フィールドの更新（delete-then-insert）

更新時は既存データを全削除してから再挿入する。

```ts
await tx.delete(userWorkTypes).where(eq(userWorkTypes.userId, userId));
if (workTypeNames && workTypeNames.length > 0) {
    await tx.insert(userWorkTypes).values(
        workTypeNames.map((wt, i) => ({ userId, workType: wt, sortOrder: i })),
    );
}
```

### エラーハンドリング

- 想定済みエラーは `AppError` を throw する（errorHandler が適切なレスポンスに変換する）
- トランザクション内でのエラーは `AppError` でラップして throw する
- 予期せぬエラー（plain `Error`）はキャッチせず、errorHandler に委ねる

```ts
throw new AppError(404, "NOT_FOUND", "ユーザーが見つかりません");
throw new AppError(409, "CONFLICT", "メールアドレスが既に登録されています");
throw new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました");
```

### ロギング

- `getAppLogger(["services", "resource", "API-XXX-XX"])` でロガーを生成する
- 正常完了: `logger.info`
- 業務エラー（404/409 等）: `logger.warn`
- 予期せぬエラー: `logger.error`

```ts
const logger = getAppLogger(["services", "users", "API-USER-04"]);

logger.warn("ユーザーが見つからない", { userId });
logger.info("ユーザープロフィール更新成功", { userId });
```

---

## スキーマ構成

### shared/schemas/ と backend/src/schemas/ の使い分け

| 場所 | 用途 |
|---|---|
| `shared/schemas/user.ts` | フロントエンドと共有するバリデーションルール |
| `backend/src/schemas/user.ts` | backend 固有の拡張（base64 画像・nullable 化など） |

ルートで使用するスキーマは必ず `backend/src/schemas/` のものを import する。`shared/schemas/` を直接 import しない。

```ts
// ✓ backend スキーマを import する
import { userProfileEditBackendSchema } from "../schemas/user.js";

// ✗ shared スキーマを直接 import しない
import { userProfileEditSchema } from "@shared/schemas/user.js";
```

### undefined 禁止と nullable の使い分け（PUT/POST）

PUT/POST の任意フィールドは `.nullable()` のみ付ける。`.optional()` は付けない（省略 → 422）。

| API | 任意フィールドのスキーマ | 省略時 | null 時 |
|---|---|---|---|
| PUT / POST | `.nullable()` | 422 | 204（NULL で保存） |
| PATCH | `.nullable().optional()` | 変更なし | NULL で保存 |

```ts
// ✓ PUT/POST（省略不可・null 許可）
phone: z.string().nullable(),

// ✗ PUT/POST で optional は使わない
phone: z.string().nullable().optional(),

// ✓ PATCH（省略可・null 許可）
phone: z.string().nullable().optional(),
```

### 更新スキーマは作成スキーマを派生させる

更新スキーマは作成スキーマを `omit` + `extend` で導出する。フィールドを重複定義しない。

```ts
// shared/schemas/user.ts
export const userProfileEditSchema = userProfileCreateSchema
    .omit({ password: true, agreedToTerms: true })  // 更新不要な項目を除外
    .extend({
        phone: z.string().nullable(),       // optional → nullable に昇格
        postalCode: z.string().nullable(),
        prefecture: z.string().nullable(),
        // ...
    });

// backend/src/schemas/user.ts
export const userProfileEditBackendSchema = userProfileEditSchema
    .omit({ profileImage: true })               // backend で差し替える項目を除外
    .extend({
        profileImage: profileImageBase64Schema,  // base64 文字列に変更
    });

export type UserProfileEditBackendInput = z.infer<typeof userProfileEditBackendSchema>;
```

作成 API の backend スキーマも、任意フィールドは編集スキーマの shape を再利用して nullable 化を統一する。

```ts
// backend/src/schemas/user.ts
export const userProfileCreateBackendSchema = userProfileCreateSchema
    .omit({ profileImage: true })
    .extend({
        profileImage: profileImageBase64Schema,
        phone: userProfileEditSchema.shape.phone,           // nullable を再利用
        postalCode: userProfileEditSchema.shape.postalCode,
        // ...
    });
```

---

## エラーコード一覧

| HTTP | code | 用途 |
|---|---|---|
| 400 | `BAD_REQUEST` | JSON 壊れ・Content-Type 不正・空ボディ |
| 401 | `UNAUTHORIZED` | 認証エラー（トークンなし / 無効 / 期限切れ） |
| 403 | `FORBIDDEN` | 認可エラー（権限不足） |
| 404 | `NOT_FOUND` | リソースが存在しない / 論理削除済み |
| 409 | `CONFLICT` | 一意制約違反（メールアドレス重複など） |
| 422 | `VALIDATION_ERROR` | Zod バリデーション失敗 |
| 500 | `INTERNAL_SERVER_ERROR` | 予期せぬエラー |

> 認証エラーのメッセージ: Authorization ヘッダーなし → `"認証が必要です"` / トークン無効・期限切れ → `"トークンが無効です"`
