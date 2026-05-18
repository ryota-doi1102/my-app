# サインイン

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-AUTH-03 |
| メソッド | POST |
| パス | /api/v1/auth/signin |
| 認証 | 不要 |
| 概要 | サインインを実行するAPI |

## リクエスト

### リクエストボディ

| フィールド名 | 型 | 必須 | 最小 | 最大 | バリデーション | 説明 |
|---|---|---|---|---|---|---|
| email | string | ✓ | - | 255文字 | email形式 | メールアドレス |
| password | string | ✓ | 8文字 | 255文字 | - | パスワード |

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 200 | サインイン成功 |

```json
{
  "status_code": 200,
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生するエラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|---|
| 400 | BAD_REQUEST | リクエストの形式が正しくありません | JSONが壊れている等 |
| 401 | UNAUTHORIZED | メールアドレスまたはパスワードが正しくありません | ユーザー不存在・退会済み・パスワード不一致 |
| 422 | VALIDATION_ERROR | メールアドレスを入力してください | email が未入力 |
| 422 | VALIDATION_ERROR | 有効なメールアドレスを入力してください | email が email形式でない |
| 422 | VALIDATION_ERROR | メールアドレスは255文字以内で入力してください | email が255文字超 |
| 422 | VALIDATION_ERROR | パスワードを入力してください | password が未入力 |
| 422 | VALIDATION_ERROR | パスワードは8文字以上で入力してください | password が8文字未満 |
| 422 | VALIDATION_ERROR | パスワードは255文字以内で入力してください | password が255文字超 |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラーが発生しました | サーバー内部エラー |

## 処理フロー

| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-AUTH-03-F01 | サインイン処理開始 | - | - | - | `[API-AUTH-03-F01] サインイン処理開始` |
| API-AUTH-03-F02 | リクエストボディを JSON としてパースする | 400 | `BAD_REQUEST` | `リクエストの形式が正しくありません` | `[API-AUTH-03-F02] JSONパース失敗: ${error.message}` |
| API-AUTH-03-F03 | `signinSchema` でバリデーションを実行する | 422 | `VALIDATION_ERROR` | （各バリデーションエラーメッセージ） | `[API-AUTH-03-F03] バリデーション失敗: ${error.message}` |
| API-AUTH-03-F04 | メールアドレスで `users` テーブルを検索し、存在・未退会・パスワード一致を確認する | 401 | `UNAUTHORIZED` | `メールアドレスまたはパスワードが正しくありません` | `[API-AUTH-03-F04] 認証失敗: email=${email}` |
| API-AUTH-03-F05 | JWT（accessToken・refreshToken）を発行し、`refresh_tokens` テーブルに保存する | 500 | `INTERNAL_SERVER_ERROR` | `サーバーエラーが発生しました` | `[API-AUTH-03-F05] DB書き込み失敗: ${error.message}` |
| API-AUTH-03-F06 | 200 と accessToken・refreshToken を返す | 200 | - | - | `[API-AUTH-03-F06] サインイン完了: userId=${userId}` |

## 使用するスキーマ

- shared/schemas/auth.ts の signinSchema

## 備考

- accessToken の有効期限は環境変数 JWT_ACCESS_EXPIRES_IN で管理する
- refreshToken の有効期限は環境変数 JWT_REFRESH_EXPIRES_IN で管理する
- 401のエラーメッセージはメアドとパスワードのどちらが誤りかを区別しない
  （セキュリティ配慮）
