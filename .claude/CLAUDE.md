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

frontend のテストは Vitest + @testing-library/react を使用する（`frontend/` で `npm run test:run`）。

## Architecture

**Stack**: Vite + React 19 + TypeScript (strict mode), ES2023 target.

**Entry point**: `index.html` → `src/main.tsx` → `src/App.tsx`

**Styling**: Tailwind CSS + shadcn/ui。カスタム CSS ファイルは作成しない。

**State**: Local React hooks（`useState`）+ React Router（`react-router-dom`）。グローバル状態管理ライブラリは使用しない。

## Environment Variables

Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. The `npm run claude` script uses `dotenv-cli` to inject `.env` into the Claude Code CLI process. **Do not prefix the API key with `VITE_`** — that would expose it to the browser bundle.

---

## frontend コーディング規約

詳細は `/coding-rules-frontend` を参照。
規約ファイル: `docs/rules/coding/frontend-coding-rules.md`

### 主なルール（抜粋）

- TypeScript strict モード・`any` 禁止（`unknown` を使う）
- コンポーネントは関数宣言・`named export`
- フォームは React Hook Form + zod
- スタイルは Tailwind CSS のみ（カスタム CSS 禁止）
- 共通型は `@shared/types/` を優先使用
- Linter / Formatter は Biome を使用
- 画面仕様書は `docs/screens/SCR-XXX-YY/index.md` で管理する。画面・フックを変更した場合は対応する仕様書を合わせて更新する

---

## backend コーディング規約

各規約は以下のコマンドで参照する：

- 共通（TypeScript・ディレクトリ構成）: `/coding-rules-backend`
- API 実装: `/coding-rules-backend-api`
- DB 実装: `/coding-rules-backend-db`
- Unit テスト: `/coding-rules-backend-unit-test`
- コメント・ロギング: `/coding-rules-comment-logging`
- バリデーション: `/coding-rules-validation`

規約ファイル: `docs/rules/coding/`

---

## E2E テスト規約

`.claude/commands/e2e-test.md`（CLI: `/e2e-test`）を参照。
テストファイルは `e2e/` ディレクトリで管理する。

---

## レビュー

`/review` コマンドでドキュメント・実装を総合レビューする。

```
/review <対象ファイルパスまたはID>
```

以下の4観点を一括チェックする：
1. **ドキュメントの不備** — 規約フォーマット・必須セクション・一覧登録
2. **実装の不備** — コーディング規約・型安全性・ディレクトリ構成
3. **整合性** — ドキュメントと実装の内容一致
4. **影響範囲** — 変更に連動すべきファイルの反映漏れ

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
- **Logging**: LogTape（`backend/src/lib/logger.ts` の `getAppLogger`）
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
│   ├── index.ts          # エントリーポイント（OpenAPIHono + LogTape 設定）
│   ├── routes/
│   │   ├── health.ts     # GET /health
│   │   ├── auth.ts       # POST /api/v1/auth/...
│   │   └── users.ts      # PUT/GET/DELETE /api/v1/users/...
│   ├── middleware/
│   │   ├── auth.ts       # JWT 認証ミドルウェア（requireAuth）
│   │   └── error.ts      # 共通エラーハンドラー・AppError クラス
│   ├── schemas/          # backend 固有のスキーマ拡張
│   ├── services/         # ビジネスロジック（API 単位でファイル分割）
│   ├── lib/
│   │   └── logger.ts     # LogTape ロガー（getAppLogger）
│   ├── db/
│   │   ├── schema.ts     # Drizzle スキーマ定義
│   │   └── index.ts      # DB 接続
│   ├── tests/            # テストファイル（routes/ 配下）
│   └── types/
│       └── api.ts        # backend 固有の型定義（ErrorCode / ErrorResponse / SuccessResponse）
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
| POST | /api/v1/auth/signup/request | 不要 | サインアップトークン発行 |
| POST | /api/v1/auth/signup | 不要 | サインアップ実行 |
| POST | /api/v1/auth/signin | 不要 | サインイン |
| POST | /api/v1/auth/refresh | 不要 | トークンリフレッシュ |
| POST | /api/v1/auth/signout | JWT 必須 | サインアウト |
| POST | /api/v1/auth/password-reset/request | 不要 | パスワードリセットトークン発行 |
| POST | /api/v1/auth/password-reset | 不要 | パスワードリセット実行 |
| POST | /api/v1/users | JWT 必須 | ユーザー一覧検索 |
| PUT | /api/v1/users | 不要 | ユーザープロフィール作成 |
| GET | /api/v1/users/:id | JWT 必須 | ユーザープロフィール取得 |
| PUT | /api/v1/users/:id | JWT 必須 | ユーザープロフィール更新 |
| DELETE | /api/v1/users/:id | JWT 必須 | ユーザー論理削除 |
| DELETE | /api/v1/users/bulk | JWT 必須 | ユーザー一括削除 |
| GET | /api/v1/users/template | JWT 必須 | CSVテンプレートダウンロード |
| POST | /api/v1/users/import | JWT 必須 | CSVインポートジョブ登録 |
| GET | /api/v1/users/import-jobs/:jobId | JWT 必須 | インポートジョブ結果取得 |
| POST | /api/v1/users/export | JWT 必須 | CSVエクスポートジョブ登録 |
| GET | /api/v1/users/export-jobs/:jobId | JWT 必須 | エクスポートジョブ結果取得 |

### Error Response Format

```json
{
  "status_code": 404,
  "is_success": false,
  "error": {
    "code": "NOT_FOUND",
    "messages": ["ユーザーが見つかりません"]
  }
}
```

エラーコード一覧: `BAD_REQUEST` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `CONFLICT` / `VALIDATION_ERROR` / `INTERNAL_SERVER_ERROR`

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
