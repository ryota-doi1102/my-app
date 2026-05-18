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
| phone | string \| null | - | 10〜11桁の数字のみ（null で削除） | 電話番号（ハイフンなし） |
| email | string | ✓ | メールアドレス形式 | メールアドレス |
| postalCode | string \| null | - | 7桁の数字のみ（null で削除） | 郵便番号（ハイフンなし） |
| prefecture | string \| null | - | null で削除 | 都道府県 |
| city | string \| null | - | null で削除 | 市区町村 |
| streetAddress | string \| null | - | null で削除 | 番地 |
| building | string \| null | - | null で削除 | 建物名・部屋番号 |
| workTypes | string[] | - | 各要素が `フルタイム` / `パートタイム` / `リモート` / `フリーランス` のいずれか | 希望勤務形態（`[]` で全削除） |
| qualifications | `{ value: string }[]` | - | 各要素の value が1文字以上 | 資格リスト（`[]` で全削除） |
| workHistories | WorkHistory[] | ✓ | 1件以上 | 職歴リスト |
| selfPR | string \| null | - | null で削除 | 自己PR |

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
| 204 | 更新成功（レスポンスボディなし） |

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
| 422 | VALIDATION_ERROR | 電話番号にハイフンは使用できません（例: 09012345678） | phone にハイフンが含まれる |
| 422 | VALIDATION_ERROR | 電話番号は半角数字で入力してください | phone に数字以外が含まれる |
| 422 | VALIDATION_ERROR | 電話番号は10〜11桁で入力してください | phone が 10〜11 桁以外 |
| 422 | VALIDATION_ERROR | メールアドレスは必須項目です | email が未入力 |
| 422 | VALIDATION_ERROR | メールアドレスはメールアドレス形式で入力してください | email の形式が不正 |
| 422 | VALIDATION_ERROR | 郵便番号にハイフンは使用できません（例: 1234567） | postalCode にハイフンが含まれる |
| 422 | VALIDATION_ERROR | 郵便番号は半角数字で入力してください | postalCode に数字以外が含まれる |
| 422 | VALIDATION_ERROR | 郵便番号は7桁で入力してください | postalCode が 7 桁以外 |
| 422 | VALIDATION_ERROR | 職歴を1件以上入力してください | workHistories が空配列 |
| 422 | VALIDATION_ERROR | 会社名は必須項目です | workHistories[n].company が未入力 |
| 422 | VALIDATION_ERROR | 在籍開始月は必須項目です | workHistories[n].startMonth が未入力 |
| 422 | VALIDATION_ERROR | 役職は必須項目です | workHistories[n].role が未入力 |
| 422 | VALIDATION_ERROR | 資格名は必須項目です | qualifications[n].value が空文字 |
| 500 | INTERNAL_SERVER_ERROR | 予期せぬエラーが発生しました | サーバーエラー |

## 処理フロー

| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-USER-04-F01 | ユーザープロフィール更新処理開始 | - | - | - | `[API-USER-04-F01] ユーザープロフィール更新処理開始` |
| API-USER-04-F02 | JWT 検証：未認証の場合は即時エラーを返す | 401 | `UNAUTHORIZED` | `認証が必要です` | `[API-USER-04-F02] JWT検証失敗: ${error.message}` |
| API-USER-04-F03 | リクエストボディを JSON としてパースする | 400 | `BAD_REQUEST` | `リクエストの形式が正しくありません` | `[API-USER-04-F03] JSONパース失敗: ${error.message}` |
| API-USER-04-F04 | `userProfileEditBackendSchema` でバリデーションを実行する | 422 | `VALIDATION_ERROR` | （各バリデーションエラーメッセージ） | `[API-USER-04-F04] バリデーション失敗: ${error.message}` |
| API-USER-04-F05 | パスパラメータ `id` でユーザーを検索し、存在しない・削除済みの場合は 404 を返す | 404 | `NOT_FOUND` | `ユーザーが見つかりません` | `[API-USER-04-F05] ユーザー未検出: id=${id}` |
| API-USER-04-F06 | 更新後の email が他ユーザーと重複する場合は 409 を返す | 409 | `CONFLICT` | `メールアドレスが既に登録されています` | `[API-USER-04-F06] メールアドレス重複: email=${email}` |
| API-USER-04-F07 | トランザクション内で `users` / `user_profiles` / `user_work_types` / `user_qualifications` / `user_work_histories` テーブルを更新する（関連テーブルは洗い替え） | 500 | `INTERNAL_SERVER_ERROR` | `予期せぬエラーが発生しました` | `[API-USER-04-F07] DB更新失敗: ${error.message}` |
| API-USER-04-F08 | 204 を返す | 204 | - | - | `[API-USER-04-F08] ユーザープロフィール更新完了: userId=${id}` |

## 使用するスキーマ

- `backend/src/schemas/user.ts` の `userProfileEditBackendSchema`（`shared/schemas/user.ts` の `userProfileEditSchema` を拡張し、`profileImage` を base64 文字列のみ受け付けるよう上書きしたもの）

## 備考

- profileImage は base64 エンコードされた data URI 形式（例: `data:image/jpeg;base64,...`）で送信する
- profileImage に `null` を指定すると既存の画像を削除する。省略（未指定）した場合は既存の画像を保持する
- `null` を指定するとそのフィールドを DB 上で NULL に更新する（対象: phone / postalCode / prefecture / city / streetAddress / building / selfPR）。省略した場合は既存値を保持する
- workTypes / qualifications / workHistories は全件洗い替えで更新する。空配列 `[]` を指定すると全件削除となる