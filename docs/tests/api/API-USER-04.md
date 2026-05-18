# テスト仕様書 - API-USER-04 ユーザープロフィール更新

## 対象API

| 項目 | 内容 |
|---|---|
| ID | API-USER-04 |
| メソッド | PUT |
| パス | /api/v1/users/:id |
| 認証 | JWT必須 |
| 成功時レスポンス | 204 No Content（レスポンスボディなし） |

## テストケース一覧

### 認証系（001〜099）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-001 | Authorizationヘッダーなしで最小有効なリクエストを送信する | 401 / UNAUTHORIZED / 認証が必要です |
| TC-002 | 不正な形式のトークン（`Bearer invalid_token`）を付与してリクエストを送信する | 401 / UNAUTHORIZED / トークンが無効です |
| TC-003 | 期限切れのトークンを付与してリクエストを送信する | 401 / UNAUTHORIZED / トークンが無効です |

---

### リクエストチェック（クエリ）（100〜199）

このAPIにはクエリパラメータが存在しないため、該当するテストケースはない。

---

### リクエストチェック（パラム）（200〜299）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-201 | `id` に UUID 形式でない文字列（例: `"abc"`）を指定する | 404 / NOT_FOUND / ユーザーが見つかりません |
| TC-202 | `id` に存在しないユーザーの UUID を指定する | 404 / NOT_FOUND / ユーザーが見つかりません |
| TC-203 | `id` に論理削除済みユーザーの UUID を指定する | 404 / NOT_FOUND / ユーザーが見つかりません |

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
| TC-314 | `profileImage` を省略する | 204（既存画像を保持する） |
| TC-315 | `profileImage` に `null` を明示的に指定する | 204（既存画像を削除する。削除ボタン押下時と同等） |
| TC-316 | `profileImage` に空文字 `""` を指定する | 204（空文字は falsy のためバリデーションをスキップ） |
| TC-317 | `profileImage` に非対応 MIME タイプの base64 文字列（例: `data:image/gif;base64,...`）を指定する | 422 / VALIDATION_ERROR / 対応していないファイル形式です |
| TC-318 | `profileImage` に有効な JPEG の base64 文字列（`data:image/jpeg;base64,...` 形式）を指定する | 204 |
| TC-319 | `profileImage` に5MBを超えるbase64エンコード済み画像を指定する | 422 / VALIDATION_ERROR / ファイルサイズが上限を超えています |

#### phone（電話番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-320 | `phone` を省略する | 204（undefined は null に変換されて DB に保存される） |
| TC-321 | `phone` に `null` を指定する | 204（null で電話番号をクリアする） |
| TC-322 | `phone` に空文字 `""` を指定する | 204（空文字は null に変換されて DB に保存される） |
| TC-323 | `phone` に9桁の数字（例: `"090123456"`）を指定する | 422 / VALIDATION_ERROR / 電話番号は10〜11桁で入力してください |
| TC-324 | `phone` に12桁の数字（例: `"090123456789"`）を指定する | 422 / VALIDATION_ERROR / 電話番号は10〜11桁で入力してください |

#### email（メールアドレス）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-325 | `email` を省略する | 422 / VALIDATION_ERROR / メールアドレスは必須項目です |
| TC-326 | `email` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-327 | `email` に空文字 `""` を指定する | 422 / VALIDATION_ERROR / メールアドレスは必須項目です |
| TC-328 | `email` にメール形式でない文字列（例: `"not-an-email"`）を指定する | 422 / VALIDATION_ERROR / メールアドレスはメールアドレス形式で入力してください |

#### postalCode（郵便番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-329 | `postalCode` を省略する | 204（undefined は null に変換されて DB に保存される） |
| TC-330 | `postalCode` に `null` を指定する | 204（null で郵便番号をクリアする） |
| TC-331 | `postalCode` に空文字 `""` を指定する | 204（空文字は null に変換されて DB に保存される） |
| TC-332 | `postalCode` に6桁の数字（例: `"123456"`）を指定する | 422 / VALIDATION_ERROR / 郵便番号は7桁で入力してください |

#### prefecture（都道府県）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-333 | `prefecture` を省略する | 204（undefined は null に変換されて DB に保存される） |
| TC-334 | `prefecture` に `null` を指定する | 204（null で都道府県をクリアする） |
| TC-335 | `prefecture` に空文字 `""` を指定する | 204（空文字は null に変換されて DB に保存される） |

#### city（市区町村）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-336 | `city` を省略する | 204（undefined は null に変換されて DB に保存される） |
| TC-337 | `city` に `null` を指定する | 204（null で市区町村をクリアする） |
| TC-338 | `city` に空文字 `""` を指定する | 204（空文字は null に変換されて DB に保存される） |

#### streetAddress（番地）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-339 | `streetAddress` を省略する | 204（undefined は null に変換されて DB に保存される） |
| TC-340 | `streetAddress` に `null` を指定する | 204（null で番地をクリアする） |
| TC-341 | `streetAddress` に空文字 `""` を指定する | 204（空文字は null に変換されて DB に保存される） |

#### building（建物名・部屋番号）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-342 | `building` を省略する | 204（undefined は null に変換されて DB に保存される） |
| TC-343 | `building` に `null` を指定する | 204（null で建物名・部屋番号をクリアする） |
| TC-344 | `building` に空文字 `""` を指定する | 204（空文字は null に変換されて DB に保存される） |

