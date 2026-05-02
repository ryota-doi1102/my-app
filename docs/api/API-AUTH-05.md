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

1. リクエストボディをバリデーションする
2. refresh_tokens テーブルからトークンを検索する
3. 以下の場合は 401 UNAUTHORIZED を返す（理由は統一する）
   - 存在しない
   - revoked_at が存在する（無効化済み）
   - expires_at が現在時刻より過去（期限切れ）
4. refreshToken の revoked_at を現在時刻で更新する（無効化）
5. 成功レスポンスを返す

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