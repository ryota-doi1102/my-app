# user_work_types

## テーブルID
DB-USER-02

## テーブル定義

| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| user_id | uuid | ✓ | - | - | FK → users.id |
| work_type_id | uuid | ✓ | - | - | FK → work_types.id |
| sort_order | integer | ✓ | - | 0 | 表示順 |
| created_at | timestamp | ✓ | - | now() | 作成日時 |

## 外部キー

| カラム名 | 参照テーブル | 参照カラム | 削除時の動作 |
|---|---|---|---|
| user_id | users | id | cascade |
| work_type_id | work_types | id | restrict |

## 備考

- 1ユーザーが複数の勤務形態を持つ中間テーブル
- プロフィール更新時は既存レコードを全件削除して再挿入する（洗い替え）
- users レコード削除時に cascade で自動削除される