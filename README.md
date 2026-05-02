# react-toy-box

## プロジェクト構成

```
project/
├── .claude/                  # Claude Code設定
│   ├── CLAUDE.md
│   └── commands/
│       ├── frontend/
│       │   ├── commit.md        # frontend 用コミット規約
│       │   └── coding-rules.md  # frontend コーディング規約
│       └── backend/
│           └── commit.md        # backend 用コミット規約
├── .cspell/                  # スペルチェック設定
│   ├── cspell.json           # システム固有の技術用語
│   └── words.txt             # 個人名等、データによって発生する固有名詞
├── frontend/                 # React（TypeScript）
├── backend/                  # Hono（TypeScript）
├── shared/                   # フロント・バック共通モジュール
│   ├── types/                # 型定義
│   ├── schemas/              # Zodバリデーションスキーマ
│   ├── constants/            # 定数・Enum
│   └── utils/                # ユーティリティ関数
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

# DBマイグレーション
npm run db:migrate --workspace=backend

# 開発サーバー起動（frontend + backend 同時）
npm run dev
```

## shared の使い方

frontend・backend どちらからも `@shared/*` でインポートできます：

```ts
import { createUserSchema } from '@shared/schemas/user'
import type { User } from '@shared/types/user'
import { UserRole } from '@shared/constants/roles'
```

shared に追加するもの・しないものの基準：

- **追加する**: 型定義・バリデーションスキーマ・定数・純粋なユーティリティ関数
- **追加しない**: UIコンポーネント・DB接続・認証ロジック・環境変数依存のコード

## 主要コマンド

```bash
npm run dev               # frontend + backend 同時起動
npm run dev:frontend      # frontend のみ起動
npm run dev:backend       # backend のみ起動
npm run shared:check      # shared の型チェック
npm run spellcheck        # スペルチェック（全体）
npm run docker:up         # PostgreSQL 起動
npm run docker:down       # PostgreSQL 停止
```

## コーディング規約

- frontend: [docs/frontend-coding-rules.md](docs/frontend-coding-rules.md) 参照
- backend: [docs/backend-coding-rules.md](docs/backend-coding-rules.md) 参照

## テスト

### Unit テスト（backend）

```bash
npm run test --workspace=backend          # watch モード
npm run test:run --workspace=backend      # 1回実行（CI用）
npm run test:coverage --workspace=backend # カバレッジ確認
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

詳細: [docs/e2e-testing-rules.md](docs/e2e-testing-rules.md)

## Linter / Formatter

frontend は Biome を使用しています。

```bash
# チェック
npm run lint --workspace=frontend

# 自動修正
npm run lint:fix --workspace=frontend
```
