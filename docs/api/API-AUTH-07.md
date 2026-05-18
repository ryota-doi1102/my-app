# パスワードリセット実行

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-AUTH-07 |
| メソッド | POST |
| パス | /api/v1/auth/password-reset |
| 認証 | 不要 |
| 概要 | リセットトークンを使ってパスワードを更新するAPI |

## リクエスト

### リクエストボディ

| フィールド名 | 型 | 必須 | 最小 | 最大 | バリデーション | 説明 |
|---|---|---|---|---|---|---|
| token | string | ✓ | - | 255文字 | UUID v4形式 | パスワードリセットトークン |
| password | string | ✓ | 8文字 | 255文字 | 半角英数字（大文字・小文字・数字各1文字以上） | 新しいパスワード |

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 200 | パスワードリセット成功 |

```json
{
  "status_code": 200,
  "success": true,
  "data": null
}
```

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生するエラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|---|
| 400 | BAD_REQUEST | リクエストの形式が正しくありません | JSONが壊れている等 |
| 401 | UNAUTHORIZED | トークンが無効または期限切れです | トークンが存在しない・失効済み・使用済み・期限切れ |
| 404 | NOT_FOUND | ユーザーが見つかりません | 対応するユーザーが退会済み等 |
| 422 | VALIDATION_ERROR | トークンを入力してください | token が未入力 |
| 422 | VALIDATION_ERROR | パスワードは8文字以上で入力してください | password が短すぎる |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラーが発生しました | サーバー内部エラー |

## 処理フロー

| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-AUTH-07-F01 | パスワードリセット処理開始 | - | - | - | `[API-AUTH-07-F01] パスワードリセット処理開始` |
| API-AUTH-07-F02 | リクエストボディを JSON としてパースする | 400 | `BAD_REQUEST` | `リクエストの形式が正しくありません` | `[API-AUTH-07-F02] JSONパース失敗: ${error.message}` |
| API-AUTH-07-F03 | `passwordResetSchema` でバリデーションを実行する | 422 | `VALIDATION_ERROR` | （各バリデーションエラーメッセージ） | `[API-AUTH-07-F03] バリデーション失敗: ${error.message}` |
| API-AUTH-07-F04 | `password_reset_tokens` テーブルからトークンを取得し、有効性（存在・未失効・未使用・有効期限内）を確認する | 401 | `UNAUTHORIZED` | `トークンが無効または期限切れです` | `[API-AUTH-07-F04] トークン検証失敗: ${reason}` |
| API-AUTH-07-F05 | トークンのメールアドレスから `users` テーブルのユーザーを取得する（退会済み除く） | 404 | `NOT_FOUND` | `ユーザーが見つかりません` | `[API-AUTH-07-F05] ユーザーが見つかりません: email=${email}` |
| API-AUTH-07-F06 | 新しいパスワードを bcrypt でハッシュ化する | - | - | - | - |
| API-AUTH-07-F07 | トランザクション内で `users` のパスワードハッシュ更新・`password_reset_tokens` の `used_at` 更新・`refresh_tokens` の全失効を実行する | 500 | `INTERNAL_SERVER_ERROR` | `サーバーエラーが発生しました` | `[API-AUTH-07-F07] DB書き込み失敗: ${error.message}` |
| API-AUTH-07-F08 | 200 を返す | 200 | - | - | `[API-AUTH-07-F08] パスワードリセット完了: email=${email}` |

## 使用するスキーマ

- shared/schemas/auth.ts の passwordResetSchema

## 備考

- パスワードリセット後は既存のリフレッシュトークンをすべて失効させる（セキュリティ）
- リセット後はサインイン画面へリダイレクトする
