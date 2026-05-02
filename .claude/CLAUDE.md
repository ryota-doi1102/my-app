# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # TypeScript check + Vite production build
npm run lint       # Biome check (lint + format check)
npm run format     # Biome auto-format
npm run preview    # Preview production build locally
npm run claude     # Run Claude Code CLI with .env variables loaded
```

No test framework is configured.

## Architecture

**Stack**: Vite + React 19 + TypeScript (strict mode), ES2023 target.

**Entry point**: `index.html` → `src/main.tsx` → `src/App.tsx`

**Styling**: Plain CSS with nested selectors and CSS custom properties for theming. Light/dark mode is handled via `prefers-color-scheme: dark` in `src/index.css`. No CSS preprocessor or CSS-in-JS.

**State**: Local React hooks only (`useState`). No router or global state library.

## Environment Variables

Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. The `npm run claude` script uses `dotenv-cli` to inject `.env` into the Claude Code CLI process. **Do not prefix the API key with `VITE_`** — that would expose it to the browser bundle.

---

## frontend コーディング規約

詳細は `.claude/commands/frontend-coding-rules.md` を参照。
概要は `docs/frontend-coding-rules.md` に記載。

### 主なルール（抜粋）

- TypeScript strict モード・`any` 禁止（`unknown` を使う）
- コンポーネントは関数宣言・`named export`
- フォームは React Hook Form + zod
- スタイルは Tailwind CSS のみ（カスタム CSS 禁止）
- 共通型は `@shared/types/` を優先使用
- Linter / Formatter は Biome を使用
- 画面・コンポーネントの `spec.md` は編集時に合わせて更新する

---

## backend コーディング規約

各規約は `.claude/commands/backend/` に記載：

- API 実装: `.claude/commands/backend-coding-rules-api.md`
- DB 実装: `.claude/commands/backend-coding-rules-db.md`
- Unit テスト: `.claude/commands/backend-coding-rules-unit-test.md`

概要は `docs/backend-coding-rules.md` に記載。

---

## E2E テスト規約

`.claude/commands/e2e-test.md`（CLI: `/e2e-test`）を参照。
概要は `docs/e2e-testing-rules.md` に記載。
テストファイルは `e2e/` ディレクトリで管理する。

---

## shared モジュール

フロントエンド・バックエンド共通のコードは `shared/` で管理する。

### 追加するもの

- 型定義（`types/`）
- Zod バリデーションスキーマ（`schemas/`）
- 定数・Enum（`constants/`）
- 副作用のないユーティリティ関数（`utils/`）

### 追加しないもの

- UI コンポーネント
- DB 接続・クエリ
- 認証ミドルウェア
- 環境変数に依存するコード

### インポート方法

```ts
import { createUserSchema } from '@shared/schemas/user'
import type { ApiResponse } from '@shared/types/api'
```

### 型チェック

```bash
npm run shared:check   # ルートで実行
```

---

## Backend

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Hono + @hono/node-server
- **Language**: TypeScript (strict mode), ES2023 target
- **ORM**: Drizzle ORM
- **DB**: PostgreSQL 16 (via Docker)
- **Test**: Vitest + @vitest/coverage-v8
- **Logging**: pino / pino-pretty
- **Auth**: JWT (hono/jwt)

### Setup

```bash
# 1. PostgreSQL を起動
npm run docker:up          # ルートで実行

# 2. 依存関係インストール
cd backend && npm install

# 3. 環境変数を設定
cp backend/.env.example backend/.env

# 4. マイグレーション実行
cd backend && npm run db:migrate
```

### Commands (backend/ で実行)

```bash
npm run dev            # tsx watch で開発サーバー起動（port 3000）
npm run build          # tsc でビルド（dist/）
npm run test           # Vitest でテスト実行
npm run test:coverage  # カバレッジ付きテスト
npm run db:generate    # Drizzle マイグレーションファイルを生成
npm run db:migrate     # マイグレーション実行
npm run db:studio      # Drizzle Studio（DB ブラウザ）起動
```

### Root Commands

```bash
npm run dev            # frontend + backend を同時起動（concurrently）
npm run docker:up      # docker-compose up -d
npm run docker:down    # docker-compose down
```

### Directory Structure

```
backend/
├── src/
│   ├── index.ts          # エントリーポイント（Hono + pino 設定）
│   ├── routes/
│   │   ├── health.ts     # GET /health
│   │   └── users.ts      # GET /api/v1/users, POST /api/v1/users
│   ├── middleware/
│   │   ├── auth.ts       # JWT 認証ミドルウェア
│   │   └── error.ts      # 共通エラーハンドラー・AppError クラス
│   ├── db/
│   │   ├── schema.ts     # Drizzle スキーマ定義
│   │   └── index.ts      # DB 接続
│   └── types/
│       └── api.ts        # frontend/backend 共有型定義
├── drizzle/              # 生成されたマイグレーションファイル
├── drizzle.config.ts
├── vitest.config.ts
├── tsconfig.json
├── Dockerfile            # マルチステージビルド（build / production）
└── .env.example
```

### API URL Rules

すべての API は `/api/v1/` プレフィックスで統一する（バージョニング）。

| Method | Path | 認証 | 説明 |
|---|---|---|---|
| GET | /health | 不要 | ヘルスチェック |
| GET | /api/v1/users | JWT 必須 | ユーザー一覧 |
| POST | /api/v1/users | 不要 | ユーザー作成 |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

エラーコード一覧: `BAD_REQUEST` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `INTERNAL_SERVER_ERROR`

本番環境 (`NODE_ENV=production`) ではスタックトレースを返さない。

### Environment Variables (backend/.env)

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/app_db
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=604800
PORT=3000
NODE_ENV=development
```

### Swagger UI

開発環境のみ有効（`NODE_ENV !== "production"`）。

- Swagger UI:      http://localhost:3000/ui
- OpenAPIスキーマ: http://localhost:3000/doc
- ルートを追加すると自動でSwagger UIに反映される
