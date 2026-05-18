# フロントエンド ユニットテスト規約

> テストケース一覧の書き方・共通コーディング規約は `docs/rules/testing/testing-common-rules.md` を参照。

## 概要

フロントエンドのユニットテストは以下の 2 種類を対象とする。

| 種別 | 対象 | テストファイルの配置 |
|---|---|---|
| フォームバリデーション | Zod スキーマのバリデーションルール | `frontend/src/tests/schemas/` |
| API リクエスト変換 | フォームデータ → API パラメータへの変換ロジック | `frontend/src/tests/hooks/` |

- テストフレームワーク: **Vitest** + **@testing-library/react**
- モック: `vi.mock` / `vi.fn`

---

## TC 番号体系

1 フォーム（スキーマ + フック）につき 001 から採番する。

| 範囲 | 区分 |
|---|---|
| 001〜099 | 必須チェック（フィールドの省略・空文字・null） |
| 100〜499 | 形式・制約チェック（形式・文字数・禁止文字・ビジネスロジック等） |
| 500〜599 | 正常系バリエーション（有効データのパターン） |
| 600〜699 | API 変換（フォームデータ → API パラメータ変換） |
| 700〜799 | API エラー処理（エラー時の状態・メッセージ） |

- 形式・制約チェックは 100〜499 に多くの TC が入ることを想定し、フィールド単位でグループ化する
- 存在しない区分は省略してよい

### 各区分の標準 TC

#### 必須チェック（001〜099）

| TC | テスト内容 | 期待する結果 |
|---|---|---|
| TC-0XX | `{field}` を省略する | invalid / `{field}は必須項目です` |
| TC-0XX | `{field}` に空文字 `""` を指定する | invalid / `{field}は必須項目です` |
| TC-0XX | `{field}` に `null` を指定する | invalid（型エラー） |

#### 形式・制約チェック（100〜499）

| TC | テスト内容 | 期待する結果 |
|---|---|---|
| TC-1XX | `{field}` に形式違反の値を指定する | invalid / `{field}は{format}形式で入力してください` |
| TC-1XX | `{field}` にハイフンを含む値を指定する | invalid / `{field}にハイフンは使用できません` |
| TC-1XX | `{field}` に桁数違反の値を指定する | invalid / `{field}は{n}桁で入力してください` |
| TC-1XX | `birthDate` に 18 歳未満の日付を指定する | invalid / `18歳未満の方は登録できません` |

#### 正常系バリエーション（500〜599）

| TC | テスト内容 | 期待する結果 |
|---|---|---|
| TC-501 | 必須項目のみで valid になる | valid |
| TC-5XX | 任意フィールドを省略すると valid になる | valid |
| TC-5XX | 任意フィールドに空文字を指定すると valid になる | valid |
| TC-5XX | すべての項目を指定すると valid になる | valid |

#### API 変換（600〜699）

| TC | テスト内容 | 期待する結果 |
|---|---|---|
| TC-601 | 必須項目のみで API が呼ばれる | API が正しい引数で呼ばれる |
| TC-6XX | `profileImage` が `File` の場合 base64 に変換されて送信される | `profileImage` が base64 文字列になる |
| TC-6XX | `profileImage` が `null` の場合 null で送信される | `profileImage` が `null` になる |
| TC-6XX | 成功後に指定のページに遷移する | `navigate` が正しい引数で呼ばれる |

#### API エラー処理（700〜799）

| TC | テスト内容 | 期待する結果 |
|---|---|---|
| TC-701 | API エラー時に `apiError` にメッセージがセットされる | `apiError` が期待値と一致する |
| TC-7XX | 409 エラー時に `apiError` がセットされる | `apiError` が期待値と一致する |
| TC-7XX | API エラー後に再送信できる（`isSubmitting` がリセットされる） | `isSubmitting` が `false` になる |

---

## フォームバリデーションテスト（schemas/）

### 概要

`shared/schemas/` に定義された Zod スキーマを直接 `safeParse` でテストする。  
React Hook Form や DOM のレンダリングは不要。純粋な関数テストとして記述する。

### ファイル配置

```
frontend/src/tests/schemas/user.test.ts   # shared/schemas/user.ts に対応
```

### セットアップテンプレート

```ts
import { describe, expect, it } from "vitest";
import { userProfileCreateSchema } from "@shared/schemas/user";

/** 最小有効なフォームデータ（必須項目のみ） */
const VALID_DATA = {
    name: "山田太郎",
    birthDate: "1990-01-15",
    gender: "男性",
    email: "test@example.com",
    password: "Password123",
    workHistories: [{ company: "株式会社ABC", startMonth: "2020-04", role: "エンジニア" }],
    agreedToTerms: true,
};

describe("userProfileCreateSchema", () => {
    it("TC-501: 必須項目のみで valid になる", () => {
        const result = userProfileCreateSchema.safeParse(VALID_DATA);
        expect(result.success).toBe(true);
    });

    describe("name", () => {
        it("TC-001: name を省略すると invalid になる", () => {
            const { name: _n, ...data } = VALID_DATA;
            const result = userProfileCreateSchema.safeParse(data);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("氏名は必須項目です");
        });

        it("TC-002: name に空文字を指定すると invalid になる", () => {
            const result = userProfileCreateSchema.safeParse({ ...VALID_DATA, name: "" });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].message).toBe("氏名は必須項目です");
        });
    });
});
```

