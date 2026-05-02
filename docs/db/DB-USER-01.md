# user_profiles

## テーブルID
DB-USER-01

## テーブル定義

| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| user_id | uuid | ✓ | - | - | FK → users.id |
| name | varchar(100) | - | - | - | 氏名 |
| birth_date | date | - | - | - | 生年月日 |
| gender_id | uuid | - | - | - | FK → genders.id |
| profile_image_url | text | - | - | - | プロフィール画像URL |
| phone | varchar(11) | - | - | - | 電話番号（数字のみ・10〜11桁） |
| postal_code | varchar(7) | - | - | - | 郵便番号（数字のみ・7桁固定） |
| prefecture | varchar(50) | - | - | - | 都道府県 |
| city | varchar(100) | - | - | - | 市区町村 |
| street_address | varchar(255) | - | - | - | 番地・丁目 |
| building | varchar(255) | - | - | - | 建物名・部屋番号 |
| self_pr | text | - | - | - | 自己PR |
| created_at | timestamp | ✓ | - | now() | 作成日時 |
| updated_at | timestamp | ✓ | - | now() | 更新日時 |
| deleted_at | timestamp | - | - | - | 削除日時（論理削除） |

<!-- 型の選択肢 -->
<!-- uuid / varchar(N) / text / integer / boolean / date / timestamp / decimal(M,N) -->

## 外部キー

| カラム名 | 参照テーブル | 参照カラム | 削除時の動作 |
|---|---|---|---|
| user_id | users | id | cascade |
| gender_id | genders | id | set null |

<!-- 削除時の動作の選択肢: cascade / restrict / set null -->

## 備考

- 電話番号・郵便番号はハイフンなしの数字のみで保存する
- `gender_id` は `genders` テーブルの id を参照する
- `profile_image_url` はサーバーローカルの相対パス（例: `/uploads/profile-images/{uuid}.jpg`）を保存する
  - 実ファイルは `backend/uploads/profile-images/` に保存する
  - `GET /uploads/profile-images/:filename` で静的ファイルとして配信する
  - `uploads/` ディレクトリは `.gitignore` に追加する
- `deleted_at` は論理削除用。物理削除は行わない
- users レコード削除時に cascade で自動削除される