# テスト仕様書 - API-USER-02 ユーザープロフィール作成

## 対象API

| 項目 | 内容 |
|---|---|
| ID | API-USER-02 |
| メソッド | PUT |
| パス | /api/v1/users |
| 認証 | 不要 |
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
| TC-314 | `profileImage` を省略する | 204（画像なしで登録される） |
| TC-315 | `profileImage` に `null` を明示的に指定する | 204（画像なしで登録される。削除ボタン押下時と同等） |
| TC-316 | `profileImage` に空文字 `""` を指定する | 204（空文字は falsy のためバリデーションをスキップ） |
| TC-317 | `profileImage` に非対応MIMEタイプ（例: `data:image/gif;base64,...`）を指定する | 422 / VALIDATION_ERROR / 対応していないファイル形式です |
| TC-318 | `profileImage` に有効な JPEG の base64 文字列（`data:image/jpeg;base64,...` 形式）を指定する | 204 |
| TC-319 | `profileImage` に5MBを超えるbase64エンコード済み画像を指定する | 422 / VALIDATION_ERROR / ファイルサイズが上限を超えています |

#### phone（電話番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-320 | `phone` を省略する | 204（undefined は DB に NULL で保存される） |
| TC-321 | `phone` に `null` を指定する | 204（DB に NULL で保存される） |
| TC-322 | `phone` に空文字 `""` を指定する | 204（空文字は regex を通過し、サービス層で null に変換される） |
| TC-323 | `phone` に9桁の数字（例: `"090123456"`）を指定する | 422 / VALIDATION_ERROR / 電話番号は10〜11桁で入力してください |
| TC-324 | `phone` に12桁の数字（例: `"090123456789"`）を指定する | 422 / VALIDATION_ERROR / 電話番号は10〜11桁で入力してください |

#### email（メールアドレス）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-325 | `email` を省略する | 422 / VALIDATION_ERROR / メールアドレスは必須項目です |
| TC-326 | `email` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-327 | `email` に空文字 `""` を指定する | 422 / VALIDATION_ERROR / メールアドレスは必須項目です |
| TC-328 | `email` にメール形式でない文字列（例: `"not-an-email"`）を指定する | 422 / VALIDATION_ERROR / メールアドレスはメールアドレス形式で入力してください |

#### password（パスワード）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-329 | `password` を省略する | 422 / VALIDATION_ERROR / パスワードは必須項目です |
| TC-330 | `password` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-331 | `password` に空文字 `""` を指定する | 422 / VALIDATION_ERROR / パスワードは必須項目です |
| TC-332 | `password` に7文字の文字列（例: `"pass123"`）を指定する | 422 / VALIDATION_ERROR / パスワードは8文字以上で入力してください |
| TC-332a | `password` に大文字を含まない文字列（例: `"password1"`）を指定する | 422 / VALIDATION_ERROR / パスワードには大文字の英字を1文字以上含めてください |
| TC-332b | `password` に小文字を含まない文字列（例: `"PASSWORD1"`）を指定する | 422 / VALIDATION_ERROR / パスワードには小文字の英字を1文字以上含めてください |
| TC-332c | `password` に数字を含まない文字列（例: `"Passworddd"`）を指定する | 422 / VALIDATION_ERROR / パスワードには数字を1文字以上含めてください |

#### postalCode（郵便番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-333 | `postalCode` を省略する | 204（undefined は DB に NULL で保存される） |
| TC-334 | `postalCode` に `null` を指定する | 204（DB に NULL で保存される） |
| TC-335 | `postalCode` に空文字 `""` を指定する | 204（空文字は regex を通過し、サービス層で null に変換される） |
| TC-336 | `postalCode` に6桁の数字（例: `"123456"`）を指定する | 422 / VALIDATION_ERROR / 郵便番号は7桁で入力してください |

#### prefecture（都道府県）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-337 | `prefecture` を省略する | 204（undefined は DB に NULL で保存される） |
| TC-338 | `prefecture` に `null` を指定する | 204（DB に NULL で保存される） |
| TC-339 | `prefecture` に空文字 `""` を指定する | 204（min(1) なし・サービス層で null に変換される） |

#### city（市区町村）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-340 | `city` を省略する | 204（undefined は DB に NULL で保存される） |
| TC-341 | `city` に `null` を指定する | 204（DB に NULL で保存される） |
| TC-342 | `city` に空文字 `""` を指定する | 204（min(1) なし・サービス層で null に変換される） |

#### streetAddress（番地）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-343 | `streetAddress` を省略する | 204（undefined は DB に NULL で保存される） |
| TC-344 | `streetAddress` に `null` を指定する | 204（DB に NULL で保存される） |
| TC-345 | `streetAddress` に空文字 `""` を指定する | 204（min(1) なし・サービス層で null に変換される） |

#### building（建物名・部屋番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-346 | `building` を省略する | 204（undefined は DB に NULL で保存される） |
| TC-347 | `building` に `null` を指定する | 204（DB に NULL で保存される） |
| TC-348 | `building` に空文字 `""` を指定する | 204（min(1) なし・サービス層で null に変換される） |

