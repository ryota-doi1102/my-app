# ユーザープロフィール作成画面

## このブランチに含まれる変更

| カテゴリ | 変更内容 |
|----------|----------|
| DB | `genders` / `work_types` テーブルを廃止し、PostgreSQL ネイティブ enum（`gender` / `work_type`）へ移行（migration: `0005_enum_gender_worktype`） |
| API レスポンス形式 | `success` → `is_success`、エラーの `message: string` → `messages: string[]` に統一 |
| ユーザー作成・更新 API | レスポンスを 204 No Content に変更（ボディなし） |
| 保存後遷移 | ユーザー作成後の遷移先を詳細画面（`/users/:id`）からユーザー一覧（`/users/list`）に変更 |
| 新機能 | ユーザープロフィール作成画面（`/users/create`）を実装 |
| テスト | `API-USER-02.test.ts` — 86 件のユニットテストを追加 |

---

## ブランチ取り込み時の作業

### 1. 依存関係インストール

```bash
npm install
```

### 2. DB マイグレーション

Docker が起動していることを確認してから実行します。

```bash
npm run docker:up
npm run db:migrate --workspace=backend
```

#### マイグレーションが正常に適用されない場合（手動対応）

Drizzle は内部タイムスタンプを使ってマイグレーションの適用順を判断します。
`0005_enum_gender_worktype` のタイムスタンプが既存の適用済みマイグレーションより古い場合、
Drizzle が無音でスキップすることがあります。

その場合は以下の SQL を手動で実行してください。

```bash
docker exec -i <postgres_container_name> psql -U postgres -d app_db
```

```sql
-- 既存テーブル・カラムの削除
ALTER TABLE user_profiles DROP COLUMN IF EXISTS gender_id;
ALTER TABLE user_work_types DROP COLUMN IF EXISTS work_type_id;
DROP TABLE IF EXISTS genders;
DROP TABLE IF EXISTS work_types;

-- enum 型の作成
DO $$ BEGIN
  CREATE TYPE gender AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE work_type AS ENUM ('full_time', 'part_time', 'remote', 'freelance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- enum カラムの追加
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender gender;
ALTER TABLE user_work_types ADD COLUMN IF NOT EXISTS work_type work_type NOT NULL DEFAULT 'full_time';
ALTER TABLE user_work_types ALTER COLUMN work_type DROP DEFAULT;
```

その後、Drizzle のマイグレーション管理テーブルにハッシュを登録します。

```sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('ee1846829c36b85cfcd5105ee266b3d6a1c0f9556a64fdbf6dd83ac070d16745', 1746921600000)
ON CONFLICT DO NOTHING;
```

### 3. 動作確認

```bash
npm run dev
```

ブラウザで `http://localhost:5173/users/create` を開き、フォームが表示されることを確認します。

---

## 画面仕様

詳細は [spec.md](spec.md) を参照してください。
