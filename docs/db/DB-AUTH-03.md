# refresh_tokens

## テーブルID
DB-AUTH-03

## テーブル定義

| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| user_id | uuid | ✓ | - | - | トークン発行対象のユーザーID |
| token | varchar(255) | ✓ | ✓ | - | リフレッシュ用トークン（UUID v4） |
| created_at | timestamp | ✓ | - | now() | 発行日時 |
| expires_at | timestamp | ✓ | - | - | 有効期限（発行時刻 + 1日） |
| revoked_at | timestamp | - | - | - | 無効化日時 |

## 外部キー

| カラム名 | 参照テーブル | 参照カラム | 削除時の動作 |
|---|---|---|---|
| user_id | users | id | cascade |

## インデックス

| カラム名 | 種別 |
|---|---|
| token | unique |

## 備考
- token は crypto.randomUUID() で生成した UUID v4 形式
- expires_at カラムでトークンの有効期限を管理する（発行時刻 + 1日）
- revoked_at が NULL でない場合は無効化済みトークン