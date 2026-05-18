# サインアップ

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-AUTH-02 |
| メソッド | POST |
| パス | /api/v1/auth/signup |
| 認証 | 不要 |
| 概要 | サインアップを実行するAPI |

## リクエスト

### リクエストボディ

| フィールド名 | 型 | 必須 | 最小 | 最大 | バリデーション | 説明 |
|---|---|---|---|---|---|---|
| token | string | ✓ | - | 255文字 | UUID v4形式 | サインアップトークン |
| email | string | ✓ | - | 255文字 | email形式 | メールアドレス |
| password | string | ✓ | 8文字 | 255文字 | 半角英数字（大文字・小文字・数字をそれぞれ1文字以上含む） | パスワード |

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 201 | サインアップ成功 |

```json
{
  "status_code": 201,
  "success": true,
  "data": {
    "accessToken": "eyJhbGci..."
  }
}
```

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生するエラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|---|
| 400 | BAD_REQUEST | リクエストの形式が正しくありません | JSONが壊れている等 |
| 401 | UNAUTHORIZED | トークンが無効または期限切れです | 存在しない・無効化済み・期限切れ・使用済み・メール不一致 |
| 409 | CONFLICT | このメールアドレスは既に登録済みです | メールアドレスの重複 |
| 422 | VALIDATION_ERROR | トークンを入力してください | token が未入力 |
| 422 | VALIDATION_ERROR | UUID v4形式で入力してください | token が UUID v4形式でない |
| 422 | VALIDATION_ERROR | トークンは255文字以内で入力してください | token が255文字超 |
| 422 | VALIDATION_ERROR | メールアドレスを入力してください | email が未入力 |
| 422 | VALIDATION_ERROR | 有効なメールアドレスを入力してください | email が email形式でない |
| 422 | VALIDATION_ERROR | メールアドレスは255文字以内で入力してください | email が255文字超 |
| 422 | VALIDATION_ERROR | パスワードを入力してください | password が未入力 |
| 422 | VALIDATION_ERROR | パスワードは8文字以上で入力してください | password が8文字未満 |
| 422 | VALIDATION_ERROR | パスワードは255文字以内で入力してください | password が255文字超 |
| 422 | VALIDATION_ERROR | 半角英数字（大文字・小文字・数字をそれぞれ1文字以上含む）で入力してください | password がパターン不一致 |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラーが発生しました | サーバー内部エラー |

## 処理フロー

| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-AUTH-02-F01 | サインアップ処理開始 | - | - | - | `[API-AUTH-02-F01] サインアップ処理開始` |
| API-AUTH-02-F02 | リクエストボディを JSON としてパースする | 400 | `BAD_REQUEST` | `リクエストの形式が正しくありません` | `[API-AUTH-02-F02] JSONパース失敗: ${error.message}` |
| API-AUTH-02-F03 | `signupSchema` でバリデーションを実行する | 422 | `VALIDATION_ERROR` | （各バリデーションエラーメッセージ） | `[API-AUTH-02-F03] バリデーション失敗: ${error.message}` |
| API-AUTH-02-F04 | `signup_tokens` テーブルからトークンを検索し、有効性（存在・未失効・有効期限内・未使用・メールアドレス一致）を確認する | 401 | `UNAUTHORIZED` | `トークンが無効または期限切れです` | `[API-AUTH-02-F04] トークン検証失敗: ${reason}` |
| API-AUTH-02-F05 | `users` テーブルにメールアドレスの重複がないか確認する | 409 | `CONFLICT` | `このメールアドレスは既に登録済みです` | `[API-AUTH-02-F05] メールアドレス重複: email=${email}` |
| API-AUTH-02-F06 | パスワードを bcrypt でハッシュ化する | - | - | - | - |
| API-AUTH-02-F07 | トランザクション内で `users` / `user_profiles` テーブルにレコードを作成し、`signup_tokens` の `used_at` を更新する | 500 | `INTERNAL_SERVER_ERROR` | `サーバーエラーが発生しました` | `[API-AUTH-02-F07] DB書き込み失敗: ${error.message}` |
| API-AUTH-02-F08 | JWT（accessToken）を発行する | - | - | - | - |
| API-AUTH-02-F09 | 201 と accessToken を返す | 201 | - | - | `[API-AUTH-02-F09] サインアップ完了: userId=${userId}` |

## 使用するスキーマ

- shared/schemas/auth.ts の signupSchema

## 備考

- トークンの検証はステップ2〜4で行い、いずれも401を返す
  （トークンが無効な理由をレスポンスに含めないことでセキュリティを高める）
- パスワードは bcrypt でハッシュ化してから保存する（平文保存禁止）
- ステップ8〜10はトランザクションで行う
  （どちらかが失敗した場合はロールバックする）
- accessToken の有効期限は環境変数 JWT_EXPIRES_IN で管理する
