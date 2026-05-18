# ユーザープロフィール一覧検索

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-USER-01 |
| メソッド | POST |
| パス | /api/v1/users |
| 認証 | JWT必須 |
| Content-Type | application/json |
| 概要 | 検索条件・ソート・ページングを指定してユーザー一覧を取得する |

## リクエスト

### リクエストボディ

| フィールド名 | 型 | 必須 | デフォルト | バリデーション | 説明 |
|---|---|---|---|---|---|
| name | string | - | `""` | - | 氏名（部分一致） |
| email | string | - | `""` | - | メールアドレス（部分一致） |
| phone | string | - | `""` | - | 電話番号（部分一致） |
| workTypes | string[] | - | `[]` | 各要素が `フルタイム` / `パートタイム` / `リモート` / `フリーランス` のいずれか | 希望勤務形態（OR検索） |
| sortKey | string \| null | - | `null` | `"name"` / `"email"` / `"phone"` / `null` | ソート対象カラム |
| sortOrder | string | - | `"asc"` | `"asc"` / `"desc"` | ソート方向 |
| page | integer | - | `1` | 1以上 | ページ番号 |
| perPage | integer | - | `10` | `10` / `20` / `50` / `100` のいずれか | 1ページあたりの件数 |

### リクエスト例

```json
{
  "name": "山田",
  "email": "",
  "phone": "",
  "workTypes": ["フルタイム", "リモート"],
  "sortKey": "name",
  "sortOrder": "asc",
  "page": 1,
  "perPage": 10
}
```

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 200 | 取得成功 |

```json
{
  "status_code": 200,
  "success": true,
  "data": {
    "users": [
      {
        "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "name": "山田太郎",
        "email": "yamada@example.com",
        "phone": "09012345678",
        "workTypes": ["フルタイム", "リモート"]
      }
    ],
    "totalCount": 53,
    "page": 1,
    "perPage": 10,
    "totalPages": 6
  }
}
```

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生するエラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|---|
| 400 | BAD_REQUEST | リクエストの形式が正しくありません | JSON のパース失敗 |
| 401 | UNAUTHORIZED | 認証が必要です | 未認証でアクセスした場合 |
| 401 | UNAUTHORIZED | トークンが無効です | トークンが存在しない・無効化済み・期限切れ |
| 422 | VALIDATION_ERROR | 希望勤務形態の形式が正しくありません | workTypes に許可値以外が含まれる |
| 422 | VALIDATION_ERROR | ソートキーの形式が正しくありません | sortKey が許可値以外 |
| 422 | VALIDATION_ERROR | ソート方向の形式が正しくありません | sortOrder が `asc` / `desc` 以外 |
| 422 | VALIDATION_ERROR | 表示件数の形式が正しくありません | perPage が許可値以外 |
| 500 | INTERNAL_SERVER_ERROR | 予期せぬエラーが発生しました | サーバーエラー |

## 処理フロー

| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-USER-01-F01 | 一覧検索処理開始 | - | - | - | `[API-USER-01-F01] 一覧検索処理開始` |
| API-USER-01-F02 | JWT 検証：未認証の場合は即時エラーを返す | 401 | `UNAUTHORIZED` | `認証が必要です` | `[API-USER-01-F02] JWT検証失敗: ${error.message}` |
| API-USER-01-F03 | リクエストボディを JSON としてパースする | 400 | `BAD_REQUEST` | `リクエストの形式が正しくありません` | `[API-USER-01-F03] JSONパース失敗: ${error.message}` |
| API-USER-01-F04 | リクエストパラメータをバリデーションする | 422 | `VALIDATION_ERROR` | （各バリデーションエラーメッセージ） | `[API-USER-01-F04] バリデーション失敗: ${error.message}` |
| API-USER-01-F05 | 検索条件（name / email / phone は部分一致・workTypes は OR 条件）で `users` / `user_profiles` テーブルを絞り込み、ソート・ページングしてレコードを取得する | 500 | `INTERNAL_SERVER_ERROR` | `予期せぬエラーが発生しました` | `[API-USER-01-F05] DB検索失敗: ${error.message}` |
| API-USER-01-F06 | totalCount と totalPages を算出して 200 でユーザー一覧とページング情報を返す | 200 | - | - | `[API-USER-01-F06] 一覧検索完了: totalCount=${totalCount}` |