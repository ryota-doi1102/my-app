# DB 仕様書規約

DB 仕様書を作成・変更する際に参照する規約。

詳細は `docs/rules/spec/db-spec-rules.md` を参照。

---

## ファイル命名・配置

```
docs/db/DB-USER-01.md
docs/db/DB-AUTH-01.md
```

- ID 体系: `DB-{リソース}-{連番2桁}`
- リソース区分: `USER` / `AUTH` / `MASTER`
- 追加後は `docs/db/_table_list.md` に記載する

---

## 必須セクション

| # | セクション | 内容 |
|---|---|---|
| 1 | タイトル（H1） | テーブル名（英語・snake_case） |
| 2 | テーブルID | `DB-XXX-YY` 形式 |
| 3 | テーブル定義 | カラム定義テーブル |
| 4 | 外部キー | FK がある場合のみ |
| 5 | インデックス | PK 以外のインデックスがある場合のみ |
| 6 | 備考 | 保存形式・制約・運用ルール等 |

---

## テーブル定義

```markdown
| カラム名（snake_case） | 型 | 必須 | 一意 | デフォルト | 説明 |
|---|---|---|---|---|---|
| id | uuid | ✓ | ✓ | auto | PK |
| user_id | uuid | ✓ | - | - | FK → users.id |
| name | varchar(100) | - | - | - | 氏名 |
| created_at | timestamp | ✓ | - | now() | 作成日時 |
| updated_at | timestamp | ✓ | - | now() | 更新日時 |
| deleted_at | timestamp | - | - | - | 削除日時（論理削除） |
```

### 型の選択肢

| 型 | 用途 |
|---|---|
| `uuid` | UUID（PK・FK） |
| `varchar(N)` | 最大 N 文字の文字列 |
| `text` | 文字数制限なしの文字列 |
| `integer` | 整数 |
| `boolean` | 真偽値 |
| `date` | 日付（時刻なし） |
| `timestamp` | 日時（タイムゾーンなし） |
| `decimal(M,N)` | 小数 |
| `{name} enum` | PostgreSQL Enum 型（→ 対応する DB-MASTER-XX を参照） |

---

## 外部キー

```markdown
| カラム名 | 参照テーブル | 参照カラム | 削除時の動作 |
|---|---|---|---|
| user_id | users | id | cascade |
```

削除時の動作: `cascade`（連動削除） / `restrict`（親削除不可） / `set null`（FK を NULL に）

---

## 命名規約

| 対象 | 規約 | 例 |
|---|---|---|
| テーブル名 | snake_case・複数形 | `user_profiles` |
| カラム名 | snake_case | `birth_date` |
| TypeScript 変数 | camelCase（Drizzle が自動変換） | `birthDate` |

---

## 論理削除

- 物理削除しない。`deleted_at` カラムで論理削除する
- クエリでは `isNull(table.deletedAt)` を WHERE に付けて削除済みを除外する
- FK のカラム定義欄に `FK → {参照テーブル}.{参照カラム}` と記載する

---

## 更新ルール

テーブルを追加・変更したら以下を同時に更新する:
1. `docs/db/_table_list.md`
2. `backend/src/db/schema/`（Drizzle スキーマ定義）
3. マイグレーションファイル（`npm run db:generate` で生成）
- スキーマ定義とマイグレーションファイルは同一コミットに含める
