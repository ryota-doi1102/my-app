# export_jobs

## テーブルID
DB-USER-06

## テーブル定義

| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| status | text | ✓ | - | pending | ジョブ状態（`pending` / `processing` / `completed` / `failed`） |
| csv_content | text | - | - | - | エクスポートされた CSV 本文（completed 時のみ設定） |
| errors | text[] | - | - | - | エラーメッセージ一覧（failed 時のみ設定） |
| created_at | timestamp | ✓ | - | now() | 作成日時 |
| updated_at | timestamp | ✓ | - | now() | 更新日時 |

## 備考

- `status` の遷移: `pending` → `processing` → `completed` / `failed`
- エクスポート処理完了後に `csv_content` または `errors` を更新する
- `csv_content` は CSV 全文を text 型で保存する
- `errors` は PostgreSQL 配列型（`text[]`）で保存する