#### selfPR（自己PR）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-349 | `selfPR` を省略する | 204（undefined は DB に NULL で保存される） |
| TC-350 | `selfPR` に `null` を指定する | 204（DB に NULL で保存される） |
| TC-351 | `selfPR` に空文字 `""` を指定する | 204（min(1) なし・サービス層で null に変換される） |

#### workTypes（希望勤務形態）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-352 | `workTypes` を省略する | 204 |
| TC-353 | `workTypes` に `null` を指定する | 204 |
| TC-354 | `workTypes` に空配列 `[]` を指定する | 204 |

#### qualifications（資格）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-355 | `qualifications` を省略する | 204 |
| TC-356 | `qualifications` に `null` を指定する | 204 |
| TC-357 | `qualifications` に空配列 `[]` を指定する | 204 |
| TC-358 | `qualifications[0].value` に空文字を指定する | 422 / VALIDATION_ERROR / 資格名は必須項目です |

#### workHistories（職歴）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-359 | `workHistories` を省略する | 422 / VALIDATION_ERROR / 職歴を1件以上入力してください |
| TC-360 | `workHistories` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-361 | `workHistories` に空配列 `[]` を指定する | 422 / VALIDATION_ERROR / 職歴を1件以上入力してください |
| TC-362 | `workHistories[0].company` を省略する | 422 / VALIDATION_ERROR / 会社名は必須項目です |
| TC-363 | `workHistories[0].company` に空文字を指定する | 422 / VALIDATION_ERROR / 会社名は必須項目です |
| TC-364 | `workHistories[0].startMonth` を省略する | 422 / VALIDATION_ERROR / 在籍開始月は必須項目です |
| TC-365 | `workHistories[0].startMonth` に `"2020/04"` など `YYYY-MM` 以外の形式を指定する | 422 / VALIDATION_ERROR / 在籍開始月はYYYY-MM形式で入力してください |
| TC-366 | `workHistories[0].role` を省略する | 422 / VALIDATION_ERROR / 役職は必須項目です |
| TC-367 | `workHistories[0].role` に空文字を指定する | 422 / VALIDATION_ERROR / 役職は必須項目です |
| TC-368 | `workHistories[0].endMonth` に `null` を指定する（現職を表す） | 204 |
| TC-369 | `workHistories[0].endMonth` を省略する | 204 |
| TC-370 | `workHistories[0].endMonth` に `"2024/03"` など `YYYY-MM` 以外の形式を指定する | 422 / VALIDATION_ERROR / 在籍終了月はYYYY-MM形式で入力してください |

#### agreedToTerms（利用規約同意）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-371 | `agreedToTerms` を省略する | 422 / VALIDATION_ERROR / 利用規約・プライバシーポリシーへの同意が必要です |
| TC-372 | `agreedToTerms` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-373 | `agreedToTerms` に `false` を指定する | 422 / VALIDATION_ERROR / 利用規約・プライバシーポリシーへの同意が必要です |

#### リクエストボディ全体

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-374 | リクエストボディを送信しない（空リクエスト） | 400 / BAD_REQUEST / リクエストの形式が正しくありません |
| TC-375 | Content-Typeが `application/json` でないリクエストを送信する | 400 / BAD_REQUEST / リクエストの形式が正しくありません |

---

### 分岐処理（400〜499）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-401 | 必須項目のみを含む最小有効なリクエストを送信する（任意項目はすべて省略） | 204 No Content |
| TC-402 | すべての項目（任意項目含む）を含む完全なリクエストを送信する | 204 No Content |
| TC-403 | `phone` にハイフンを含む文字列（例: `"090-1234-5678"`）を指定する | 422 / VALIDATION_ERROR / 電話番号にハイフンは使用できません（例: 09012345678） |
| TC-404 | `postalCode` にハイフンを含む文字列（例: `"123-4567"`）を指定する | 422 / VALIDATION_ERROR / 郵便番号にハイフンは使用できません（例: 1234567） |
| TC-405 | `workTypes` に複数の有効な値（例: `["フルタイム", "リモート"]`）を指定する | 204 No Content |
| TC-406 | `workTypes` に全4種類の値を指定する | 204 No Content |
| TC-407 | `workHistories` に複数件指定する | 204 No Content |
| TC-408 | `qualifications` に複数件指定する | 204 No Content |
| TC-409 | 既に登録済みのメールアドレスで登録しようとする | 409 / CONFLICT / メールアドレスが既に登録されています |
| TC-410 | 任意項目（`phone` / `postalCode` / `prefecture` / `city` / `streetAddress` / `building` / `selfPR`）にすべて `null` を指定する | 204 No Content（各フィールドが DB 上で NULL として保存される） |

---

### エラー（500〜599）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-501 | DB接続失敗時（usersテーブルへのinsert失敗）にリクエストを送信する | 500 / INTERNAL_SERVER_ERROR（メッセージは実行環境依存のため検証しない） |
| TC-502 | トランザクション内でDBエラーが発生した場合にリクエストを送信する | 500 / INTERNAL_SERVER_ERROR / 予期せぬエラーが発生しました |
| TC-503 | `NODE_ENV=production` 時に500エラーが発生した場合、スタックトレースがレスポンスに含まれないことを確認する | 500 / INTERNAL_SERVER_ERROR / `stack` キーが存在しない |
