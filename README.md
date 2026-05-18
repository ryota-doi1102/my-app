# react-toy-box

## プロジェクト構成

```
project/
├── .claude/                  # Claude Code 設定
│   ├── CLAUDE.md             # プロジェクト共通ガイドライン
│   └── commands/             # スラッシュコマンド
│       ├── review.md                      # /review
│       ├── coding-rules-backend.md        # /coding-rules-backend
│       ├── coding-rules-backend-api.md    # /coding-rules-backend-api
│       ├── coding-rules-backend-db.md     # /coding-rules-backend-db
│       ├── coding-rules-backend-unit-test.md
│       ├── coding-rules-comment-logging.md
│       ├── coding-rules-frontend.md       # /coding-rules-frontend
│       ├── coding-rules-validation.md
│       ├── spec-rules-api.md              # /spec-rules-api
│       ├── spec-rules-api-test.md
│       ├── spec-rules-db.md               # /spec-rules-db
│       ├── spec-rules-screen.md
│       ├── spec-rules-screen-test.md
│       ├── commit.md                      # /commit
│       └── e2e-test.md                    # /e2e-test
├── docs/
│   ├── api/                  # API 仕様書（API-AUTH-XX / API-USER-XX）
│   ├── db/                   # DB 仕様書（DB-AUTH-XX / DB-USER-XX / DB-MASTER-XX）
│   ├── screens/              # 画面仕様書（SCR-XXX-YY/）
│   ├── tests/
│   │   ├── api/              # API テスト仕様書
│   │   ├── e2e/              # E2E テスト仕様書
│   │   └── frontend/         # フロントエンドテスト仕様書
│   └── rules/
│       ├── coding/           # コーディング規約
│       ├── spec/             # 仕様書規約
│       └── testing/          # テスト規約
├── frontend/                 # React（TypeScript）
├── backend/                  # Hono（TypeScript）
├── shared/                   # フロント・バック共通モジュール
│   ├── types/                # 型定義
│   ├── schemas/              # Zod バリデーションスキーマ
│   ├── constants/            # 定数・Enum
│   └── utils/                # ユーティリティ関数
├── e2e/                      # E2E テスト（Playwright）
├── docker-compose.yml
├── package.json              # ワークスペース管理
└── README.md
```

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# Docker（PostgreSQL）起動
docker-compose up -d

# 環境変数を設定
cp backend/.env.example backend/.env

# DB マイグレーション
cd backend && npm run db:migrate

# 開発サーバー起動（frontend + backend 同時）
npm run dev
```

## ブランチ pull 後に必要な作業

ブランチを pull した際、以下の変更が含まれている場合は対応する手順が必要です。

### 依存パッケージの変更（`package.json` / `package-lock.json` の差分があるとき）

```bash
# ルートで実行（frontend・backend・shared すべてのパッケージを更新）
npm install
```

### DB スキーマ変更（`backend/drizzle/*.sql` に新しいファイルがあるとき）

```bash
# Docker が起動していることを確認してからマイグレーション実行
docker-compose up -d
cd backend && npm run db:migrate
```

> **このブランチの変更**: `0006_import_export_jobs.sql`（インポート/エクスポートジョブテーブルを追加）

## shared の使い方

frontend・backend どちらからも `@shared/*` でインポートできます：

```ts
import { createUserSchema } from '@shared/schemas/user'
import type { User } from '@shared/types/user'
import { WORK_TYPES } from '@shared/constants'
```

shared に追加するもの・しないものの基準：

- **追加する**: 型定義・バリデーションスキーマ・定数・純粋なユーティリティ関数
- **追加しない**: UI コンポーネント・DB 接続・認証ロジック・環境変数依存のコード

## 主要コマンド

```bash
# 開発
npm run dev               # frontend + backend 同時起動
npm run docker:up         # PostgreSQL 起動
npm run docker:down       # PostgreSQL 停止
npm run shared:check      # shared の型チェック

# frontend（frontend/ で実行）
npm run lint              # Biome チェック
npm run format            # Biome 自動フォーマット

# backend（backend/ で実行）
npm run test              # Unit テスト（watch モード）
npm run test:run          # Unit テスト（1 回実行・CI 用）
npm run test:coverage     # カバレッジ確認
npm run db:generate       # マイグレーションファイル生成
npm run db:migrate        # マイグレーション実行
npm run db:studio         # Drizzle Studio 起動
```

## コーディング規約

Claude Code スラッシュコマンドで参照できます：

| 対象 | コマンド | 規約ファイル |
|---|---|---|
| backend 共通 | `/coding-rules-backend` | `docs/rules/coding/backend-coding-rules.md` |
| backend API | `/coding-rules-backend-api` | `docs/rules/coding/api-coding-rules.md` |
| backend DB | `/coding-rules-backend-db` | `docs/rules/coding/db-coding-rules.md` |
| コメント・ログ | `/coding-rules-comment-logging` | `docs/rules/coding/comment-and-logging-rules.md` |
| バリデーション | `/coding-rules-validation` | `docs/rules/coding/validation-rules.md` |
| frontend | `/coding-rules-frontend` | `docs/rules/coding/frontend-coding-rules.md` |

## 仕様書

| 種別 | ディレクトリ | 規約コマンド |
|---|---|---|
| API 仕様書 | `docs/api/` | `/spec-rules-api` |
| DB 仕様書 | `docs/db/` | `/spec-rules-db` |
| 画面仕様書 | `docs/screens/` | `/spec-rules-screen` |
| API テスト仕様書 | `docs/tests/api/` | `/spec-rules-api-test` |

## テスト

### Unit テスト（backend）

```bash
cd backend
npm run test          # watch モード
npm run test:run      # 1 回実行（CI 用）
npm run test:coverage # カバレッジ確認
```

### E2E テスト

```bash
# 事前準備
docker-compose up -d
npm run dev

# 実行
npm run e2e       # 全テスト
npm run e2e:ui    # UI モード
```

規約: [`docs/rules/testing/e2e-testing-rules.md`](docs/rules/testing/e2e-testing-rules.md)

## レビュー

`/review` コマンドでドキュメント・実装を総合レビューできます：

```
/review docs/api/API-USER-02.md
/review backend/src/routes/users.ts
/review API-USER-02
```

チェック内容: ドキュメントの規約準拠 / 実装のコーディング規約 / ドキュメントと実装の整合性 / 影響範囲の反映漏れ
