# genders

## テーブルID
DB-MASTER-01

## テーブル定義

| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| name | varchar(10) | ✓ | ✓ | - | 性別名（`男性` / `女性` / `その他`） |
| sort_order | integer | ✓ | - | - | 表示順 |
| created_at | timestamp | ✓ | - | now() | 作成日時 |

## インデックス

| カラム名 | 種別 |
|---|---|
| sort_order | index |

## 初期データ（シード）

| sort_order | name |
|---|---|
| 1 | 男性 |
| 2 | 女性 |
| 3 | その他 |

## 備考

- 運用中の追加・変更・削除は行わない想定（アプリリリース時にシード投入）
- `sort_order` の昇順で UI に表示する