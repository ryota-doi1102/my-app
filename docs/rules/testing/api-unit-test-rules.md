# API ユニットテスト規約

> テストケース一覧の書き方・仕様書の必須項目・共通コーディング規約は `docs/rules/testing/testing-common-rules.md` を参照。

## 概要

- テスト仕様書: `docs/tests/api/` に API 単位で管理する
- テストコード: `backend/src/tests/routes/` に API 単位で管理する
- 仕様書とテストコードは常に同期を保つこと

---

## TC 番号体系

| 範囲 | 区分 |
|---|---|
| 001〜099 | 認証系 |
| 100〜199 | リクエストチェック（クエリパラメータ） |
| 200〜299 | リクエストチェック（パスパラメータ） |
| 300〜399 | リクエストチェック（ボディ） |
| 400〜499 | 分岐処理（ビジネスロジック・正常系バリエーション） |
| 500〜599 | エラー（500系） |

### 各セクションの標準 TC

#### 認証系（JWT 必須 API）

| TC | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-001 | Authorization ヘッダーなし | 401 / UNAUTHORIZED / 認証が必要です |
| TC-002 | 不正な形式のトークン（`Bearer invalid_token`） | 401 / UNAUTHORIZED / トークンが無効です |
| TC-003 | 期限切れのトークン | 401 / UNAUTHORIZED / トークンが無効です |

#### 必須フィールドの標準パターン

| TC | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-3XX | `{field}` を省略する | 422 / VALIDATION_ERROR / {field}は必須項目です |
| TC-3XX | `{field}` に `null` を指定する | 422 / VALIDATION_ERROR（型エラーのためメッセージ検証は任意） |
| TC-3XX | `{field}` に空文字 `""` を指定する | 422 / VALIDATION_ERROR / {field}は必須項目です |
| TC-3XX | `{field}` に形式違反の値を指定する | 422 / VALIDATION_ERROR / {field}は{format}形式で入力してください |

#### 任意フィールドの標準パターン

| TC | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-3XX | `{field}` を省略する | 204（undefined は null に変換されて DB に保存される） |
| TC-3XX | `{field}` に `null` を指定する | 204（null で{field}をクリアする） |
| TC-3XX | `{field}` に空文字 `""` を指定する | 204（空文字は null に変換されて DB に保存される） |

#### エラー（500系）標準 TC

| TC | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-501 | DB 接続失敗時にリクエストを送信する | 500 / INTERNAL_SERVER_ERROR（メッセージは実行環境依存のため検証しない） |
| TC-502 | トランザクション内で DB エラーが発生した場合にリクエストを送信する | 500 / INTERNAL_SERVER_ERROR / 予期せぬエラーが発生しました |
| TC-503 | `NODE_ENV=production` 時に 500 エラーが発生した場合、スタックトレースがレスポンスに含まれないことを確認する | 500 / INTERNAL_SERVER_ERROR / `stack` キーが存在しない |

> TC-501 は DB 接続失敗などの生の `Error` が伝播するため、実際のメッセージは環境依存となる。メッセージのアサートは行わない。  
> TC-502 は service 層でラップした `AppError` を想定するため、メッセージをアサートする。

---

## テスト実装（backend/src/tests/routes/API-XXX-XX.test.ts）

### ファイル命名・配置

```
backend/src/tests/routes/API-USER-02.test.ts
backend/src/tests/routes/API-USER-04.test.ts
```

### セットアップテンプレート

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { sign } from "hono/jwt";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, errorHandler } from "../../middleware/error.js";
import usersRoute from "../../routes/users.js";
import { userService } from "../../services/userService/index.js";
import type { ErrorResponse } from "../../types/api.js";

vi.mock("../../lib/logger.js", () => ({
    getAppLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
    initLogger: vi.fn(),
}));

vi.mock("../../services/userService/index.js", () => ({
    userService: {
        updateUserProfile: vi.fn(),
        // 使うメソッドをすべて列挙する
    },
}));

const app = new OpenAPIHono();
app.route("/api/v1/users", usersRoute);
app.onError(errorHandler);

const JWT_SECRET = "test-secret";
const VALID_USER_ID = "11111111-1111-1111-1111-111111111111";

