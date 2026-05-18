# テスト 共通ルール

## 概要

このドキュメントはすべてのテスト種別に共通するルールを定める。
各テスト種別の詳細は個別の規約ファイルを参照すること。

## 基本方針

- すべてのテストはテスト仕様書をもとに作成する
- テスト仕様書は `docs/tests/` で管理する
- 仕様書に存在しない TC はテストコードに実装しない
- テストコードを変更した場合は仕様書も同時に更新する

---

## テスト種別一覧

| 種別 | 対象 | 仕様書 | テストコード | 詳細規約 |
|---|---|---|---|---|
| API ユニット | Hono ルートの HTTP レスポンス | `docs/tests/api/API-XXX-XX.md` | `backend/src/tests/routes/API-XXX-XX.test.ts` | `docs/rules/testing/api-unit-test-rules.md` |
| フロントエンド ユニット | Zod スキーマ・フックのロジック | `docs/tests/frontend/` | `frontend/src/tests/schemas/` / `frontend/src/tests/hooks/` | `docs/rules/testing/frontend-unit-test-rules.md` |
| E2E | 画面操作・全体フロー | `docs/tests/e2e/` | `e2e/specs/` | `docs/rules/testing/e2e-testing-rules.md` |

> テスト仕様書は `docs/tests/` 配下をテスト種別ごとのサブディレクトリで管理する（`api/` / `frontend/` / `e2e/`）。

---

## テスト仕様書（docs/tests/）

### ディレクトリ構成

```
docs/tests/
├── api/        # API ユニットテスト仕様書（API-XXX-XX.md）
├── frontend/   # フロントエンドユニットテスト仕様書
└── e2e/        # E2E テスト仕様書
```

### ファイル命名（API ユニット）

API ID と一致させる。

```
docs/tests/api/API-USER-02.md
docs/tests/api/API-USER-04.md
```

### 必須セクション

各テスト仕様書には以下のセクションを必ず設ける。

| # | セクション | 内容 |
|---|---|---|
| 1 | タイトル | `# テスト仕様書 - {ID} {API名称}` |
| 2 | 対象API | ID / メソッド / パス / 認証 / 成功時レスポンスを表形式で記載 |
| 3 | テストケース一覧 | TC 番号体系のセクションごとにテーブルを設ける |

```markdown
# テスト仕様書 - API-USER-XX {API名称}

## 対象API

| 項目 | 内容 |
|---|---|
| ID | API-USER-XX |
| メソッド | PUT |
| パス | /api/v1/users/:id |
| 認証 | JWT必須 |
| 成功時レスポンス | 204 No Content（レスポンスボディなし） |

## テストケース一覧
```

### 存在しないセクション

TC 番号範囲に対応するリクエスト要素（クエリ・パラメータ等）が存在しない場合は、テーブルを省略して一行明記する。

```markdown
### リクエストチェック（クエリ）（100〜199）

このAPIにはクエリパラメータが存在しないため、該当するテストケースはない。
```

---

## テストケース一覧の書き方

### テーブル形式

テストケースは以下の 3 列で記述する。

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-001 | ...操作内容... | ...期待値... |

- **テストケースID**: `TC-XXX` 形式。TC 番号体系は各規約ファイルで定義する
- **テスト内容**: 「何をしたとき」を 1 行で記述する（操作主体は省略可）
- **期待するテスト結果**: ステータスコード・エラーコード・メッセージを `/` 区切りで記述する

### 期待するテスト結果の書き方

| 状況 | 書き方 |
|---|---|
| 成功 | `204 No Content` / `200 / {内容の説明}` |
| 4xx バリデーション | `422 / VALIDATION_ERROR / {エラーメッセージ}` |
| 4xx 認証 | `401 / UNAUTHORIZED / {エラーメッセージ}` |
| 4xx 未検出 | `404 / NOT_FOUND / {エラーメッセージ}` |
| 4xx 重複 | `409 / CONFLICT / {エラーメッセージ}` |
| 500（plain Error） | `500 / INTERNAL_SERVER_ERROR（メッセージは実行環境依存のため検証しない）` |
| 500（AppError） | `500 / INTERNAL_SERVER_ERROR / {エラーメッセージ}` |
| 500（production） | `500 / INTERNAL_SERVER_ERROR / \`stack\` キーが存在しない` |

### TC 番号の連続性

- TC を追加した場合は、後続の TC 番号を繰り上げて一意性を保つ
- 削除した場合は欠番にせず、後続の番号を詰める

---

## テストコードの共通ルール

### TC 番号

`it()` の説明文の先頭に `TC-XXX:` を付ける。説明は日本語で記述する。

```ts
it("TC-001: Authorizationヘッダーなしでリクエストを送信する", async () => { ... });
it("TC-301: name を省略すると invalid になる", () => { ... });
```

### describe によるグループ化

`describe` でリソース・フィールド単位にグループ化する。ネストは最大 2 段まで。

```ts
describe("userProfileCreateSchema", () => {
    describe("name", () => {
        it("TC-001: ...", () => { ... });
        it("TC-002: ...", () => { ... });
    });
});
```

### 最小有効データ定数

テストファイルの先頭に最小有効データを定数として定義し、各テストで spread して使う。

| 種別 | 定数名 |
|---|---|
| API ルートテスト | `MIN_BODY` |
| フォームバリデーションテスト | `VALID_DATA` |

```ts
/** 必須項目のみを含む最小有効なリクエストボディ */
const MIN_BODY = {
    name: "山田太郎",
    birthDate: "1990-01-15",
    // ...
};

// 各テストで上書き
const res = await post({ ...MIN_BODY, name: "" }, validToken);
```

### モック

- `vi.mock()` はファイルの先頭で宣言する
- `beforeEach` で `vi.clearAllMocks()` とデフォルト戻り値をリセットする
- 成功時は `mockResolvedValue(undefined)`（void の API は `undefined`）
- エラー時は `mockRejectedValueOnce(new Error(...))` または `mockRejectedValueOnce(new AppError(...))`

---

## 仕様書と実装の整合確認

仕様書に TC を追加・変更した場合はテストコードも同時に更新する。逆も同様。

| 観点 | 確認内容 |
|---|---|
| TC 数 | 仕様書の TC 数とテストコードの `it` 数が一致しているか |
| TC 番号 | 仕様書の TC-XXX ↔ テストコードの `it("TC-XXX: ...")` が対応しているか |
| エラーメッセージ | Zod スキーマのメッセージと `expect(...).toBe(...)` の文字列が一致しているか |
| 期待ステータス | 仕様書の期待結果と `expect(res.status).toBe(...)` が一致しているか |
