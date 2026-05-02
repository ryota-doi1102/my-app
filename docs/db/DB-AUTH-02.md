# signup_tokens

## テーブルID
DB-AUTH-02

## テーブル定義

| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| email | varchar(255) | ✓ | - | - | トークン発行対象のメールアドレス |
| token | varchar(255) | ✓ | ✓ | - | サインアップ用トークン（UUID v4） |
| created_at | timestamp | ✓ | - | now() | 発行日時 |
| expires_at | timestamp | ✓ | - | - | 有効期限（発行時刻 + 24時間） |
| used_at | timestamp | - | - | - | 使用日時 |
| revoked_at | timestamp | - | - | - | 無効化日時 |

<!-- 型の選択肢 -->
<!-- uuid / varchar(N) / text / integer / boolean / date / timestamp / decimal(M,N) -->

## インデックス

| カラム名 | 種別 |
|---|---|
| token | unique |

## 備考

- `token` は `crypto.randomUUID()` で生成した UUID v4 形式
- `expires_at` カラムでトークンの有効期限を管理する（発行時刻 + 24時間）
- `used_at` が NULL でない場合は使用済みトークン
- `revoked_at` が NULL でない場合は無効化済みトークン