#### selfPR（自己PR）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-345 | `selfPR` を省略する | 204（undefined は null に変換されて DB に保存される） |
| TC-346 | `selfPR` に `null` を指定する | 204（null で自己PRをクリアする） |
| TC-347 | `selfPR` に空文字 `""` を指定する | 204（空文字は null に変換されて DB に保存される） |

#### workTypes（希望勤務形態）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-348 | `workTypes` を省略する | 204（全件削除される） |
| TC-349 | `workTypes` に `null` を指定する | 204（全件削除される） |
| TC-350 | `workTypes` に空配列 `[]` を指定する | 204（全件削除される） |

#### qualifications（資格）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-351 | `qualifications` を省略する | 204（全件削除される） |
| TC-352 | `qualifications` に `null` を指定する | 204（全件削除される） |
| TC-353 | `qualifications` に空配列 `[]` を指定する | 204（全件削除される） |
| TC-354 | `qualifications[0].value` に空文字を指定する | 422 / VALIDATION_ERROR / 資格名は必須項目です |

#### workHistories（職歴）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-355 | `workHistories` を省略する | 422 / VALIDATION_ERROR / 職歴を1件以上入力してください |
| TC-356 | `workHistories` に `null` を指定する | 422 / VALIDATION_ERROR |
| TC-357 | `workHistories` に空配列 `[]` を指定する | 422 / VALIDATION_ERROR / 職歴を1件以上入力してください |
| TC-358 | `workHistories[0].company` を省略する | 422 / VALIDATION_ERROR / 会社名は必須項目です |
| TC-359 | `workHistories[0].company` に空文字を指定する | 422 / VALIDATION_ERROR / 会社名は必須項目です |
| TC-360 | `workHistories[0].startMonth` を省略する | 422 / VALIDATION_ERROR / 在籍開始月は必須項目です |
| TC-361 | `workHistories[0].startMonth` に `"2020/04"` など `YYYY-MM` 以外の形式を指定する | 422 / VALIDATION_ERROR / 在籍開始月はYYYY-MM形式で入力してください |
| TC-362 | `workHistories[0].role` を省略する | 422 / VALIDATION_ERROR / 役職は必須項目です |
| TC-363 | `workHistories[0].role` に空文字を指定する | 422 / VALIDATION_ERROR / 役職は必須項目です |
| TC-364 | `workHistories[0].endMonth` に `null` を指定する（現職を表す） | 204 |
| TC-365 | `workHistories[0].endMonth` を省略する | 204 |
| TC-366 | `workHistories[0].endMonth` に `"2024/03"` など `YYYY-MM` 以外の形式を指定する | 422 / VALIDATION_ERROR / 在籍終了月はYYYY-MM形式で入力してください |

#### リクエストボディ全体

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-367 | リクエストボディを送信しない（空リクエスト） | 400 / BAD_REQUEST / リクエストの形式が正しくありません |
| TC-368 | Content-Typeが `application/json` でないリクエストを送信する | 400 / BAD_REQUEST / リクエストの形式が正しくありません |

---

### 分岐処理（400〜499）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-401 | 必須項目のみを含む最小有効なリクエストを送信する（任意項目はすべて省略） | 204 No Content |
| TC-402 | すべての項目（任意項目含む）を含む完全なリクエストを送信する | 204 No Content |
| TC-403 | `phone` にハイフンを含む文字列（例: `"090-1234-5678"`）を指定する | 422 / VALIDATION_ERROR / 電話番号にハイフンは使用できません（例: 09012345678） |
| TC-404 | `postalCode` にハイフンを含む文字列（例: `"123-4567"`）を指定する | 422 / VALIDATION_ERROR / 郵便番号にハイフンは使用できません（例: 1234567） |
| TC-405 | `email` に対象ユーザー自身が現在登録しているメールアドレスを指定する（変更なし） | 204 No Content |
| TC-406 | `email` に他ユーザーが使用中のメールアドレスを指定する | 409 / CONFLICT / メールアドレスが既に登録されています |
| TC-407 | `profileImage` に `null` を指定する（既存画像がある場合） | 204 No Content（画像が削除される） |
| TC-408 | `workTypes` に複数の有効な値（例: `["フルタイム", "リモート"]`）を指定する | 204 No Content |
| TC-409 | `workTypes` に全4種類の値を指定する | 204 No Content |
| TC-410 | `workHistories` に複数件指定する | 204 No Content |
| TC-411 | `qualifications` に複数件指定する | 204 No Content |
| TC-412 | クリア可能な任意項目（`phone` / `postalCode` / `prefecture` / `city` / `streetAddress` / `building` / `selfPR`）にすべて `null` を指定する | 204 No Content（各フィールドが DB 上で NULL に更新される） |

---

### エラー（500〜599）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-501 | DB接続失敗時（user_profilesテーブルへのupdate失敗）にリクエストを送信する | 500 / INTERNAL_SERVER_ERROR（メッセージは実行環境依存のため検証しない） |
| TC-502 | トランザクション内でDBエラーが発生した場合にリクエストを送信する | 500 / INTERNAL_SERVER_ERROR / 予期せぬエラーが発生しました |
| TC-503 | `NODE_ENV=production` 時に500エラーが発生した場合、スタックトレースがレスポンスに含まれないことを確認する | 500 / INTERNAL_SERVER_ERROR / `stack` キーが存在しない |
