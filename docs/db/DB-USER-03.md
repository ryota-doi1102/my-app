# user_qualifications

## テーブルID
DB-USER-03

## テーブル定義

| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| user_id | uuid | ✓ | - | - | FK → users.id |
| value | text | ✓ | - | - | 資格名 |
| sort_order | integer | ✓ | - | 0 | 表示順 |
| created_at | timestamp | ✓ | - | now() | 作成日時 |

## 外部キー

| カラム名 | 参照テーブル | 参照カラム | 削除時の動作 |
|---|---|---|---|
| user_id | users | id | cascade |

## 備考

- プロフィール更新時は既存レコードを全件削除して再挿入する（洗い替え）
- users レコード削除時に cascade で自動削除される