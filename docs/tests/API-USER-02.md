# テスト仕様書 - API-USER-02 ユーザープロフィール作成

## 対象API

| 項目 | 内容 |
|---|---|
| ID | API-USER-02 |
| メソッド | PUT |
| パス | /api/v1/users |
| 認証 | JWT必須 |
| 成功時レスポンス | 204 No Content（レスポンスボディなし） |

## テストケース一覧

### 認証系（001〜099）

このAPIは認証不要のため、該当するテストケースはない。

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-001 | Authorizationヘッダーなしで最小有効なリクエストを送信する | 204 No Content |
| TC-002 | 不正な形式のトークン（`Bearer invalid_token`）を付与してリクエストを送信する | 204 No Content（トークンは無視される） |

---

### リクエストチェック（クエリ）（100〜199）

このAPIにはクエリパラメータが存在しないため、該当するテストケースはない。

---

### リクエストチェック（パラム）（200〜299）

このAPIにはURLパスパラメータが存在しないため、該当するテストケースはない。

---

### リクエストチェック（ボディ）（300〜399）

#### name（氏名）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-301 | `name` を省略する | 422 / VALIDATION_ERROR / 氏名は必須項目です |
| TC-302 | `name` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-303 | `name` に空文字 `""` を指定する | 422 / VALIDATION_ERROR / 氏名は必須項目です |

#### birthDate（生年月日）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-304 | `birthDate` を省略する | 422 / VALIDATION_ERROR / 生年月日は必須項目です |
| TC-305 | `birthDate` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-306 | `birthDate` に空文字 `""` を指定する | 422 / VALIDATION_ERROR / 生年月日は必須項目です |
| TC-307 | `birthDate` に `"2000/01/01"` など `YYYY-MM-DD` 以外の形式を指定する | 422 / VALIDATION_ERROR / 生年月日はYYYY-MM-DD形式で入力してください |
| TC-308 | `birthDate` に今日から18歳未満の日付（例: 本日-17年）を指定する | 422 / VALIDATION_ERROR / 18歳未満の方は登録できません |
| TC-309 | `birthDate` に今日からちょうど60歳の日付を指定する | 422 / VALIDATION_ERROR / 60歳以上の方は登録できません |

#### gender（性別）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-310 | `gender` を省略する | 422 / VALIDATION_ERROR / 性別は必須項目です |
| TC-311 | `gender` に `null` を指定する | 422 / VALIDATION_ERROR / 性別は必須項目です |
| TC-312 | `gender` に空文字 `""` を指定する | 422 / VALIDATION_ERROR / 性別の形式が正しくありません |
| TC-313 | `gender` に許可値以外（例: `"unknown"`）を指定する | 422 / VALIDATION_ERROR / 性別の形式が正しくありません |

#### profileImage（プロフィール画像）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-314 | `profileImage` を省略する | 204 |
| TC-315 | `profileImage` に `null` を明示的に指定する | 204 |
| TC-316 | `profileImage` に空文字 `""` を指定する | 204（`!val` が truthy のためバリデーションをスキップ） |
| TC-317 | `profileImage` に非対応MIMEタイプ（例: `data:image/gif;base64,...`）を指定する | 422 / VALIDATION_ERROR / 対応していないファイル形式です |
| TC-318 | `profileImage` に5MBを超えるbase64エンコード済み画像を指定する | 422 / VALIDATION_ERROR / ファイルサイズが上限を超えています |

#### phone（電話番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-319 | `phone` を省略する | 204 |
| TC-320 | `phone` に `null` を指定する | 422 / VALIDATION_ERROR（`.nullable()` なしのため） |
| TC-321 | `phone` に空文字 `""` を指定する | 204（`!val` が truthy のためバリデーションをスキップ） |
| TC-322 | `phone` に9桁の数字（例: `"090123456"`）を指定する | 422 / VALIDATION_ERROR / 電話番号の形式が正しくありません |
| TC-323 | `phone` に12桁の数字（例: `"090123456789"`）を指定する | 422 / VALIDATION_ERROR / 電話番号の形式が正しくありません |

#### email（メールアドレス）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-324 | `email` を省略する | 422 / VALIDATION_ERROR / メールアドレスは必須項目です |
| TC-325 | `email` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-326 | `email` に空文字 `""` を指定する | 422 / VALIDATION_ERROR / メールアドレスは必須項目です |
| TC-327 | `email` にメール形式でない文字列（例: `"not-an-email"`）を指定する | 422 / VALIDATION_ERROR / メールアドレスはメールアドレス形式で入力してください |

#### password（パスワード）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-328 | `password` を省略する | 422 / VALIDATION_ERROR / パスワードは必須項目です |
| TC-329 | `password` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-330 | `password` に空文字 `""` を指定する | 422 / VALIDATION_ERROR / パスワードは必須項目です |
| TC-331 | `password` に7文字の文字列（例: `"pass123"`）を指定する | 422 / VALIDATION_ERROR / パスワードは8文字以上で入力してください |

#### postalCode（郵便番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-332 | `postalCode` を省略する | 204 |
| TC-333 | `postalCode` に `null` を指定する | 422 / VALIDATION_ERROR（`.nullable()` なしのため） |
| TC-334 | `postalCode` に空文字 `""` を指定する | 204（`!val` が truthy のためバリデーションをスキップ） |
| TC-335 | `postalCode` に6桁の数字（例: `"123456"`）を指定する | 422 / VALIDATION_ERROR / 郵便番号の形式が正しくありません |

#### prefecture（都道府県）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-336 | `prefecture` を省略する | 204 |
| TC-337 | `prefecture` に `null` を指定する | 422 / VALIDATION_ERROR（`.nullable()` なしのため） |
| TC-338 | `prefecture` に空文字 `""` を指定する | 204（`z.string().optional()` は min(1) なしのため） |

