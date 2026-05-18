# テスト仕様書 - API-USER-09 インポートジョブ結果取得

## 対象API

| 項目 | 内容 |
|---|---|
| ID | API-USER-09 |
| メソッド | GET |
| パス | /api/v1/users/import-jobs/:jobId |
| 認証 | JWT必須 |
| 成功時レスポンス | 202（処理継続中）/ 200（処理完了） |

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
| TC-201 | `jobId` に UUID 形式でない文字列（例: `"abc"`）を指定する | 404 / NOT_FOUND / ジョブが見つかりません |
| TC-202 | `jobId` に存在しない UUID を指定する | 404 / NOT_FOUND / ジョブが見つかりません |

---

### リクエストチェック（ボディ）（300〜399）

このAPIはリクエストボディが存在しないため、該当するテストケースはない。

---

### 分岐処理（400〜499）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-401 | status が `pending` / `processing` のジョブIDを指定する | 202（`status: "processing"` が返る） |
| TC-402 | status が `completed` のジョブIDを指定する | 200（`result.created` / `result.updated` を含むレスポンスが返る） |
| TC-403 | status が `failed`（ファイル構造エラー）のジョブIDを指定する | 422 / UNPROCESSABLE_ENTITY / ファイル形式が正しくありません（CSVファイルを指定してください） |
| TC-404 | status が `failed`（行データバリデーションエラー）のジョブIDを指定する | 422 / UNPROCESSABLE_ENTITY / `{N}行目:` を含むエラーメッセージ |
| TC-405 | status が `failed`（DB検証エラー：存在しないID）のジョブIDを指定する | 422 / UNPROCESSABLE_ENTITY / `{N}行目: 指定されたIDが存在しません` |
| TC-406 | status が `failed`（DB検証エラー：メールアドレス重複）のジョブIDを指定する | 422 / UNPROCESSABLE_ENTITY / `{N}行目: このメールアドレスはすでに使用されています` |
| TC-407 | status が `failed`（インポート実行エラー）のジョブIDを指定する | 500 / INTERNAL_SERVER_ERROR / インポートに失敗しました |

---

### エラー（500〜599）

| テストケースID | テスト内容 | 期待するテスト結果 |
|---|---|---|
| TC-501 | DB接続失敗時（`import_jobs` テーブルの読み取り失敗）にリクエストを送信する | 500 / INTERNAL_SERVER_ERROR（メッセージは実行環境依存のため検証しない） |
| TC-502 | トランザクション内でDBエラーが発生した場合にリクエストを送信する | 500 / INTERNAL_SERVER_ERROR / 予期せぬエラーが発生しました |
| TC-503 | `NODE_ENV=production` 時に500エラーが発生した場合、スタックトレースがレスポンスに含まれないことを確認する | 500 / INTERNAL_SERVER_ERROR / `stack` キーが存在しない |
