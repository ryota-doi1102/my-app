# サインアウト

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-AUTH-05 |
| メソッド | POST |
| パス | /api/v1/auth/signout |
| 認証 | 不要 |
| 概要 | リフレッシュトークンを無効化しサインアウトを実行するAPI |

## リクエスト

### リクエストボディ

| フィールド名 | 型 | 必須 | 最小 | 最大 | バリデーション | 説明 |
|---|---|---|---|---|---|---|
| refreshToken | string | ✓ | - | 255文字 | UUID v4形式 | リフレッシュトークン |

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 200 | サインアウト成功 |

```json
{
  "status_code": 200,
  "success": true,
  "data": null
}
```

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生する固有エラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|
| 401 | UNAUTHORIZED | 存在しないトークン・無効化済み・有効期限切れ |

```json
{
  "status_code": 401,
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "トークンが無効です"
  }
}
```

## 処理フロー

| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-AUTH-05-F01 | サインアウト処理開始 | - | - | - | `[API-AUTH-05-F01] サインアウト処理開始` |
| API-AUTH-05-F02 | リクエストボディを JSON としてパースする | 400 | `BAD_REQUEST` | `リクエストの形式が正しくありません` | `[API-AUTH-05-F02] JSONパース失敗: ${error.message}` |
| API-AUTH-05-F03 | バリデーションを実行する | 422 | `VALIDATION_ERROR` | （各バリデーションエラーメッセージ） | `[API-AUTH-05-F03] バリデーション失敗: ${error.message}` |
| API-AUTH-05-F04 | `refresh_tokens` テーブルからトークンを検索し、有効性（存在・未失効・有効期限内）を確認する | 401 | `UNAUTHORIZED` | `トークンが無効です` | `[API-AUTH-05-F04] リフレッシュトークン検証失敗: ${reason}` |
| API-AUTH-05-F05 | refreshToken の `revoked_at` を現在時刻で更新して無効化する | 500 | `INTERNAL_SERVER_ERROR` | `サーバーエラーが発生しました` | `[API-AUTH-05-F05] DB書き込み失敗: ${error.message}` |
| API-AUTH-05-F06 | 200 を返す | 200 | - | - | `[API-AUTH-05-F06] サインアウト完了` |

## 備考
- accessToken はサーバー側で無効化できないため、フロントエンド側で破棄する
- accessToken が切れていてもサインアウトは実行できる
  （accessTokenではなくrefreshTokenで認証するため）
- refreshToken を無効化することでローテーションによる新規発行を防ぐ
```

---

### 補足：accessTokenをサーバーで無効化できない点について

JWTの性質上、accessTokenは有効期限が切れるまでサーバー側で無効化できません。
```
サインアウト後もaccessTokenの有効期限内（1時間）は
技術的にはAPIを叩ける状態が続く
      ↓
対策としてフロントエンドがサインアウト時に
メモリ・CookieからaccessTokenを即時削除する