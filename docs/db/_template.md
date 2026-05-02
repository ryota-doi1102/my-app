# テーブル名（英語・snake_case）
例: user_profiles

## テーブルID
DB-AUTH-01

## テーブル定義

| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| created_at | timestamp | ✓ | - | now() | 作成日時 |
| updated_at | timestamp | ✓ | - | now() | 更新日時 |
| deleted_at | timestamp | - | - | - | 削除日時（論理削除） |

<!-- 型の選択肢 -->
<!-- uuid / varchar(N) / text / integer / boolean / date / timestamp / decimal(M,N) -->

## 外部キー
<!-- 外部キーがある場合のみ記載。なければ削除 -->
| カラム名 | 参照テーブル | 参照カラム | 削除時の動作 |
|---|---|---|---|
| user_id | users | id | cascade |

<!-- 削除時の動作の選択肢: cascade / restrict / set null -->

## インデックス
<!-- パフォーマンスのために追加するインデックス。なければ削除 -->
| カラム名 | 種別 |
|---|---|
| email | unique |

## 備考
<!-- 特記事項があれば記載（保存形式・制約など） -->
- 電話番号・郵便番号はハイフンなしの数字のみで保存する