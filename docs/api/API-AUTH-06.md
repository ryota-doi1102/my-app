# パスワードリセットトークン発行

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-AUTH-06 |
| メソッド | POST |
| パス | /api/v1/auth/password-reset/request |
| 認証 | 不要 |
| 概要 | メールアドレスからパスワードリセットトークンを発行するAPI |

## リクエスト

### リクエストボディ

| フィールド名 | 型 | 必須 | 最小 | 最大 | バリデーション | 説明 |
|---|---|---|---|---|---|---|
| email | string | ✓ | - | 255文字 | email形式 | メールアドレス |

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 201 | トークン発行成功 |

```json
{
  "status_code": 201,
  "success": true,
  "data": {
    "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生するエラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|---|
| 400 | BAD_REQUEST | リクエストの形式が正しくありません | JSONが壊れている等 |
| 404 | NOT_FOUND | このメールアドレスのユーザーが見つかりません | 対応するユーザーが存在しない |
| 422 | VALIDATION_ERROR | メールアドレスを入力してください | email が未入力 |
| 422 | VALIDATION_ERROR | 有効なメールアドレスを入力してください | email が email形式でない |
| 422 | VALIDATION_ERROR | メールアドレスは255文字以内で入力してください | email が255文字超 |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラーが発生しました | サーバー内部エラー |

## 処理フロー

1. リクエストボディをバリデーションする
2. メールアドレスに一致するユーザーを検索する（退会済み除く）
3. ユーザーが存在しない場合は 404 を返す
4. 既存トークンがある場合は revoked_at を更新して無効化する
5. crypto.randomUUID() でトークンを生成する
6. password_reset_tokens テーブルにレコードを作成する（expires_at = 現在時刻 + 24時間）
7. トークンをレスポンスで返す

## 使用するスキーマ

- shared/schemas/auth.ts の passwordResetRequestSchema

## 備考

- トークンは crypto.randomUUID() で生成する（UUID v4形式）
- トークンの有効期限は24時間
- 同一メールアドレスで複数リクエストが来た場合、古いトークンを無効化して新しいトークンを発行する