/** 必須項目のみを含む最小有効なリクエストボディ */
const MIN_BODY = { /* ... */ };

let validToken: string;
let expiredToken: string;

beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", JWT_SECRET);
    const now = Math.floor(Date.now() / 1000);
    validToken = await sign(
        { sub: VALID_USER_ID, email: "test@example.com", iat: now, exp: now + 3600 },
        JWT_SECRET,
        "HS256",
    );
    expiredToken = await sign(
        { sub: VALID_USER_ID, email: "test@example.com", iat: now - 7200, exp: now - 3600 },
        JWT_SECRET,
        "HS256",
    );
});

afterAll(() => {
    vi.unstubAllEnvs();
});

beforeEach(() => {
    vi.mocked(userService.updateUserProfile).mockResolvedValue(undefined as never);
});
```

### JWT トークン生成

- `jsonwebtoken` は使用しない。`sign` from `hono/jwt` を使う
- `JWT_SECRET` は `vi.stubEnv` で注入し、`beforeAll` でトークンを生成する
- `validToken`: 有効期限 +1 時間（`exp: now + 3600`）
- `expiredToken`: 有効期限 -1 時間（`exp: now - 3600`, `iat: now - 7200`）

### MIN_BODY

```ts
const MIN_BODY = {
    name: "山田太郎",
    birthDate: "1990-01-15",
    gender: "男性",
    email: "test@example.com",
    workHistories: [
        { company: "株式会社ABC", startMonth: "2020-04", role: "エンジニア" },
    ],
};
```

### リクエストヘルパー関数

認証トークンの有無・Content-Type 指定の繰り返しを減らすために、リクエスト送信用の関数をまとめる。

```ts
function put(id: string, body: unknown, token?: string) {
    return app.request(`/api/v1/users/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
}
```

### null / undefined 判定

- サービス層で任意の文字列フィールドを DB に保存する際は `|| null` を使う
- `?? null` は使わない（空文字 `""` が NULL に変換されないため）

```ts
// ✓ 正しい
phone: phone || null,      // undefined / null / "" → NULL

// ✗ 誤り
phone: phone ?? null,      // undefined → NULL、"" はそのまま ""
```

### サービスのモック

```ts
// 404 を返すケース
vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
    new AppError(404, "NOT_FOUND", "ユーザーが見つかりません"),
);

// 予期せぬエラー（TC-502）
vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
    new AppError(500, "INTERNAL_SERVER_ERROR", "予期せぬエラーが発生しました"),
);

// DB 接続失敗（TC-501）- plain Error を使う
vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
    new Error("DB connection failed"),
);
```

### TC-703 の JWT_SECRET 復元

`vi.unstubAllEnvs()` を呼ぶと `JWT_SECRET` も消えるため、直後に再度スタブする。

```ts
it("TC-503: ...", async () => {
    vi.stubEnv("NODE_ENV", "production");
    // ...テスト...
    vi.unstubAllEnvs();
    vi.stubEnv("JWT_SECRET", JWT_SECRET); // 忘れずに再設定する
});
```

### パスパラメータ（UUID 検証）のルール

- ルートの `params` に `z.string().uuid()` を使うと、非 UUID 文字列が Zod レベルで弾かれ（400/422）、サービスのモックが呼ばれない
- パラム検証で 404 を返す TC がある場合は `z.string()` を使い、サービス側で NOT_FOUND を throw する

```ts
// routes/users.ts
params: z.object({ id: z.string() }),  // 非 UUID でもサービスに到達させる
```

```ts
// テスト側でサービスに 404 を throw させる
vi.mocked(userService.updateUserProfile).mockRejectedValueOnce(
    new AppError(404, "NOT_FOUND", "ユーザーが見つかりません"),
);
const res = await put("abc", MIN_BODY, validToken);
expect(res.status).toBe(404);
```

---

## テスト仕様書と実装の整合確認

共通の確認観点は `docs/rules/testing/testing-common-rules.md` を参照。

API ユニットテスト固有の追加確認観点：

| 観点 | 確認内容 |
|---|---|
| TC-501 | plain `Error` を使っており、メッセージをアサートしていないか |
| TC-502 | `AppError` を使っており、メッセージをアサートしているか |
