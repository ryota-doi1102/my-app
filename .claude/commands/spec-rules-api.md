# API 仕様書規約

API 仕様書を作成・変更する際に参照する規約。

詳細は `docs/rules/spec/api-spec-rules.md` を参照。

---

## ファイル命名・配置

```
docs/api/API-USER-02.md
docs/api/API-AUTH-01.md
```

- ID 体系: `API-{リソース}-{連番2桁}`
- リソース区分: `USER` / `AUTH`
- 追加・変更後は `docs/api/api-list.md` と `docs/api/openapi.yaml` も更新する

---

## 必須セクション

| # | セクション | 内容 |
|---|---|---|
| 1 | 基本情報 | ID / メソッド / パス / 認証 / Content-Type / 概要 |
| 2 | リクエスト | ボディ・クエリ・パスパラメータのフィールド定義 |
| 3 | レスポンス | 成功時・エラー時のステータスコードと JSON 例 |
| 4 | 処理フロー | テーブル形式（下記参照） |
| 5 | 使用するスキーマ | Zod スキーマのパスとシンボル名（省略可） |
| 6 | 備考 | 実装上の注意・特記事項（省略可） |

---

## 処理フロー（テーブル形式）

```markdown
| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-USER-02-F01 | ユーザープロフィール作成処理開始 | - | - | - | `[API-USER-02-F01] ユーザープロフィール作成処理開始` |
| API-USER-02-F02 | リクエストボディを JSON としてパースする | 400 | `BAD_REQUEST` | `リクエストの形式が正しくありません` | `[API-USER-02-F02] JSONパース失敗: ${error.message}` |
| API-USER-02-F03 | `userProfileCreateBackendSchema` でバリデーションを実行する | 422 | `VALIDATION_ERROR` | （各バリデーションエラーメッセージ） | `[API-USER-02-F03] バリデーション失敗: ${error.message}` |
| API-USER-02-F04 | email の重複を `users` テーブルで確認する | 409 | `CONFLICT` | `メールアドレスが既に登録されています` | `[API-USER-02-F04] メールアドレス重複: email=${email}` |
| API-USER-02-F05 | password を bcrypt でハッシュ化する | - | - | - | - |
| API-USER-02-F06 | 204 を返す | 204 | - | - | `[API-USER-02-F06] ユーザープロフィール作成完了: userId=${userId}` |
```

### 処理フロー ID

`{API-ID}-F{連番2桁}` 形式。F01 から始める。

### 各列の記載ルール

| 列 | エラーステップ | 中立・成功ステップ |
|---|---|---|
| ステータスコード | エラーコード（例: `400`） | `-` |
| エラーコード | backtick で囲む（例: `` `BAD_REQUEST` ``） | `-` |
| エラーメッセージ | ユーザー向けメッセージ | `-` |
| ログ表示内容 | `[ID] メッセージ: ${変数}` 形式 | 開始・完了は必須、内部処理は `-` 可 |

### ステップの標準構成

| ステップ | 内容 |
|---|---|
| F01 | `{API名称}処理開始` のログ |
| F02 | JWT 検証（認証必須 API）または JSON パース（400 BAD_REQUEST） |
| F03 | バリデーション（422 VALIDATION_ERROR） |
| FNN（末尾） | 成功レスポンスを返す |

---

## リクエストフィールド定義

```markdown
| フィールド名 | 型 | 必須 | バリデーション | 説明 |
|---|---|---|---|---|
| name | string | ✓ | 1文字以上 | 氏名 |
| phone | string \| null | - | 10〜11桁の数字のみ | 電話番号（ハイフンなし） |
```

- 必須は `✓`、任意は `-`
- 任意フィールドは `string \| null` のように null 許容を明示する

---

## エラーコード一覧

| HTTP | code | 用途 |
|---|---|---|
| 400 | `BAD_REQUEST` | JSON 壊れ・Content-Type 不正・空ボディ |
| 401 | `UNAUTHORIZED` | 認証エラー |
| 403 | `FORBIDDEN` | 認可エラー |
| 404 | `NOT_FOUND` | リソースが存在しない / 論理削除済み |
| 409 | `CONFLICT` | 一意制約違反 |
| 422 | `VALIDATION_ERROR` | Zod バリデーション失敗 |
| 500 | `INTERNAL_SERVER_ERROR` | 予期せぬエラー |

---

## 更新ルール

仕様書を追加・変更したら以下を同時に更新する:
1. `docs/api/api-list.md`
2. `docs/api/openapi.yaml`
3. 対応するテスト仕様書（`docs/tests/api/`）
