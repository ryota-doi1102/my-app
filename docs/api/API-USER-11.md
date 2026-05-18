# エクスポートジョブ結果取得

## 基本情報

| 項目 | 内容 |
|---|---|
| ID | API-USER-11 |
| メソッド | GET |
| パス | /api/v1/users/export-jobs/:jobId |
| 認証 | JWT必須 |
| 概要 | API-USER-10 で登録したエクスポートジョブの処理状態・結果を取得する |

## リクエスト

### パスパラメータ

| パラメータ名 | 型 | 必須 | 説明 |
|---|---|---|---|
| jobId | string（UUID） | ✓ | API-USER-10 で取得したジョブID |

## レスポンス

### 成功時

| ステータスコード | 説明 |
|---|---|
| 202 | 処理継続中 |
| 200 | 処理完了 |

#### 処理中（pending / processing）

```json
{
  "status_code": 202,
  "is_success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing"
  }
}
```

#### 完了（completed）

```
HTTP/1.1 200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="users_export.csv"

<UTF-8 BOM 付き CSV データ>
```

### エラー時

共通エラーコード：docs/api/_status_codes.md を参照。

#### このAPIで発生するエラー

| ステータスコード | code | メッセージ | 説明 |
|---|---|---|---|
| 401 | UNAUTHORIZED | 認証が必要です | 未認証でアクセスした場合 |
| 401 | UNAUTHORIZED | トークンが無効です | トークンが存在しない・無効化済み・期限切れ |
| 404 | NOT_FOUND | ジョブが見つかりません | 指定した jobId のジョブが存在しない |
| 500 | INTERNAL_SERVER_ERROR | エクスポートに失敗しました | エクスポート実行中のシステムエラー（F05〜F06） |
| 500 | INTERNAL_SERVER_ERROR | 予期せぬエラーが発生しました | サーバーエラー |

#### エクスポート失敗時のレスポンス例

```json
{
  "status_code": 500,
  "is_success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "messages": ["エクスポートに失敗しました"]
  }
}
```

## 処理フロー

### API リクエスト処理

| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-USER-11-F01 | エクスポートジョブ結果取得開始 | - | - | - | `[API-USER-11-F01] エクスポートジョブ結果取得開始: jobId=${jobId}` |
| API-USER-11-F02 | JWT 検証：未認証の場合は即時エラーを返す | 401 | `UNAUTHORIZED` | `認証が必要です` | `[API-USER-11-F02] JWT検証失敗: ${error.message}` |
| API-USER-11-F03 | ジョブ取得：`export_jobs` テーブルから jobId に一致するジョブを取得する | 404 | `NOT_FOUND` | `ジョブが見つかりません` | `[API-USER-11-F03] ジョブ取得失敗: jobId=${jobId}` |

### バックグラウンドジョブ処理フロー

API-USER-10 のジョブ受付後にバックグラウンドで実行される処理。エラーは API-USER-11 のポーリングレスポンスとして HTTP エラー（500）で通知される。

| ID | 処理内容 | ログ表示内容 |
|---|---|---|
| API-USER-11-F04 | エクスポートジョブ処理開始・DB取得：検索条件に一致するユーザーを全件取得する | 開始: `[API-USER-11-F04] エクスポートジョブ処理開始: jobId=${jobId}` / 失敗: `[API-USER-11-F04] DB取得失敗: jobId=${jobId}, ${error.message}` |
| API-USER-11-F05 | CSV 生成：取得データを UTF-8 BOM 付き CSV 形式に変換する | `[API-USER-11-F05] CSV生成失敗: jobId=${jobId}, ${error.message}` |
| API-USER-11-F06 | エクスポートジョブ処理完了 | `[API-USER-11-F06] エクスポートジョブ処理完了: jobId=${jobId}, rows=${rowCount}` |

### ジョブ結果返却

| ID | 処理内容 | ステータスコード | エラーコード | エラーメッセージ | ログ表示内容 |
|---|---|---|---|---|---|
| API-USER-11-F07 | エクスポートジョブ結果取得完了（継続中）：status が `pending` / `processing` の場合、202 を返す | 202 | - | - | `[API-USER-11-F07] 継続中: jobId=${jobId}, status=${status}` |
| API-USER-11-F08 | エクスポートジョブ結果取得完了（エラー）：status が `failed` の場合、HTTP エラーを返す | 500 | `INTERNAL_SERVER_ERROR` | `エクスポートに失敗しました` | `[API-USER-11-F08] エラー返却: jobId=${jobId}` |
| API-USER-11-F09 | エクスポートジョブ結果取得完了（完了）：status が `completed` の場合、`Content-Type: text/csv` で CSV ファイルを返す | 200 | - | - | `[API-USER-11-F09] エクスポートジョブ結果取得完了: jobId=${jobId}, rows=${rowCount}` |

## 備考

- フロントエンドは 2 秒間隔でポーリングし、200 が返るか HTTP エラー（4xx / 5xx）が返った時点で停止する
- 200 レスポンスはCSVファイルそのものであるため、フロントエンドは `response.blob()` でBlobを生成してファイルダウンロードを実行する
