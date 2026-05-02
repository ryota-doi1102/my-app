# user_work_histories

## テーブルID
DB-USER-04

## テーブル定義

| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| user_id | uuid | ✓ | - | - | FK → users.id |
| company | varchar(255) | ✓ | - | - | 会社名 |
| start_month | varchar(7) | ✓ | - | - | 在籍開始月（YYYY-MM形式） |
| end_month | varchar(7) | - | - | - | 在籍終了月（YYYY-MM形式・NULL = 現職） |
| role | varchar(255) | ✓ | - | - | 役職 |
| sort_order | integer | ✓ | - | 0 | 表示順 |
| created_at | timestamp | ✓ | - | now() | 作成日時 |

## 外部キー

| カラム名 | 参照テーブル | 参照カラム | 削除時の動作 |
|---|---|---|---|
| user_id | users | id | cascade |

## 備考

- `end_month` が NULL の場合は現職を意味する
- `start_month` / `end_month` は `YYYY-MM` 形式の文字列で保存する
- プロフィール更新時は既存レコードを全件削除して再挿入する（洗い替え）
- users レコード削除時に cascade で自動削除される