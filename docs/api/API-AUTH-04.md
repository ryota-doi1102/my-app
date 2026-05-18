# リフレッシュ

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-AUTH-04 |
| メソッド | POST |
| パス | /api/v1/auth/refresh |
| 認証 | 不要 |
| 概要 | リフレッシュトークンを使いトークンを再発行するAPI |

## リクエスト

### リクエストボディ

| フィールド名 | 型 | 必須 | 最小 | 最大 | バリデーション | 説明 |
|---|---|---|---|---|---|---|
| refreshToken | string | ✓ | - | 255文字 | UUID v4形式 | リフレッシュトークン |

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 200 | リフレッシュ成功 |

```json
{
  "status_code": 200,
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "新しいUUID v4"
  }
}
```

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生するエラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|---|
| 400 | BAD_REQUEST | リクエストの形式が正しくありません | JSONが壊れている等 |
| 401 | UNAUTHORIZED | リフレッシュトークンが無効または期限切れです | 存在しない・無効化済み・有効期限切れ |
| 422 | VALIDATION_ERROR | リフレッシュトークンを入力してください | refreshToken が未入力 |
| 422 | VALIDATION_ERROR | UUID v4形式で入力してください | refreshToken が UUID v4形式でない |
| 422 | VALIDATION_ERROR | リフレッシュトークンは255文字以内で入力してください | refreshToken が255文字超 |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラーが発生しました | サーバー内部エラー |


## 処理フロー

| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-AUTH-04-F01 | トークンリフレッシュ処理開始 | - | - | - | `[API-AUTH-04-F01] トークンリフレッシュ処理開始` |
| API-AUTH-04-F02 | リクエストボディを JSON としてパースする | 400 | `BAD_REQUEST` | `リクエストの形式が正しくありません` | `[API-AUTH-04-F02] JSONパース失敗: ${error.message}` |
| API-AUTH-04-F03 | バリデーションを実行する | 422 | `VALIDATION_ERROR` | （各バリデーションエラーメッセージ） | `[API-AUTH-04-F03] バリデーション失敗: ${error.message}` |
| API-AUTH-04-F04 | `refresh_tokens` テーブルからトークンを検索し、有効性（存在・未失効・有効期限内）を確認する | 401 | `UNAUTHORIZED` | `リフレッシュトークンが無効または期限切れです` | `[API-AUTH-04-F04] リフレッシュトークン検証失敗: ${reason}` |
| API-AUTH-04-F05 | 古い refreshToken の `revoked_at` を更新して無効化し、新しい accessToken と refreshToken を発行して `refresh_tokens` テーブルに保存する | 500 | `INTERNAL_SERVER_ERROR` | `サーバーエラーが発生しました` | `[API-AUTH-04-F05] DB書き込み失敗: ${error.message}` |
| API-AUTH-04-F06 | 200 と accessToken・refreshToken を返す | 200 | - | - | `[API-AUTH-04-F06] トークンリフレッシュ完了` |

## 備考
- accessToken の有効期限は環境変数 JWT_ACCESS_EXPIRES_IN で管理する（1時間）
- refreshToken の有効期限は環境変数 JWT_REFRESH_EXPIRES_IN で管理する（1日）
- 古い refreshToken は削除せず revoked_at で無効化して履歴を残す
- 401 のエラーメッセージはトークンが無効な理由を区別しない（セキュリティ配慮）