# frontend コーディング規約

## TypeScript

| ルール | 内容 |
|---|---|
| strict モード | 常に有効 |
| `any` 禁止 | 型が不明な場合は `unknown` を使う |
| 型定義 | `interface` より `type` を優先 |
| 関数の型 | 引数・戻り値に必ず型を明示 |
| 非 null アサーション（`!`） | 使用禁止 |
| 型推論 | 推論できる場合は型注釈を省略してよい |

---

## React コンポーネント

- 関数宣言（`function`）で定義する
- ファイル名・コンポーネント名は PascalCase
- 1ファイル1コンポーネントを原則とする
- Props の型定義はコンポーネントの直上に記載する
- `named export` を使用する（`default export` は使わない）

**ファイル構成順序**

1. import
2. 型定義（Props 等）
3. コンポーネント本体
4. export

```tsx
type Props = {
  name: string
  onClick: () => void
}

export function UserCard({ name, onClick }: Props) {
  return <div onClick={onClick}>{name}</div>
}
```

---

## フォーム

- **React Hook Form + zod** を使用する
- バリデーションスキーマは `shared/schemas/` を優先して使う
- `shared` に定義がない場合のみ `frontend` 内に定義する
- `Controller` を使う場合はフォーム専用ラッパーコンポーネント（`*Field`）に切り出す

```tsx
// ✅ Controller は EmailInputField のような *Field コンポーネントに分離
<EmailInputField name="email" control={control} required />

// ❌ Controller を Input コンポーネント自体に含めない
```

---

## shadcn/ui + Tailwind CSS

- スタイリングは **Tailwind CSS のユーティリティクラス** のみ使用する
- カスタム CSS ファイルは作成しない
- shadcn/ui のコンポーネントは `Field` でラップしてから使用する
- クラス名の結合には `cn()` ユーティリティを使用する

```tsx
import { cn } from '@/lib/utils'

<div className={cn('flex items-center gap-2', className)} />
```

---

## ディレクトリ構成

```
frontend/src/
├── components/
│   ├── ui/         # shadcn/ui ベースの汎用 UI コンポーネント
│   └── features/   # 機能単位のコンポーネント
├── hooks/          # カスタムフック（useXxx.ts）
├── pages/          # ページコンポーネント
├── types/          # frontend 固有の型定義
└── utils/          # frontend 固有のユーティリティ
```

> フロントとバック共通の型は `shared/types/`、スキーマは `shared/schemas/` を使う。

---

## 命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| コンポーネント | PascalCase | `UserCard.tsx` |
| カスタムフック | camelCase・`use` プレフィックス | `useUserForm.ts` |
| 定数 | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 関数・変数 | camelCase | `fetchUserList` |
| 型（type） | PascalCase | `UserCardProps` |

---

## import ルール

- **絶対パスを使用する**（相対パスは同一ディレクトリ内のみ許可）
- import の順序：
  1. React
  2. 外部ライブラリ
  3. `@shared/`
  4. `@/`（内部モジュール）
  5. 相対パス（`./`）

```ts
import { useState } from 'react'

import { useForm } from 'react-hook-form'

import type { User } from '@shared/types/user'

import { UserCard } from '@/components/ui/UserCard'

import { formatDate } from './utils'
```

---

## コンポーネント設計

### Presentational / Container

| 種別 | 役割 |
|---|---|
| Presentational | UI のみ・props で受け取る・テストしやすい |
| Container | データ取得・状態管理・Presentational に渡す |

### カスタムフックへの分離

- コンポーネント内に複雑なロジックを書かない
- `useXxx.ts` としてフックに分離する

### Props のバケツリレー

- 3階層を超えたら Context または状態管理を検討する

---

## README.md の管理

- 画面・コンポーネントには `README.md` を付属させる
- 編集・変更したファイルに `README.md` が存在する場合は必ず合わせて更新すること
- 新規にコンポーネント・画面を作成する場合は `README.md` も同時に作成すること

**README.md に記載する内容：**

- コンポーネント・画面の概要（何をするものか）
- Props の説明（型・必須かどうか・説明）
- 使用例（コードスニペット）
- 注意事項（あれば）

**例：**

```md
# UserCard

ユーザー情報を表示するカードコンポーネント。

## Props

| 名前 | 型 | 必須 | 説明 |
|---|---|---|---|
| name | string | ✓ | ユーザー名 |
| email | string | ✓ | メールアドレス |
| onClick | () => void | - | クリック時のハンドラ |

## 使用例

\`\`\`tsx
<UserCard
  name="山田太郎"
  email="yamada@example.com"
  onClick={() => console.log('clicked')}
/>
\`\`\`
```

---

## Linter / Formatter

Biome を使用しています。

| 設定 | 値 |
|---|---|
| インデント | タブ |
| クォート | ダブルクォート |
| `noExplicitAny` | error |
| `noNonNullAssertion` | error |

```bash
# チェック
npm run lint --workspace=frontend

# 自動修正
npm run lint:fix --workspace=frontend
```
