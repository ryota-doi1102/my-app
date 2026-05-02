# users

## テーブルID
DB-AUTH-01

## テーブル定義

| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| email | varchar(255) | ✓ | ✓ | - | メールアドレス |
| password_hash | varchar(255) | ✓ | - | - | ハッシュ化済みパスワード |
| created_at | timestamp | ✓ | - | now() | 作成日時 |
| updated_at | timestamp | ✓ | - | now() | 更新日時 |
| deleted_at | timestamp | - | - | - | 削除日時（論理削除） |

<!-- 型の選択肢 -->
<!-- uuid / varchar(N) / text / integer / boolean / date / timestamp / decimal(M,N) -->

## インデックス

| カラム名 | 種別 |
|---|---|
| email | unique |

## 備考

- `password_hash` には平文パスワードを保存しない。必ず bcrypt 等でハッシュ化してから保存する
- `deleted_at` は論理削除用。物理削除は行わない