### テストパターン

#### 必須フィールド（TC-001〜099）

```ts
it("TC-001: name を省略すると invalid になる", () => {
    const { name: _n, ...data } = VALID_DATA;
    const result = schema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("氏名は必須項目です");
});

it("TC-002: name に空文字を指定すると invalid になる", () => {
    const result = schema.safeParse({ ...VALID_DATA, name: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("氏名は必須項目です");
});
```

#### 形式・制約チェック（TC-100〜499）

```ts
it("TC-101: birthDate に YYYY-MM-DD 以外の形式を指定すると invalid になる", () => {
    const result = schema.safeParse({ ...VALID_DATA, birthDate: "2000/01/01" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("生年月日はYYYY-MM-DD形式で入力してください");
});

it("TC-102: birthDate に 18 歳未満の日付を指定すると invalid になる", () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 17);
    const result = schema.safeParse({ ...VALID_DATA, birthDate: d.toISOString().slice(0, 10) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("18歳未満の方は登録できません");
});
```

#### 正常系バリエーション（TC-500〜599）

```ts
it("TC-501: 必須項目のみで valid になる", () => {
    const result = schema.safeParse(VALID_DATA);
    expect(result.success).toBe(true);
});

it("TC-502: phone を省略すると valid になる", () => {
    const result = schema.safeParse(VALID_DATA); // phone を含まない
    expect(result.success).toBe(true);
});

it("TC-503: phone に空文字を指定すると valid になる", () => {
    const result = schema.safeParse({ ...VALID_DATA, phone: "" });
    expect(result.success).toBe(true);
});
```

### VALID_DATA の作り方

- `password` は大文字・小文字・数字を含む 8 文字以上（例: `"Password123"`）

---

## API リクエスト変換テスト（hooks/）

### 概要

`useXxx` フックの `onSubmit` が、フォームデータを正しい API パラメータに変換してリクエストを送信しているかを検証する。

- API 関数（`createUserProfile` 等）を `vi.mock` でモックする
- `renderHook` + `act` でフォームを送信し、モックの呼び出し引数を検証する

### ファイル配置

```
frontend/src/tests/hooks/useUserCreateForm.test.ts
frontend/src/tests/hooks/useUserEditForm.test.ts
```

### セットアップテンプレート

```ts
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as usersApi from "@/lib/api/users";
import { useUserCreateForm } from "@/pages/users/create/useUserCreateForm";

vi.mock("@/lib/api/users");
vi.mock("react-router-dom", () => ({
    useNavigate: () => vi.fn(),
}));

describe("useUserCreateForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(usersApi.createUserProfile).mockResolvedValue(undefined);
    });
    // ...
});
```

### テストパターン

#### API 変換（TC-600〜699）

```ts
it("TC-601: 必須項目のみで createUserProfile が呼ばれる", async () => {
    const { result } = renderHook(() => useUserCreateForm());

    await act(async () => {
        // React Hook Form の setValue で値をセット
        result.current.setValue("name", "山田太郎");
        result.current.setValue("birthDate", "1990-01-15");
        result.current.setValue("gender", "男性");
        result.current.setValue("email", "test@example.com");
        result.current.setValue("password", "Password123");
        result.current.setValue("workHistories", [
            { company: "株式会社ABC", startMonth: "2020-04", role: "エンジニア" },
        ]);
        result.current.setValue("agreedToTerms", true);
    });

    await act(async () => {
        await result.current.handleSubmit();
    });

    expect(usersApi.createUserProfile).toHaveBeenCalledOnce();
    expect(usersApi.createUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
            name: "山田太郎",
            email: "test@example.com",
            agreedToTerms: true,
        }),
    );
});
```

```ts
it("TC-602: profileImage が File の場合は base64 に変換されて送信される", async () => {
    const mockBase64 = "data:image/jpeg;base64,/9j/4AAQ";
    vi.mocked(usersApi.fileToBase64).mockResolvedValue(mockBase64);

    // ...フォームに File をセット・送信...

    expect(usersApi.createUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({ profileImage: mockBase64 }),
    );
});

it("TC-603: profileImage が null の場合は null で送信される", async () => {
    // ...フォームに null をセット・送信...

    expect(usersApi.createUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({ profileImage: null }),
    );
});
```

#### API エラー処理（TC-700〜799）

```ts
it("TC-701: API エラー時に apiError にメッセージがセットされる", async () => {
    vi.mocked(usersApi.createUserProfile).mockRejectedValueOnce(
        new Error("メールアドレスが既に登録されています"),
    );

    // ...送信...

    expect(result.current.apiError).toBe("メールアドレスが既に登録されています");
});
```

### モックのルール

- ページ遷移（`useNavigate`）は `vi.fn()` でモックし、呼ばれたかどうかを検証する

---

## フロントエンド固有ルール

- バリデーションエラーのメッセージは `shared/constants/validationMessages.ts` の関数出力と一致させる
- Zod スキーマのテストでは DOM は不要（`@testing-library/react` は API 変換テストのみ使用）

---

## テスト実行

```bash
# frontend/ で実行
npm run test          # watch モード
npm run test:run      # 1 回実行（CI 用）
npm run test:coverage # カバレッジ付き
```
