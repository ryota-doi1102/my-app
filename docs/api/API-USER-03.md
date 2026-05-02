# ユーザープロフィール取得

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-USER-03 |
| メソッド | GET |
| パス | /api/v1/users/:id |
| 認証 | JWT必須 |
| 概要 | 指定したユーザーのプロフィール詳細を取得する |

## リクエスト

### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| id | string | ✓ | ユーザーID（UUID） |

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
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "name": "山田太郎",
    "email": "yamada@example.com",
    "birthDate": "1990-01-15",
    "gender": "男性",
    "profileImageUrl": "https://storage.example.com/profile-images/xxxxx.jpg",
    "phone": "09012345678",
    "postalCode": "1500001",
    "prefecture": "東京都",
    "city": "渋谷区",
    "streetAddress": "1-2-3",
    "building": "渋谷マンション101",
    "workTypes": ["フルタイム", "リモート"],
    "qualifications": ["TOEIC 900点"],
    "workHistories": [
      {
        "company": "株式会社ABC",
        "startMonth": "2020-04",
        "endMonth": null,
        "role": "エンジニア"
      }
    ],
    "selfPR": "自己PRテキスト",
    "createdAt": "2026-04-24T00:00:00.000Z",
    "updatedAt": "2026-04-24T00:00:00.000Z"
  }
}
```

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生するエラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|---|
| 401 | UNAUTHORIZED | 認証が必要です | 未認証でアクセスした場合 |
| 401 | UNAUTHORIZED | トークンが無効です | トークンが存在しない・無効化済み・期限切れ |
| 404 | NOT_FOUND | ユーザーが見つかりません | 指定した ID のユーザーが存在しない・削除済み |
| 500 | INTERNAL_SERVER_ERROR | 予期せぬエラーが発生しました | サーバーエラー |

## 処理フロー

1. JWT を検証し、未認証の場合は 401 を返す
2. パスパラメータ `id` でユーザーを検索する
3. ユーザーが存在しない・論理削除済みの場合は 404 を返す
4. `users` / `user_profiles` / `user_work_types` / `user_qualifications` / `user_work_histories` テーブルを JOIN してプロフィール情報を取得する
5. 200 でプロフィール情報を返す

## 使用するスキーマ

- `shared/schemas/user.ts` の `UserProfile`