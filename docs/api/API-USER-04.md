# ユーザープロフィール更新

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-USER-04 |
| メソッド | PUT |
| パス | /api/v1/users/:id |
| 認証 | JWT必須 |
| Content-Type | application/json |
| 概要 | 指定したユーザーのプロフィールを更新する |

## リクエスト

### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| id | string | ✓ | ユーザーID（UUID） |

### リクエストボディ

| フィールド名 | 型 | 必須 | バリデーション | 説明 |
|---|---|---|---|---|
| name | string | ✓ | 1文字以上 | 氏名 |
| birthDate | string | ✓ | YYYY-MM-DD形式・18歳以上・60歳未満 | 生年月日 |
| gender | string | ✓ | `男性` / `女性` / `その他` のいずれか | 性別 |
| profileImage | string \| null | - | base64エンコード文字列（data URI形式）・JPEG / PNG / WebP・5MB以下 | プロフィール画像（null で削除） |
| phone | string | - | 10〜11桁の数字のみ | 電話番号（ハイフンなし） |
| email | string | ✓ | メールアドレス形式 | メールアドレス |
| postalCode | string | - | 7桁の数字のみ | 郵便番号（ハイフンなし） |
| prefecture | string | - | - | 都道府県 |
| city | string | - | - | 市区町村 |
| streetAddress | string | - | - | 番地 |
| building | string | - | - | 建物名・部屋番号 |
| workTypes | string[] | - | 各要素が `フルタイム` / `パートタイム` / `リモート` / `フリーランス` のいずれか | 希望勤務形態 |
| qualifications | `{ value: string }[]` | - | 各要素の value が1文字以上 | 資格リスト |
| workHistories | WorkHistory[] | ✓ | 1件以上 | 職歴リスト |
| selfPR | string | - | - | 自己PR |

**WorkHistory オブジェクト**

| フィールド名 | 型 | 必須 | バリデーション | 説明 |
|---|---|---|---|---|
| company | string | ✓ | 1文字以上 | 会社名 |
| startMonth | string | ✓ | YYYY-MM形式 | 在籍開始月 |
| endMonth | string \| null | - | YYYY-MM形式（null = 現職） | 在籍終了月 |
| role | string | ✓ | 1文字以上 | 役職 |

### リクエスト例

```json
{
  "name": "山田太郎",
  "birthDate": "1990-01-15",
  "gender": "男性",
  "profileImage": "data:image/jpeg;base64,/9j/4AAQ...",
  "phone": "09012345678",
  "email": "yamada@example.com",
  "postalCode": "1500001",
  "prefecture": "東京都",
  "city": "渋谷区",
  "streetAddress": "1-2-3",
  "building": "渋谷マンション101",
  "workTypes": ["フルタイム", "リモート"],
  "qualifications": [{ "value": "TOEIC 900点" }],
  "workHistories": [
    {
      "company": "株式会社ABC",
      "startMonth": "2020-04",
      "endMonth": null,
      "role": "エンジニア"
    }
  ],
  "selfPR": "自己PRテキスト"
}
```

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 200 | 更新成功 |

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
    "updatedAt": "2026-04-24T12:00:00.000Z"
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
| 404 | NOT_FOUND | ユーザーが見つかりません | 指定した ID のユーザーが存在しない・削除済み |
| 409 | CONFLICT | メールアドレスが既に登録されています | 他ユーザーが同メールアドレスを使用中 |
| 422 | VALIDATION_ERROR | 氏名は必須項目です | name が未入力 |
| 422 | VALIDATION_ERROR | 生年月日は必須項目です | birthDate が未入力 |
| 422 | VALIDATION_ERROR | 生年月日はYYYY-MM-DD形式で入力してください | birthDate の形式が不正 |
| 422 | VALIDATION_ERROR | 18歳未満の方は登録できません | birthDate が18歳未満 |
| 422 | VALIDATION_ERROR | 60歳以上の方は登録できません | birthDate が60歳以上 |
| 422 | VALIDATION_ERROR | 性別は必須項目です | gender が未入力 |
| 422 | VALIDATION_ERROR | 性別の形式が正しくありません | gender が許可値以外 |
| 422 | VALIDATION_ERROR | 対応していないファイル形式です | profileImage の MIME タイプが不正 |
| 422 | VALIDATION_ERROR | ファイルサイズが上限を超えています | profileImage が 5MB 超 |
| 422 | VALIDATION_ERROR | 電話番号の形式が正しくありません | phone が 10〜11 桁の数字以外 |
| 422 | VALIDATION_ERROR | メールアドレスは必須項目です | email が未入力 |
| 422 | VALIDATION_ERROR | メールアドレスはメールアドレス形式で入力してください | email の形式が不正 |
| 422 | VALIDATION_ERROR | 郵便番号の形式が正しくありません | postalCode が 7 桁の数字以外 |
| 422 | VALIDATION_ERROR | 職歴を1件以上入力してください | workHistories が空配列 |
| 422 | VALIDATION_ERROR | 会社名は必須項目です | workHistories[n].company が未入力 |
| 422 | VALIDATION_ERROR | 在籍開始月は必須項目です | workHistories[n].startMonth が未入力 |
| 422 | VALIDATION_ERROR | 役職は必須項目です | workHistories[n].role が未入力 |
| 422 | VALIDATION_ERROR | 資格名は必須項目です | qualifications[n].value が空文字 |
| 500 | INTERNAL_SERVER_ERROR | 予期せぬエラーが発生しました | サーバーエラー |

## 処理フロー

1. JWT を検証し、未認証の場合は 401 を返す
2. リクエストボディを JSON としてパースする。失敗時は 400 を返す
3. `userProfileEditSchema`（`shared/schemas/user.ts`）でバリデーションを実行する。失敗時は 422 を返す
4. パスパラメータ `id` でユーザーを検索する。存在しない・削除済みの場合は 404 を返す
5. 更新後の email が他ユーザーと重複する場合は 409 を返す
6. トランザクションを開始する
   a. `users` テーブルの email を更新する
   b. profileImage が指定されている場合は base64 デコードしてストレージに保存し、URL を更新する。null の場合は既存画像を削除する
   c. `user_profiles` テーブルを更新する（name, birthDate, gender, profileImageUrl, phone, postalCode, prefecture, city, streetAddress, building, selfPR, updatedAt）
   d. `user_work_types` テーブルを既存レコードを削除して再挿入する
   e. `user_qualifications` テーブルを既存レコードを削除して再挿入する
   f. `user_work_histories` テーブルを既存レコードを削除して再挿入する
7. トランザクションをコミットする
8. 更新後のプロフィール情報を 200 で返す

## 使用するスキーマ

- `shared/schemas/user.ts` の `userProfileEditSchema`

## 備考

- profileImage は base64 エンコードされた data URI 形式（例: `data:image/jpeg;base64,...`）で送信する
- profileImage に `null` を指定すると既存の画像を削除する
- workTypes / qualifications / workHistories は全件洗い替えで更新する