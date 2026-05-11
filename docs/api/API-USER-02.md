# ユーザープロフィール作成

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-USER-02 |
| メソッド | PUT |
| パス | /api/v1/users |
| 認証 | 不要 |
| Content-Type | application/json |
| 概要 | 新規ユーザーアカウントとプロフィールを作成する |

## リクエスト

### リクエストボディ

| フィールド名 | 型 | 必須 | バリデーション | 説明 |
|---|---|---|---|---|
| name | string | ✓ | 1文字以上 | 氏名 |
| birthDate | string | ✓ | YYYY-MM-DD形式・18歳以上・60歳未満 | 生年月日 |
| gender | string | ✓ | `男性` / `女性` / `その他` のいずれか | 性別 |
| profileImage | string \| null | - | base64エンコード文字列（data URI形式）・JPEG / PNG / WebP・5MB以下 | プロフィール画像 |
| phone | string | - | 10〜11桁の数字のみ | 電話番号（ハイフンなし） |
| email | string | ✓ | メールアドレス形式 | メールアドレス |
| password | string | ✓ | 8文字以上 | パスワード |
| postalCode | string | - | 7桁の数字のみ | 郵便番号（ハイフンなし） |
| prefecture | string | - | - | 都道府県 |
| city | string | - | - | 市区町村 |
| streetAddress | string | - | - | 番地 |
| building | string | - | - | 建物名・部屋番号 |
| workTypes | string[] | - | 各要素が `フルタイム` / `パートタイム` / `リモート` / `フリーランス` のいずれか | 希望勤務形態 |
| qualifications | `{ value: string }[]` | - | 各要素の value が1文字以上 | 資格リスト |
| workHistories | WorkHistory[] | ✓ | 1件以上 | 職歴リスト |
| selfPR | string | - | - | 自己PR |
| agreedToTerms | boolean | ✓ | `true` のみ許可 | 利用規約・プライバシーポリシーへの同意 |

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
  "password": "password123",
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
  "selfPR": "自己PRテキスト",
  "agreedToTerms": true
}
```

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 204 | 作成成功（レスポンスボディなし） |

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生するエラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|---|
| 400 | BAD_REQUEST | リクエストの形式が正しくありません | JSON のパース失敗・必須パラメータ欠落 |
| 409 | CONFLICT | メールアドレスが既に登録されています | メールアドレスの重複 |
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
| 422 | VALIDATION_ERROR | パスワードは必須項目です | password が未入力 |
| 422 | VALIDATION_ERROR | パスワードは8文字以上で入力してください | password が 8 文字未満 |
| 422 | VALIDATION_ERROR | 郵便番号の形式が正しくありません | postalCode が 7 桁の数字以外 |
| 422 | VALIDATION_ERROR | 職歴を1件以上入力してください | workHistories が空配列 |
| 422 | VALIDATION_ERROR | 会社名は必須項目です | workHistories[n].company が未入力 |
| 422 | VALIDATION_ERROR | 在籍開始月は必須項目です | workHistories[n].startMonth が未入力 |
| 422 | VALIDATION_ERROR | 役職は必須項目です | workHistories[n].role が未入力 |
| 422 | VALIDATION_ERROR | 資格名は必須項目です | qualifications[n].value が空文字 |
| 422 | VALIDATION_ERROR | 利用規約・プライバシーポリシーへの同意が必要です | agreedToTerms が false |
| 500 | INTERNAL_SERVER_ERROR | 予期せぬエラーが発生しました | サーバーエラー |

## 処理フロー

1. リクエストボディを JSON としてパースする。失敗時は 400 を返す
2. `userProfileCreateBackendSchema`（`backend/src/schemas/user.ts`）でバリデーションを実行する。失敗時は 422 を返す
3. email の重複を `users` テーブルで確認する。既存の場合は 409 を返す
4. password をハッシュ化（bcrypt）する
5. トランザクションを開始する
   a. `users` テーブルにレコードを挿入する（email, passwordHash）
   b. profileImage が指定されている場合は base64 デコードしてローカルストレージに保存し、URL を取得する
   c. `user_profiles` テーブルにレコードを挿入する（userId, name, birthDate, gender, profileImageUrl, phone, postalCode, prefecture, city, streetAddress, building, selfPR）
   d. `user_work_types` テーブルに workTypes を挿入する（workTypes が指定されている場合）
   e. `user_qualifications` テーブルに qualifications を挿入する（qualifications が指定されている場合）
   f. `user_work_histories` テーブルに workHistories を挿入する
6. トランザクションをコミットする
7. 204 を返す

## 使用するスキーマ

- `backend/src/schemas/user.ts` の `userProfileCreateBackendSchema`（`shared/schemas/user.ts` の `userProfileCreateSchema` を拡張し、`profileImage` を base64 文字列のみ受け付けるよう上書きしたもの）

## 備考

- profileImage は base64 エンコードされた data URI 形式（例: `data:image/jpeg;base64,...`）で送信する
- agreedToTerms はサーバー側でも `true` であることを検証する
