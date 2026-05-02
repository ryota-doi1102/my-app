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

1. リクエストボディをバリデーションする
2. refresh_tokens テーブルからトークンを検索する
3. 以下の場合は 401 UNAUTHORIZED を返す（理由は統一する）
   - 存在しない
   - revoked_at が存在する（無効化済み）
   - expires_at が現在時刻より過去（期限切れ）
4. 古い refreshToken の revoked_at を現在時刻で更新する（無効化）
5. 新しい accessToken を発行する
6. 新しい refreshToken を発行する（有効期限：現在時刻 + 1日）
7. refresh_tokens テーブルに新しい refreshToken を保存する
8. accessToken と refreshToken を返す

## 備考
- accessToken の有効期限は環境変数 JWT_ACCESS_EXPIRES_IN で管理する（1時間）
- refreshToken の有効期限は環境変数 JWT_REFRESH_EXPIRES_IN で管理する（1日）
- 古い refreshToken は削除せず revoked_at で無効化して履歴を残す
- 401 のエラーメッセージはトークンが無効な理由を区別しない（セキュリティ配慮）