#### city（市区町村）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-339 | `city` を省略する | 204 |
| TC-340 | `city` に `null` を指定する | 422 / VALIDATION_ERROR（`.nullable()` なしのため） |
| TC-341 | `city` に空文字 `""` を指定する | 204（`z.string().optional()` は min(1) なしのため） |

#### streetAddress（番地）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-342 | `streetAddress` を省略する | 204 |
| TC-343 | `streetAddress` に `null` を指定する | 422 / VALIDATION_ERROR（`.nullable()` なしのため） |
| TC-344 | `streetAddress` に空文字 `""` を指定する | 204（`z.string().optional()` は min(1) なしのため） |

#### building（建物名・部屋番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-345 | `building` を省略する | 204 |
| TC-346 | `building` に `null` を指定する | 422 / VALIDATION_ERROR（`.nullable()` なしのため） |
| TC-347 | `building` に空文字 `""` を指定する | 204（`z.string().optional()` は min(1) なしのため） |

#### selfPR（自己PR）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-348 | `selfPR` を省略する | 204 |
| TC-349 | `selfPR` に `null` を指定する | 422 / VALIDATION_ERROR（`.nullable()` なしのため） |
| TC-350 | `selfPR` に空文字 `""` を指定する | 204（`z.string().optional()` は min(1) なしのため） |

#### workTypes（希望勤務形態）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-351 | `workTypes` を省略する | 204 |
| TC-352 | `workTypes` に `null` を指定する | 422 / VALIDATION_ERROR（`.nullable()` なしのため） |
| TC-353 | `workTypes` に空配列 `[]` を指定する | 204 |

#### qualifications（資格）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-354 | `qualifications` を省略する | 204 |
| TC-355 | `qualifications` に `null` を指定する | 422 / VALIDATION_ERROR（`.nullable()` なしのため） |
| TC-356 | `qualifications` に空配列 `[]` を指定する | 204 |
| TC-357 | `qualifications[0].value` に空文字を指定する | 422 / VALIDATION_ERROR / 資格名は必須項目です |

#### workHistories（職歴）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-358 | `workHistories` を省略する | 422 / VALIDATION_ERROR / 職歴を1件以上入力してください |
| TC-359 | `workHistories` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-360 | `workHistories` に空配列 `[]` を指定する | 422 / VALIDATION_ERROR / 職歴を1件以上入力してください |
| TC-361 | `workHistories[0].company` を省略する | 422 / VALIDATION_ERROR / 会社名は必須項目です |
| TC-362 | `workHistories[0].company` に空文字を指定する | 422 / VALIDATION_ERROR / 会社名は必須項目です |
| TC-363 | `workHistories[0].startMonth` を省略する | 422 / VALIDATION_ERROR / 在籍開始月は必須項目です |
| TC-364 | `workHistories[0].role` を省略する | 422 / VALIDATION_ERROR / 役職は必須項目です |
| TC-365 | `workHistories[0].role` に空文字を指定する | 422 / VALIDATION_ERROR / 役職は必須項目です |
| TC-366 | `workHistories[0].endMonth` に `null` を指定する（現職を表す） | 204 |
| TC-367 | `workHistories[0].endMonth` を省略する | 204 |

#### agreedToTerms（利用規約同意）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-368 | `agreedToTerms` を省略する | 422 / VALIDATION_ERROR / 利用規約・プライバシーポリシーへの同意が必要です |
| TC-369 | `agreedToTerms` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-370 | `agreedToTerms` に `false` を指定する | 422 / VALIDATION_ERROR / 利用規約・プライバシーポリシーへの同意が必要です |

#### リクエストボディ全体

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-371 | リクエストボディを送信しない（空リクエスト） | 400 / BAD_REQUEST / リクエストの形式が正しくありません |
| TC-372 | Content-Typeが `application/json` でないリクエストを送信する | 400 / BAD_REQUEST / リクエストの形式が正しくありません |

---

### 分岐処理（400〜499）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-401 | 必須項目のみを含む最小有効なリクエストを送信する（任意項目はすべて省略） | 204 No Content |
| TC-402 | すべての項目（任意項目含む）を含む完全なリクエストを送信する | 204 No Content |
| TC-403 | `phone` にハイフンを含む文字列（例: `"090-1234-5678"`）を指定する | 422 / VALIDATION_ERROR / 電話番号の形式が正しくありません |
| TC-404 | `postalCode` にハイフンを含む文字列（例: `"123-4567"`）を指定する | 422 / VALIDATION_ERROR / 郵便番号の形式が正しくありません |
| TC-405 | `workTypes` に複数の有効な値（例: `["フルタイム", "リモート"]`）を指定する | 204 No Content |
| TC-406 | `workTypes` に全4種類の値を指定する | 204 No Content |
| TC-407 | `workHistories` に複数件指定する | 204 No Content |
| TC-408 | `qualifications` に複数件指定する | 204 No Content |
| TC-409 | 既に登録済みのメールアドレスで登録しようとする | 409 / CONFLICT / メールアドレスが既に登録されています |

---

### エラー（500〜599）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-501 | DB接続失敗時（usersテーブルへのinsert失敗）にリクエストを送信する | 500 / INTERNAL_SERVER_ERROR / 予期せぬエラーが発生しました |
| TC-502 | トランザクション内でDBエラーが発生した場合、ロールバックされることを確認する | 500 / INTERNAL_SERVER_ERROR / usersテーブルにレコードが残っていない |
| TC-503 | `NODE_ENV=production` 時に500エラーが発生した場合、スタックトレースがレスポンスに含まれないことを確認する | 500 / INTERNAL_SERVER_ERROR / `stack` キーが存在しない |
