# ユーザープロフィールインポート

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-USER-08 |
| メソッド | POST |
| パス | /api/v1/users/import |
| 認証 | JWT必須 |
| 概要 | CSVファイルを受け取り、インポートジョブをバックグラウンドで開始する。処理結果は API-USER-09 でポーリングして取得する |

## リクエスト

- `Content-Type: text/csv`
- `Content-Encoding: gzip`（gzip圧縮時のみ付与）

リクエストボディにCSVファイルのバイナリデータを直接送信する。CSVフォーマットの仕様は API-USER-09 を参照。

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 200 | ジョブ受付処理成功 |

```json
{
  "status_code": 200,
  "is_success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| jobId | string（UUID） | 処理結果の取得に使用するジョブID |

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生するエラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|---|
| 400 | BAD_REQUEST | ファイル形式が正しくありません（gzipファイルではありません） | Content-Encoding: gzip 指定なのにgzipでない |
| 400 | BAD_REQUEST | ファイル形式が正しくありません（CSVファイルを指定してください） | gzipファイルなのにContent-Encodingなし、またはバイナリファイル |
| 400 | BAD_REQUEST | ファイルの解凍に失敗しました | gzip解凍失敗 |
| 401 | UNAUTHORIZED | 認証が必要です | 未認証でアクセスした場合 |
| 401 | UNAUTHORIZED | トークンが無効です | トークンが存在しない・無効化済み・期限切れ |
| 500 | INTERNAL_SERVER_ERROR | 予期せぬエラーが発生しました | サーバーエラー |

## 処理フロー

| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-USER-08-F01 | ジョブ受付処理開始 | - | - | - | `[API-USER-08-F01] ジョブ受付処理開始` |
| API-USER-08-F02 | JWT 検証：未認証の場合は即時エラーを返す | 401 | `UNAUTHORIZED` | `認証が必要です` | `[API-USER-08-F02] JWT検証失敗: ${error.message}` |
| API-USER-08-F03 | 解凍前拡張子チェック：`Content-Encoding: gzip` とマジックバイトの整合性を検証する | 400 | `BAD_REQUEST` | `ファイル形式が正しくありません（gzipファイルではありません）` または `ファイル形式が正しくありません（CSVファイルを指定してください）` | `[API-USER-08-F03] 拡張子チェック失敗: encoding=${encoding}, isGzip=${isGzipMagic}` |
| API-USER-08-F04 | gzip 解凍：`Content-Encoding: gzip` の場合はgzip解凍する | 400 | `BAD_REQUEST` | `ファイルの解凍に失敗しました` | `[API-USER-08-F04] gzip解凍失敗: ${error.message}` |
| API-USER-08-F05 | 空ファイルチェック：解凍後のファイルが 0 バイトでないことを確認する | 400 | `BAD_REQUEST` | `ファイルが空です` | `[API-USER-08-F05] 空ファイル検出: ファイルサイズが0バイトです` |
| API-USER-08-F06 | ジョブ作成：`import_jobs` テーブルにジョブレコードを作成する（status: pending） | 500 | `INTERNAL_SERVER_ERROR` | `予期せぬエラーが発生しました` | `[API-USER-08-F06] ジョブ作成失敗: ${error.message}` |
| API-USER-08-F07 | ジョブ受付処理完了：200・jobId をクライアントに返す | 200 | - | - | `[API-USER-08-F07] ジョブ受付処理完了: jobId=${jobId}` |

## 備考

- 処理はバックグラウンドで実行される。結果は API-USER-09 でポーリングして取得する
- ジョブのバリデーションエラーや処理失敗は API-USER-09 のレスポンスで通知される
- 既存ユーザーのパスワード列は無視される（パスワード変更不可）
- 新規ユーザーのパスワードは bcrypt でハッシュ化して保存する
- gzip圧縮はブラウザの `CompressionStream` API で実施する（非対応ブラウザは非圧縮で送信）
